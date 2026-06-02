import * as XLSX from "xlsx";
import { SalesMasterRow } from "./salesMasterData";
import { SalesDataRecord } from "./dummyData";

export const TARGET_SALES_HEADERS = [
  "Master Item Name", "Master Category", "Sales Type", "Date", "Timestamp",
  "Invoice No.", "Item Name", "Price", "Qty.", "Sub Total", "Discount",
  "Tax", "Final Total", "Table No.", "Server Name", "Covers",
  "Variation", "Category", "HSN", "Code"
];

export const normalizeItemName = (text: any): string => {
  if (text === null || text === undefined) {
    return "";
  }
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
};

const getCellValue = (ws: XLSX.WorkSheet, r: number, c: number): any => {
  const cellRef = XLSX.utils.encode_cell({ r, c });
  const cell = ws[cellRef];
  return cell ? cell.v : null;
};

export interface FileInputData {
  buffer: ArrayBuffer;
  fileName: string;
}

/**
 * Builds standard dual lookup dictionaries based on Sales Master records:
 * 1. channelSpecific: combining platform_name (normalized) and platform_item_name (normalized)
 * 2. nameOnly: matching platform_item_name (normalized)
 */
export const buildSalesMasterLookup = (salesMasterList: SalesMasterRow[]) => {
  const channelSpecificLookup: Record<string, { code: string; masterItemName: string; masterCategory: string }> = {};
  const nameOnlyLookup: Record<string, { code: string; masterItemName: string; masterCategory: string }> = {};

  (salesMasterList || []).forEach((row) => {
    const itemNameKey = normalizeItemName(row.platformItemName);
    if (!itemNameKey) return;

    const entry = {
      code: row.itemCode || "",
      masterItemName: row.masterName || "",
      masterCategory: row.categoryName || "",
    };

    // Store in general name-only lookup
    nameOnlyLookup[itemNameKey] = entry;

    // Store in channel-specific lookup (e.g. "offline_badammilk", "kiosk_badammilk")
    const channelKey = `${normalizeItemName(row.platformName)}_${itemNameKey}`;
    channelSpecificLookup[channelKey] = entry;
  });

  return { channelSpecificLookup, nameOnlyLookup };
};

/**
 * Resolves source column index with synonym fallback to support various ledger structures.
 */
const resolveSourceColIdx = (targetHeader: string, sourceHeaders: Record<string, number>): number | undefined => {
  const normTarget = targetHeader.toLowerCase().trim();

  const possibleSynonyms: Record<string, string[]> = {
    "item name": ["item name", "item_name", "item", "items", "particulars", "menu item", "product name", "product_name", "name", "name one", "itemwise", "item description"],
    "qty.": ["qty.", "qty", "quantity", "quantity sold", "quantity_sold", "count", "qty sold", "sold qty", "net qty", "billing qty"],
    "price": ["price", "rate", "unit price", "unit_price", "mrp", "item rate", "avg price"],
    "final total": ["final total", "final_total", "total amount", "total_amount", "amount", "net amount", "grand total", "grand_total", "total", "net value", "gross total", "bill total"],
    "invoice no.": ["invoice no.", "invoice no", "invoice_no", "invoice number", "bill no.", "bill no", "bill_no", "bill number", "ticket number", "order number", "order_id", "invoice_id"],
    "date": ["date", "bill date", "order date", "invoice date", "sales date", "transaction date"],
    "timestamp": ["timestamp", "time", "order time", "bill time", "created_at"],
    "tax": ["tax", "gst", "cgst", "sgst", "taxes", "tax value", "tax detail", "total gst"],
    "discount": ["discount", "discounts", "disc", "discount value", "disc amount", "total discount"],
    "sub total": ["sub total", "sub_total", "taxable value", "taxable_value", "taxable amount", "subtotal", "base value"],
    "table no.": ["table no.", "table no", "table_no", "table number", "table", "dinein table", "table id"],
    "server name": ["server name", "server_name", "waiter", "waiter name", "server", "captain", "waitername"],
    "covers": ["covers", "pax", "cover count", "guests", "no of pax"],
    "variation": ["variation", "variant", "size", "modifications"],
    "category": ["category", "item category", "menu category", "group", "itemgroup"],
    "hsn": ["hsn", "hsn code", "hsn_code", "sac"],
    "code": ["code", "item code", "item_code", "product code", "master code", "master_code", "pos code"]
  };

  // Direct exact match
  if (sourceHeaders[normTarget] !== undefined) {
    return sourceHeaders[normTarget];
  }

  // Synonym list match
  const synonyms = possibleSynonyms[normTarget] || [];
  for (const syn of synonyms) {
    if (sourceHeaders[syn] !== undefined) {
      return sourceHeaders[syn];
    }
  }

  // Fuzzy containment match
  for (const [sName, sCol] of Object.entries(sourceHeaders)) {
    if (sName.includes(normTarget) || normTarget.includes(sName)) {
      return sCol;
    }
    for (const syn of synonyms) {
      if (sName.includes(syn) || syn.includes(sName)) {
        return sCol;
      }
    }
  }

  return undefined;
};

/**
 * Generic Ingest Function with flexible scanning that finds the best header row dynamically.
 */
const ingestExcelToSheet = (
  ws: XLSX.WorkSheet,
  salesTypeValue: string,
  lookups: { channelSpecificLookup: Record<string, any>; nameOnlyLookup: Record<string, any> },
  headerRow: number = 6,
  dataStartRow: number = 8
): any[] => {
  const range = XLSX.utils.decode_range(ws["!ref"] || "A1:A1");
  const maxCol = range.e.c;
  const maxRow = range.e.r;

  let headerRowIdx = headerRow - 1;
  let dataStartRowIdx = dataStartRow - 1;

  // Let's scan the first 15 rows to locate the row that matches crucial headers
  const keywords = ["item", "qty", "quantity", "price", "invoice", "total", "bill", "date", "particulars"];
  let detectedHeaderRowIdx = -1;
  let maxMatchedCols = 0;

  for (let r = 0; r <= Math.min(15, maxRow); r++) {
    let matchedCount = 0;
    for (let c = 0; c <= maxCol; c++) {
      const val = getCellValue(ws, r, c);
      if (val !== null && val !== undefined) {
        const textStr = String(val).toLowerCase();
        if (keywords.some((keyword) => textStr.includes(keyword))) {
          matchedCount++;
        }
      }
    }
    if (matchedCount > maxMatchedCols) {
      maxMatchedCols = matchedCount;
      detectedHeaderRowIdx = r;
    }
  }

  if (maxMatchedCols >= 2 && detectedHeaderRowIdx !== -1) {
    headerRowIdx = detectedHeaderRowIdx;
    dataStartRowIdx = detectedHeaderRowIdx + 1;
  }

  // Read headers
  const sourceHeaders: Record<string, number> = {};
  for (let c = 0; c <= maxCol; c++) {
    const val = getCellValue(ws, headerRowIdx, c);
    if (val !== null && val !== undefined) {
      sourceHeaders[String(val).trim().toLowerCase()] = c;
    }
  }

  // Build column mapping
  const headerMap: Record<number, number> = {};
  TARGET_SALES_HEADERS.forEach((header, targetColIdx) => {
    const sourceIdx = resolveSourceColIdx(header, sourceHeaders);
    if (sourceIdx !== undefined) {
      headerMap[targetColIdx] = sourceIdx;
    }
  });

  const parsedRows: any[] = [];

  // Parse records
  for (let r = dataStartRowIdx; r <= maxRow; r++) {
    let isEmpty = true;
    const targetRow: Record<string, any> = {};

    TARGET_SALES_HEADERS.forEach((header) => {
      targetRow[header] = "";
    });

    Object.entries(headerMap).forEach(([tColStr, sColIdx]) => {
      const tCol = parseInt(tColStr);
      const val = getCellValue(ws, r, sColIdx);
      if (val !== null && val !== undefined && val !== "") {
        isEmpty = false;
      }
      const headerName = TARGET_SALES_HEADERS[tCol];
      targetRow[headerName] = val !== null && val !== undefined ? val : "";
    });

    if (!isEmpty) {
      targetRow["Sales Type"] = salesTypeValue;

      const itemNameVal = targetRow["Item Name"];
      const key = normalizeItemName(itemNameVal);

      if (key) {
        // Find channel specific lookup
        let resolvedChannel = "offline";
        const sType = (salesTypeValue || "").toLowerCase();
        if (sType.includes("offline")) resolvedChannel = "offline";
        else if (sType.includes("online")) resolvedChannel = "online";
        else if (sType.includes("complimentary")) resolvedChannel = "complimentary";
        else if (sType.includes("kiosk")) resolvedChannel = "kiosk";
        else if (sType.includes("addon")) resolvedChannel = "addon";
        else if (sType.includes("staff")) resolvedChannel = "staff";

        const channelKey = `${resolvedChannel}_${key}`;
        const data = lookups.channelSpecificLookup[channelKey] || lookups.nameOnlyLookup[key];

        if (data) {
          targetRow["Code"] = data.code;
          targetRow["Master Item Name"] = data.masterItemName;
          targetRow["Master Category"] = data.masterCategory;
        }
      }

      parsedRows.push(targetRow);
    }
  }

  return parsedRows;
};

/**
 * Kiosk processor for custom multi-panel terminal orders
 */
const processKioskFile = (
  ws: XLSX.WorkSheet,
  lookups: { channelSpecificLookup: Record<string, any>; nameOnlyLookup: Record<string, any> },
  mapping: Record<string, string>
): any[] => {
  const range = XLSX.utils.decode_range(ws["!ref"] || "A1:A1");
  const maxCol = range.e.c;
  const maxRow = range.e.r;

  // Read headers at first row (0-indexed 0)
  const sourceHeaders: Record<string, number> = {};
  for (let c = 0; c <= maxCol; c++) {
    const val = getCellValue(ws, 0, c);
    if (val !== null && val !== undefined) {
      sourceHeaders[String(val).trim().toLowerCase()] = c;
    }
  }

  const headerMap: Record<number, number> = {};
  TARGET_SALES_HEADERS.forEach((header, targetColIdx) => {
    const mapVal = mapping[header];
    if (mapVal) {
      const sourceName = mapVal.toLowerCase();
      if (sourceHeaders[sourceName] !== undefined) {
        headerMap[targetColIdx] = sourceHeaders[sourceName];
      }
    } else {
      const sourceIdx = resolveSourceColIdx(header, sourceHeaders);
      if (sourceIdx !== undefined) {
        headerMap[targetColIdx] = sourceIdx;
      }
    }
  });

  const parsedRows: any[] = [];
  // Row starts at 1
  for (let r = 1; r <= maxRow; r++) {
    // Break if col 15 (O, 0-indexed 14) formula or value is SUM
    const colOVal = getCellValue(ws, r, 14);
    const cellRef = XLSX.utils.encode_cell({ r, c: 14 });
    const cellObj = ws[cellRef];
    const isSumFormula =
      (cellObj?.f && cellObj.f.trim().toUpperCase().startsWith("SUM(")) ||
      String(colOVal || "").trim().toUpperCase().startsWith("=SUM(");

    if (isSumFormula) {
      break;
    }

    let isEmpty = true;
    const targetRow: Record<string, any> = {};

    TARGET_SALES_HEADERS.forEach((header) => {
      targetRow[header] = "";
    });

    Object.entries(headerMap).forEach(([tColStr, sColIdx]) => {
      const tCol = parseInt(tColStr);
      const val = getCellValue(ws, r, sColIdx);
      if (val !== null && val !== undefined && val !== "") {
        isEmpty = false;
      }
      const headerName = TARGET_SALES_HEADERS[tCol];
      targetRow[headerName] = val !== null && val !== undefined ? val : "";
    });

    if (!isEmpty) {
      targetRow["Sales Type"] = "KIOSK";

      const itemNameVal = targetRow["Item Name"];
      const key = normalizeItemName(itemNameVal);

      if (key) {
        const channelKey = `kiosk_${key}`;
        const data = lookups.channelSpecificLookup[channelKey] || lookups.nameOnlyLookup[key];
        if (data) {
          targetRow["Code"] = data.code;
          targetRow["Master Item Name"] = data.masterItemName;
          targetRow["Master Category"] = data.masterCategory;
        }
      }

      parsedRows.push(targetRow);
    }
  }

  return parsedRows;
};

/**
 * Adon processor for standard dynamic items
 */
const processAdonFile = (
  ws: XLSX.WorkSheet,
  fileName: string,
  lookups: { channelSpecificLookup: Record<string, any>; nameOnlyLookup: Record<string, any> },
  fallbackDate: string
): any[] => {
  const range = XLSX.utils.decode_range(ws["!ref"] || "A1:A1");
  const maxRow = range.e.r;

  // Extract date from filename if matching (e.g. Adon 04.04.2026.xlsx -> 2026-04-04)
  let fileDate = fallbackDate;
  const dateMatch = fileName.match(/(\d{2})\.(\d{2})\.(\d{4})/);
  if (dateMatch) {
    fileDate = `${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}`;
  }

  const parsedRows: any[] = [];
  // Row starts at 11 (0-indexed 10)
  for (let r = 10; r <= maxRow; r++) {
    const colAVal = getCellValue(ws, r, 0);
    if (colAVal && String(colAVal).toLowerCase().includes("sub total")) {
      break;
    }

    const itemValue = getCellValue(ws, r, 1); // Column B -> index 1
    const qtyValue = getCellValue(ws, r, 3);  // Column D -> index 3

    if (itemValue === null && qtyValue === null) {
      continue;
    }

    const targetRow: Record<string, any> = {};
    TARGET_SALES_HEADERS.forEach((header) => {
      targetRow[header] = "";
    });

    targetRow["Item Name"] = itemValue || "";
    targetRow["Qty."] = qtyValue !== null && qtyValue !== undefined ? Number(qtyValue) : "";
    targetRow["Sales Type"] = "Addon";
    targetRow["Category"] = "Addon";
    targetRow["Date"] = fileDate;

    const key = normalizeItemName(itemValue);
    if (key) {
      const channelKey = `addon_${key}`;
      const data = lookups.channelSpecificLookup[channelKey] || lookups.nameOnlyLookup[key];
      if (data) {
        targetRow["Code"] = data.code;
        targetRow["Master Item Name"] = data.masterItemName;
        targetRow["Master Category"] = data.masterCategory;
      }
    }

    parsedRows.push(targetRow);
  }

  return parsedRows;
};

/**
 * Reads, processes, resolves, and merges all selected files into a single collection of SalesDataRecords
 */
export const mergeRawSalesFiles = (
  files: {
    offline?: FileInputData;
    online?: FileInputData;
    complimentary?: FileInputData;
    kiosk?: FileInputData;
    adon?: FileInputData;
  },
  salesMasterList: SalesMasterRow[],
  fallbackDate: string
): SalesDataRecord[] => {
  const lookups = buildSalesMasterLookup(salesMasterList);
  const mergedRaw: any[] = [];

  const kioskMapping = {
    "Item Name": "Name One",
    "Invoice No.": "Bill No",
    "Date": "Date",
    "Timestamp": "Time",
    "Final Total": "Total",
    "Tax": "Tax",
    "Qty.": "Quantity",
    "Sub Total": "Taxable Value"
  };

  // 1. Process Offline
  if (files.offline) {
    const wb = XLSX.read(files.offline.buffer, { type: "array" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const offlineRows = ingestExcelToSheet(ws, "Petpooja-offline", lookups, 6, 8);
    mergedRaw.push(...offlineRows);
  }

  // 2. Process Online
  if (files.online) {
    const wb = XLSX.read(files.online.buffer, { type: "array" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const onlineRows = ingestExcelToSheet(ws, "Petpooja-online", lookups, 6, 8);
    mergedRaw.push(...onlineRows);
  }

  // 3. Process Complimentary
  if (files.complimentary) {
    const wb = XLSX.read(files.complimentary.buffer, { type: "array" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const complimentaryRows = ingestExcelToSheet(ws, "Complimentary", lookups, 6, 8);
    mergedRaw.push(...complimentaryRows);
  }

  // 4. Process Kiosk
  if (files.kiosk) {
    const wb = XLSX.read(files.kiosk.buffer, { type: "array" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const kioskRows = processKioskFile(ws, lookups, kioskMapping);
    mergedRaw.push(...kioskRows);
  }

  // 5. Process Adon
  if (files.adon) {
    const wb = XLSX.read(files.adon.buffer, { type: "array" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const adonRows = processAdonFile(ws, files.adon.fileName, lookups, fallbackDate);
    mergedRaw.push(...adonRows);
  }

  // Map to strongly-typed SalesDataRecord objects
  return mergedRaw.map((row) => ({
    masterItemName: String(row["Master Item Name"] || ""),
    masterCategory: String(row["Master Category"] || ""),
    salesType: String(row["Sales Type"] || ""),
    date: String(row["Date"] || ""),
    timestamp: String(row["Timestamp"] || ""),
    invoiceNo: String(row["Invoice No."] || ""),
    itemName: String(row["Item Name"] || ""),
    price: parseFloat(row["Price"]) || 0,
    qty: parseFloat(row["Qty."]) || 0,
    subTotal: parseFloat(row["Sub Total"]) || 0,
    discount: parseFloat(row["Discount"]) || 0,
    tax: parseFloat(row["Tax"]) || 0,
    finalTotal: parseFloat(row["Final Total"]) || 0,
    tableNo: String(row["Table No."] || ""),
    serverName: String(row["Server Name"] || ""),
    covers: parseInt(row["Covers"]) || 0,
    variation: String(row["Variation"] || ""),
    category: String(row["Category"] || ""),
    hsn: String(row["HSN"] || ""),
    code: String(row["Code"] || "")
  }));
};

