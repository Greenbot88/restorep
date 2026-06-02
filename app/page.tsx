"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { 
  Plus, 
  Trash2, 
  Search, 
  ChevronDown, 
  Database, 
  RefreshCw, 
  Download, 
  CheckCircle,
  AlertTriangle,
  FileSpreadsheet,
  AlertCircle,
  HelpCircle
} from "lucide-react";

// Import modules & data
import { 
  INITIAL_MENU, 
  INITIAL_PRODUCTION, 
  INITIAL_WASTAGE, 
  INITIAL_SALES, 
  INITIAL_STAFF_FOOD, 
  INITIAL_BATTER_RECONCILIATION, 
  INITIAL_ITEM_COUNT,
  MenuItem,
  ProductionRecord,
  WastageRecord,
  SalesRecord,
  StaffFoodRecord,
  BatterReconciliation,
  ItemCountRecord,
  SalesDataRecord
} from "@/lib/dummyData";

import DashboardHeader from "@/components/DashboardHeader";
import DashboardSidebar from "@/components/DashboardSidebar";
import DashboardCharts from "@/components/DashboardCharts";
import AIAdvisor from "@/components/AIAdvisor";

import { mergeRawSalesFiles } from "@/lib/salesDataMerger";

// Import Supabase Client & Operations
import {
  isSupabaseConfigured,
  fetchAllSupabaseData,
  syncAllToSupabase,
  getSupabaseSetupSQL,
} from "@/lib/supabaseClient";

import { INITIAL_SALES_MASTER, SalesMasterRow } from "@/lib/salesMasterData";

export default function Home() {
  // Navigation & Control States
  const [activeTab, setActiveTab] = useState("overview");
  const [activeBranch, setActiveBranch] = useState("Indiranagar");
  const [reportDate, setReportDate] = useState("2026-04-27");
  const [searchQuery, setSearchQuery] = useState("");
  const [uomFilter, setUomFilter] = useState("All UOM");
  const [smPlatformFilter, setSmPlatformFilter] = useState("All Platforms");
  const [smCategoryFilter, setSmCategoryFilter] = useState("All Categories");

  // Core Data State Engine
  const [menuList, setMenuList] = useState<MenuItem[]>(INITIAL_MENU);
  const [salesMasterList, setSalesMasterList] = useState<SalesMasterRow[]>(INITIAL_SALES_MASTER);
  const [productionList, setProductionList] = useState<ProductionRecord[]>(INITIAL_PRODUCTION);
  const [wastageList, setWastageList] = useState<WastageRecord[]>(INITIAL_WASTAGE);
  const [salesList, setSalesList] = useState<SalesRecord[]>(INITIAL_SALES);
  const [staffFoodList, setStaffFoodList] = useState<StaffFoodRecord[]>(INITIAL_STAFF_FOOD);
  const [batterReconList, setBatterReconList] = useState<BatterReconciliation[]>(INITIAL_BATTER_RECONCILIATION);
  const [itemCountList, setItemCountList] = useState<ItemCountRecord[]>(INITIAL_ITEM_COUNT);

  // Consolidated Raw Sales DB ledger state
  const [salesDataList, setSalesDataList] = useState<SalesDataRecord[]>([]);
  const [salesDataSubTab, setSalesDataSubTab] = useState<"uploaded" | "simulated">("uploaded");
  const [rawFiles, setRawFiles] = useState<{
    offline?: { name: string; buffer: ArrayBuffer };
    online?: { name: string; buffer: ArrayBuffer };
    complimentary?: { name: string; buffer: ArrayBuffer };
    kiosk?: { name: string; buffer: ArrayBuffer };
    adon?: { name: string; buffer: ArrayBuffer };
  }>({});

  // Interface notification and tickers
  const [notifications, setNotifications] = useState<string[]>([
    "Report loaded for Indiranagar branch.",
    "Alert: High Shift-2 wastage detected on Khali Dosa Batter!"
  ]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [posSimulationActive, setPosSimulationActive] = useState(true);
  const [simulationLogs, setSimulationLogs] = useState<{ id: string; time: string; msg: string; type: "sale" | "alert" }[]>([
    { id: "1", time: "11:42", msg: "Dine-In: +2 Masala Dosa Batter sold.", type: "sale" },
    { id: "2", time: "11:45", msg: "Online Feed: +1 Idli Batter sold.", type: "sale" }
  ]);

  // Modals / Quick Actions State
  const [showAddMenuModal, setShowAddMenuModal] = useState(false);
  const [uploadScreenMode, setUploadScreenMode] = useState<"quick" | "merger">("merger");
  const [csvText, setCsvText] = useState("");
  const [csvSuccess, setCsvSuccess] = useState<string | null>(null);
  const [csvError, setCsvError] = useState<string | null>(null);
  
  const [smCsvText, setSmCsvText] = useState("");
  const [smCsvSuccess, setSmCsvSuccess] = useState<string | null>(null);
  const [smCsvError, setSmCsvError] = useState<string | null>(null);

  // New item inputs
  const [newMenuCode, setNewMenuCode] = useState("");
  const [newMenuName, setNewMenuName] = useState("");
  const [newMenuUom, setNewMenuUom] = useState("KG");
  const [newMenuCost, setNewMenuCost] = useState("45");
  const [newMenuPrice, setNewMenuPrice] = useState("120");
  const [newMenuCat, setNewMenuCat] = useState<any>("Batter");

  // Supabase connection & synchronization states
  const [supabaseReady, setSupabaseReady] = useState(false);
  const [dbSyncStatus, setDbSyncStatus] = useState<"not_configured" | "idle" | "syncing" | "success" | "error">("idle");
  const [dbSyncMessage, setDbSyncMessage] = useState("");
  const [showSqlModal, setShowSqlModal] = useState(false);

  const handleFetchFromSupabase = async () => {
    setDbSyncStatus("syncing");
    setDbSyncMessage("Fetching database records from Supabase tables...");
    const result = await fetchAllSupabaseData();
    if (!result) {
      setDbSyncStatus("error");
      setDbSyncMessage("Failed to initiate Supabase database connection.");
      return;
    }

    if (result.error) {
      setDbSyncStatus("error");
      setDbSyncMessage(result.error);
      setNotifications((prev) => ["Supabase Data Load check failed. Verify SQL Editor tables are prepared.", ...prev]);
    } else {
      if (result.menuList && result.menuList.length > 0) setMenuList(result.menuList);
      if (result.productionList && result.productionList.length > 0) setProductionList(result.productionList);
      if (result.wastageList && result.wastageList.length > 0) setWastageList(result.wastageList);
      if (result.salesList && result.salesList.length > 0) setSalesList(result.salesList);
      if (result.staffFoodList && result.staffFoodList.length > 0) setStaffFoodList(result.staffFoodList);
      if (result.batterReconList && result.batterReconList.length > 0) setBatterReconList(result.batterReconList);
      if (result.itemCountList && result.itemCountList.length > 0) setItemCountList(result.itemCountList);
      if (result.salesMasterList && result.salesMasterList.length > 0) setSalesMasterList(result.salesMasterList);
      if (result.salesDataList && result.salesDataList.length > 0) setSalesDataList(result.salesDataList);

      setDbSyncStatus("success");
      setDbSyncMessage("Successfully synchronized restaurant state with live Supabase database!");
      setNotifications((prev) => ["Database Synced: Loaded live records from Supabase.", ...prev]);
    }
  };

  // Auto-connect and sync on start
  useEffect(() => {
    const ready = isSupabaseConfigured();
    setTimeout(() => {
      setSupabaseReady(ready);
      if (!ready) {
        setDbSyncStatus("not_configured");
        setDbSyncMessage("Supabase is in client-offline mode (using local memory data). Run your environment URL & ANON Key inside the platform secrets or settings to synchronize with the cloud database.");
      } else {
        handleFetchFromSupabase();
      }
    }, 0);
  }, []);

  const handleFileChange = (key: 'offline' | 'online' | 'complimentary' | 'kiosk' | 'adon', file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const buffer = e.target?.result as ArrayBuffer;
      setRawFiles((prev) => ({
        ...prev,
        [key]: {
          name: file.name,
          buffer: buffer,
        },
      }));
    };
    reader.readAsArrayBuffer(file);
  };

  const [isMerging, setIsMerging] = useState(false);
  const [mergeError, setMergeError] = useState<string | null>(null);
  const [mergeSuccess, setMergeSuccess] = useState<string | null>(null);

  const handleMergeAndProcessSalesFiles = async () => {
    setMergeError(null);
    setMergeSuccess(null);

    const keys = Object.keys(rawFiles);
    if (keys.length === 0) {
      setMergeError("Please upload at least one raw sales file (Offline, Online, Complimentary, Kiosk, or Adon) to merge.");
      return;
    }

    try {
      setIsMerging(true);
      const filesPayload: any = {};
      if (rawFiles.offline) {
        filesPayload.offline = { buffer: rawFiles.offline.buffer, fileName: rawFiles.offline.name };
      }
      if (rawFiles.online) {
        filesPayload.online = { buffer: rawFiles.online.buffer, fileName: rawFiles.online.name };
      }
      if (rawFiles.complimentary) {
        filesPayload.complimentary = { buffer: rawFiles.complimentary.buffer, fileName: rawFiles.complimentary.name };
      }
      if (rawFiles.kiosk) {
        filesPayload.kiosk = { buffer: rawFiles.kiosk.buffer, fileName: rawFiles.kiosk.name };
      }
      if (rawFiles.adon) {
        filesPayload.adon = { buffer: rawFiles.adon.buffer, fileName: rawFiles.adon.name };
      }

      const mergedList = mergeRawSalesFiles(filesPayload, salesMasterList, reportDate);

      if (mergedList.length === 0) {
        setMergeError("Merchant parser completed but 0 rows were found inside the sheets or they did not match typical structure.");
        setIsMerging(false);
        return;
      }

      setSalesDataList(mergedList);

      // Now push to Supabase if configured!
      let subMessage = "";
      if (isSupabaseConfigured()) {
        const { pushSalesDataToSupabase } = await import("@/lib/supabaseClient");
        const res = await pushSalesDataToSupabase(mergedList);
        if (res.error) {
          subMessage = ` Local merge OK, but Supabase syncer failed: ${res.error}`;
        } else {
          subMessage = " & successfully synchronized + deep merged into active Supabase SQL table 'sales_data'!";
        }
      } else {
        subMessage = " (Stored in active memory. Connect Supabase to write to 'sales_data' db table!)";
      }

      // Calculate some quick stats
      const totalRevenue = mergedList.reduce((acc, row) => acc + row.finalTotal, 0);
      const unmapped = mergedList.filter(row => !row.code).length;

      setMergeSuccess(`Successfully ingested & resolved ${mergedList.length} transactions across active sources! Total Consolidated Value: ₹${totalRevenue.toLocaleString()}.${unmapped > 0 ? ` Note: ${unmapped} rows have missing code mappings in Sales Master.` : ""}${subMessage}`);
      setNotifications(prev => [`Processed & merged ${mergedList.length} sales lines.`, ...prev]);
      
      // Redirect users to see the result list!
      setActiveTab("sales-data");
      setSalesDataSubTab("uploaded");
    } catch (err: any) {
      console.error(err);
      setMergeError(`Merge pipeline error: ${err.message || err}`);
    } finally {
      setIsMerging(false);
    }
  };

  const handlePushToSupabase = async () => {
    setDbSyncStatus("syncing");
    setDbSyncMessage("Pushing current restaurant state & logs to Supabase cloud tables...");
    const result = await syncAllToSupabase(
      menuList,
      productionList,
      wastageList,
      salesList,
      staffFoodList,
      batterReconList,
      itemCountList,
      salesMasterList
    );

    if (result.error) {
      setDbSyncStatus("error");
      setDbSyncMessage(result.error);
      setNotifications((prev) => ["Supabase Cloud Push failed. Check table definitions.", ...prev]);
    } else {
      setDbSyncStatus("success");
      setDbSyncMessage("Saved all restaurant items, transactions, and wastage logs to Supabase successfully!");
      setNotifications((prev) => ["Database Save complete: Cloud mirror up-to-date.", ...prev]);
    }
  };

  // Ref for tickers auto-scrolling
  const logsEndRef = useRef<HTMLDivElement>(null);

  // POS Tick Simulator loop
  useEffect(() => {
    if (!posSimulationActive) return;

    const interval = setInterval(() => {
      // Pick a random menu item
      const item = menuList[Math.floor(Math.random() * menuList.length)];
      // Random quantity
      const qty = Math.floor(Math.random() * 5) + 1;
      // Random channel
      const channels: Array<SalesRecord["channel"]> = ["DineIn", "Takeaway", "Online"];
      const channel = channels[Math.floor(Math.random() * channels.length)];
      // Random shift based on hours (standard 1 or 2)
      const shift = Math.random() > 0.4 ? (1 as const) : (2 as const);

      // Increment live transactions
      setSalesList((prev) => {
        const updated = [...prev];
        updated.push({ itemCode: item.itemCode, qtySold: qty, shift, channel });
        return updated;
      });

      // Append logs
      const d = new Date();
      const timeStr = d.toTimeString().split(" ")[0].slice(0, 5);
      const newLog = {
        id: String(Date.now()),
        time: timeStr,
        msg: `Simulation Tick: Solved +${qty} ${item.itemName} (${item.uom}) sold via ${channel}.`,
        type: "sale" as const,
      };

      setSimulationLogs((prev) => [...prev.slice(-15), newLog]);

      // Occassional wastage flag alerts
      if (Math.random() > 0.85) {
        const wasteQty = Math.floor(Math.random() * 2) + 1;
        setWastageList((prev) => {
          return prev.map((w) => {
            if (w.itemCode === item.itemCode) {
              return { ...w, wasteShift2: w.wasteShift2 + wasteQty };
            }
            return w;
          });
        });

        const alertLog = {
          id: String(Date.now() + 1),
          time: timeStr,
          msg: `Spill Alert!! +${wasteQty} ${item.uom} of ${item.itemName} flagged as spoiled under Shift 2.`,
          type: "alert" as const,
        };
        setSimulationLogs((prev) => [...prev.slice(-15), alertLog]);
        setNotifications((prev) => [`Automatic Spill Detection: ${item.itemName}`, ...prev]);
      }
    }, 4500);

    return () => clearInterval(interval);
  }, [posSimulationActive, menuList]);

  // Scroll ticker
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [simulationLogs]);

  // Helper filters
  const uniqueUoms = useMemo(() => {
    const list = new Set(menuList.map((m) => m.uom));
    return ["All UOM", ...Array.from(list)];
  }, [menuList]);

  const uniquePlatforms = useMemo(() => {
    const list = new Set(salesMasterList.map((sm) => sm.platformName).filter(Boolean));
    return ["All Platforms", ...Array.from(list).sort()];
  }, [salesMasterList]);

  const uniqueCategories = useMemo(() => {
    const list = new Set(salesMasterList.map((sm) => sm.categoryName).filter(Boolean));
    return ["All Categories", ...Array.from(list).sort()];
  }, [salesMasterList]);

  // Handle direct cell editing for cell-by-cell manipulation
  const updateProdState = (itemCode: string, field: "prodShift1" | "prodShift2", val: number) => {
    setProductionList((prev) =>
      prev.map((rec) => (rec.itemCode === itemCode ? { ...rec, [field]: val } : rec))
    );
  };

  const updateWasteState = (itemCode: string, field: "wasteShift1" | "wasteShift2", val: number) => {
    setWastageList((prev) =>
      prev.map((rec) => (rec.itemCode === itemCode ? { ...rec, [field]: val } : rec))
    );
  };

  const updateSalesQtyState = (itemCode: string, val: number) => {
    // Overwrite Dine-In sales to simplify consolidated live updates
    setSalesList((prev) => {
      const filtered = prev.filter((s) => s.itemCode !== itemCode);
      filtered.push({ itemCode, qtySold: val, shift: 1, channel: "DineIn" });
      return filtered;
    });
  };

  // Add Item callback
  const handleAddMenuItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMenuCode || !newMenuName) return;

    const item: MenuItem = {
      itemCode: newMenuCode.toUpperCase(),
      itemName: newMenuName,
      uom: newMenuUom,
      unitCost: parseFloat(newMenuCost) || 0,
      unitPrice: parseFloat(newMenuPrice) || 0,
      category: newMenuCat
    };

    setMenuList((prev) => [...prev, item]);
    setProductionList((prev) => [...prev, { itemCode: item.itemCode, prodShift1: 0, prodShift2: 0 }]);
    setWastageList((prev) => [...prev, { itemCode: item.itemCode, wasteShift1: 0, wasteShift2: 0 }]);
    setItemCountList((prev) => [...prev, { itemCode: item.itemCode, openingCount: 0, closingCount: 0 }]);

    setNewMenuCode("");
    setNewMenuName("");
    setShowAddMenuModal(false);
    setNotifications((prev) => [`Created menu asset ${item.itemName} successfully.`, ...prev]);
  };

  // RSP Sales Master CSV Parser
  const handleParseSalesMasterCsv = () => {
    setSmCsvSuccess(null);
    setSmCsvError(null);
    if (!smCsvText.trim()) {
      setSmCsvError("Please paste some RSP CSV rows first.");
      return;
    }

    try {
      const lines = smCsvText.split("\n");
      const parsed: SalesMasterRow[] = [];
      let successCount = 0;

      lines.forEach((line) => {
        const trimmed = line.trim();
        if (!trimmed) return;

        // Skip headers if present
        if (
          trimmed.toLowerCase().includes("platform_item") || 
          trimmed.toLowerCase().includes("master code") ||
          trimmed.toLowerCase().includes("category_name")
        ) {
          return;
        }

        // Split columns robustly
        const cols = trimmed.split(",");
        if (cols.length >= 6) {
          const masterCode = cols[0]?.trim() || "";
          const masterName = cols[1]?.trim() || "";
          const categoryName = cols[2]?.trim() || "";
          const itemCode = cols[3]?.trim() || "";
          const platformItemName = cols[4]?.trim() || "";
          const platformCategoryName = cols[5]?.trim() || "";
          const platformName = cols[6]?.trim() || "";

          parsed.push({
            masterCode,
            masterName,
            categoryName,
            itemCode,
            platformItemName,
            platformCategoryName,
            platformName,
          });
          successCount++;
        }
      });

      if (parsed.length === 0) {
        setSmCsvError("Could not parse any valid rows. Please ensure rows have at least 6 comma-separated columns.");
        return;
      }

      setSalesMasterList(parsed);
      setSmCsvSuccess(`Successfully loaded ${successCount} RSP Sales Master mapping records! If you are connected to Supabase, push to cloud to persist permanently!`);
      setSmCsvText(""); // reset text area
      setNotifications((prev) => [`Loaded ${successCount} RSP mapping entries.`, ...prev]);
    } catch (err: any) {
      setSmCsvError(`Parsing error: ${err.message || err}`);
    }
  };

  // CSV paste parser
  const handleParseCsv = () => {
    setCsvSuccess(null);
    setCsvError(null);
    if (!csvText.trim()) {
      setCsvError("Paste block cannot be empty.");
      return;
    }

    try {
      const lines = csvText.split("\n");
      let count = 0;
      
      lines.forEach((line) => {
        if (!line.trim()) return;
        const parts = line.split(",").map((p) => p.trim());
        if (parts.length < 3) return;

        const code = parts[0].toUpperCase();
        const value1 = parseFloat(parts[1]) || 0;
        const value2 = parseFloat(parts[2]) || 0;

        // Determine matching update based on keyword context
        if (activeTab === "production") {
          setProductionList((prev) =>
            prev.map((r) => (r.itemCode === code ? { ...r, prodShift1: value1, prodShift2: value2 } : r))
          );
          count++;
        } else if (activeTab === "wastage") {
          setWastageList((prev) =>
            prev.map((r) => (r.itemCode === code ? { ...r, wasteShift1: value1, wasteShift2: value2 } : r))
          );
          count++;
        } else if (activeTab === "sales") {
          updateSalesQtyState(code, value1);
          count++;
        }
      });

      setCsvSuccess(`Correctly updated production levels for ${count} cafeteria lines!`);
      setCsvText("");
    } catch (err: any) {
      setCsvError("Invalid Row Mapping: ensure formatting matches CODE, VAL1, VAL2.");
    }
  };

  // High Fidelity Computation grids for reports 
  const computedProductionVsWastage = useMemo(() => {
    return menuList
      .filter((item) => {
        const matchesSearch = item.itemName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              item.itemCode.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesUom = uomFilter === "All UOM" || item.uom === uomFilter;
        return matchesSearch && matchesUom;
      })
      .map((item) => {
        const prod = productionList.find((p) => p.itemCode === item.itemCode) || { prodShift1: 0, prodShift2: 0 };
        const prodTotal = prod.prodShift1 + prod.prodShift2;

        const waste = wastageList.find((w) => w.itemCode === item.itemCode) || { wasteShift1: 0, wasteShift2: 0 };
        const wasteTotal = waste.wasteShift1 + waste.wasteShift2;

        const wastePercent = prodTotal > 0 ? (wasteTotal / prodTotal) * 100 : 0;
        const wasteCost = wasteTotal * item.unitCost;

        return {
          ...item,
          prod,
          prodTotal,
          waste,
          wasteTotal,
          wastePercent,
          wasteCost
        };
      });
  }, [menuList, productionList, wastageList, searchQuery, uomFilter]);

  const computedProductionVsSales = useMemo(() => {
    return menuList
      .filter((item) => {
        const matchesSearch = item.itemName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              item.itemCode.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesUom = uomFilter === "All UOM" || item.uom === uomFilter;
        return matchesSearch && matchesUom;
      })
      .map((item) => {
        const prod = productionList.find((p) => p.itemCode === item.itemCode) || { prodShift1: 0, prodShift2: 0 };
        const prodTotal = prod.prodShift1 + prod.prodShift2;

        const productSales = salesList.filter((s) => s.itemCode === item.itemCode);
        const salesTotal = productSales.reduce((sum, current) => sum + current.qtySold, 0);

        const variance = prodTotal - salesTotal;
        const salesValue = salesTotal * item.unitPrice;
        const yieldPercent = prodTotal > 0 ? (salesTotal / prodTotal) * 100 : 0;

        return {
          ...item,
          prodTotal,
          salesTotal,
          variance,
          salesValue,
          yieldPercent
        };
      });
  }, [menuList, productionList, salesList, searchQuery, uomFilter]);

  const computedReconciliation = useMemo(() => {
    return menuList
      .filter((item) => {
        const matchesSearch = item.itemName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              item.itemCode.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesUom = uomFilter === "All UOM" || item.uom === uomFilter;
        return matchesSearch && matchesUom;
      })
      .map((item) => {
        const prod = productionList.find((p) => p.itemCode === item.itemCode) || { prodShift1: 0, prodShift2: 0 };
        const prodTotal = prod.prodShift1 + prod.prodShift2;

        const waste = wastageList.find((w) => w.itemCode === item.itemCode) || { wasteShift1: 0, wasteShift2: 0 };
        const wasteTotal = waste.wasteShift1 + waste.wasteShift2;

        const productSales = salesList.filter((s) => s.itemCode === item.itemCode);
        const salesTotal = productSales.reduce((sum, curr) => sum + curr.qtySold, 0);

        const staff = staffFoodList.find((st) => st.itemCode === item.itemCode) || { staffQty: 0 };
        const count = itemCountList.find((cnt) => cnt.itemCode === item.itemCode) || { openingCount: 0, closingCount: 0 };

        const expectedClosing = count.openingCount + prodTotal - salesTotal - wasteTotal - staff.staffQty;
        const variance = count.closingCount - expectedClosing;

        return {
          ...item,
          opening: count.openingCount,
          production: prodTotal,
          sales: salesTotal,
          wastage: wasteTotal,
          staff: staff.staffQty,
          expectedClosing,
          physicalClosing: count.closingCount,
          variance
        };
      });
  }, [menuList, productionList, wastageList, salesList, staffFoodList, itemCountList, searchQuery, uomFilter]);

  const sortedHighestLowestSelling = useMemo(() => {
    return menuList
      .map((item) => {
        const productSales = salesList.filter((s) => s.itemCode === item.itemCode);
        const salesTotal = productSales.reduce((sum, curr) => sum + curr.qtySold, 0);
        const salesValue = salesTotal * item.unitPrice;

        return {
          ...item,
          salesTotal,
          salesValue,
        };
      })
      .sort((a, b) => b.salesTotal - a.salesTotal);
  }, [menuList, salesList]);

  const computedStaffFood = useMemo(() => {
    return menuList
      .filter((item) => {
        const matchesSearch = item.itemName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              item.itemCode.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesUom = uomFilter === "All UOM" || item.uom === uomFilter;
        return matchesSearch && matchesUom;
      })
      .map((item) => {
        const staff = staffFoodList.find((st) => st.itemCode === item.itemCode) || { staffQty: 0 };
        const totalCost = staff.staffQty * item.unitCost;

        return {
          ...item,
          staffQty: staff.staffQty,
          unitCost: item.unitCost,
          totalCost
        };
      });
  }, [menuList, staffFoodList, searchQuery, uomFilter]);

  const computedBatterRecon = useMemo(() => {
    // Focus strictly on Batter items
    return menuList
      .filter((item) => item.category === "Batter")
      .map((item) => {
        const prod = productionList.find((p) => p.itemCode === item.itemCode) || { prodShift1: 0, prodShift2: 0 };
        const prodTotal = prod.prodShift1 + prod.prodShift2;

        const recon = batterReconList.find((b) => b.itemCode === item.itemCode) || { ingredientsIssuedKg: 0, expectedYieldKg: 0 };
        const variance = prodTotal - recon.expectedYieldKg;

        return {
          ...item,
          ingredientsIssued: recon.ingredientsIssuedKg,
          expectedYield: recon.expectedYieldKg,
          actualProduced: prodTotal,
          variance
        };
      });
  }, [menuList, productionList, batterReconList]);

  const computedJuiceAndIcecream = useMemo(() => {
    // Focus strictly on Beverages or Sweets
    return menuList
      .filter((item) => item.category === "Beverage" || item.category === "Sweets")
      .map((item) => {
        const prod = productionList.find((p) => p.itemCode === item.itemCode) || { prodShift1: 0, prodShift2: 0 };
        const prodTotal = prod.prodShift1 + prod.prodShift2;

        const waste = wastageList.find((w) => w.itemCode === item.itemCode) || { wasteShift1: 0, wasteShift2: 0 };
        const wasteTotal = waste.wasteShift1 + waste.wasteShift2;

        const productSales = salesList.filter((s) => s.itemCode === item.itemCode);
        const salesTotal = productSales.reduce((sum, curr) => sum + curr.qtySold, 0);

        return {
          ...item,
          prodTotal,
          salesTotal,
          wasteTotal,
        };
      });
  }, [menuList, productionList, salesList, wastageList]);

  return (
    <div className="flex flex-col h-screen overflow-hidden font-sans">
      
      {/* 1. STICKY TOPBAR */}
      <DashboardHeader 
        activeBranch={activeBranch} 
        setActiveBranch={setActiveBranch}
        reportDate={reportDate}
        setReportDate={setReportDate}
        posSimulationActive={posSimulationActive}
        setPosSimulationActive={setPosSimulationActive}
        notificationCount={notifications.length}
        openNotifications={() => setNotificationsOpen(!notificationsOpen)}
      />

      <div className="flex flex-1 overflow-hidden relative">

        {/* 2. STATIC LEFT SIDEBAR */}
        <DashboardSidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* 3. SCROLLABLE ACTIVE WORKSPACE */}
        <main className="flex-1 overflow-y-auto px-8 py-6 bg-slate-50 relative">

          {activeTab === "overview" && (
            <>
              {/* DYNAMIC METRIC FEED SUMMARY BENTO GRIDS */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white p-4 rounded-xl shadow-xs border border-gray-100 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-gray-400 font-mono">Consolidated Production</p>
                    <p className="text-xl font-black text-[#0a4a9b] font-mono mt-1">
                      {productionList.reduce((acc, curr) => acc + curr.prodShift1 + curr.prodShift2, 0).toLocaleString()} <span className="text-xs text-gray-400">UNITS</span>
                    </p>
                  </div>
                  <div className="p-2 bg-blue-50 text-[#0a4a9b] rounded-lg">
                    <Database className="w-5 h-5" />
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl shadow-xs border border-gray-100 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-gray-400 font-mono">Total Sales Volume</p>
                    <p className="text-xl font-black text-green-600 font-mono mt-1">
                      {salesList.reduce((acc, curr) => acc + curr.qtySold, 0).toLocaleString()} <span className="text-xs text-gray-400">UNITS</span>
                    </p>
                  </div>
                  <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl shadow-xs border border-gray-100 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-gray-400 font-mono">Wastage Index</p>
                    <p className="text-xl font-black text-rose-600 font-mono mt-1">
                      {wastageList.reduce((acc, curr) => acc + curr.wasteShift1 + curr.wasteShift2, 0).toLocaleString()} <span className="text-xs text-gray-400">UNITS</span>
                    </p>
                  </div>
                  <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl shadow-xs border border-gray-100 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-gray-400 font-mono">Simulated POS Feed</p>
                    <div className="flex items-center gap-1.5 mt-2">
                      <span className={`w-2 h-2 rounded-full ${posSimulationActive ? "bg-green-500 animate-ping" : "bg-gray-400"}`}></span>
                      <span className="text-xs font-bold text-gray-700">{posSimulationActive ? "Listening for sales" : "Paused"}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => setPosSimulationActive(!posSimulationActive)}
                    className="p-1 px-2.5 rounded-lg border border-gray-200 text-xs font-bold hover:bg-gray-50 flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Toggle
                  </button>
                </div>
              </div>

              {/* SUPABASE CONTROL STATUS PANEL */}
              <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs mb-6">
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-lg ${
                      dbSyncStatus === "success" 
                        ? "bg-green-50 text-green-600 border border-green-100" 
                        : dbSyncStatus === "not_configured" 
                        ? "bg-amber-50 text-amber-600 border border-amber-100" 
                        : dbSyncStatus === "syncing" 
                        ? "bg-blue-50 text-blue-600 border border-blue-100"
                        : "bg-red-50 text-red-600 border border-red-100"
                    }`}>
                      <Database className={`w-5 h-5 ${dbSyncStatus === "syncing" ? "animate-spin" : ""}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm text-gray-800">Supabase Cloud Database Synchronization</h3>
                        <span className={`text-[9px] font-black uppercase tracking-wider font-mono px-2 py-0.5 rounded-full ${
                          dbSyncStatus === "success" 
                            ? "bg-green-100 text-green-800" 
                            : dbSyncStatus === "not_configured"
                            ? "bg-amber-100 text-amber-800"
                            : dbSyncStatus === "syncing"
                            ? "bg-blue-100 text-blue-800 animate-pulse"
                            : "bg-red-100 text-red-800"
                        }`}>
                          {dbSyncStatus === "not_configured" ? "Offline Mode" : dbSyncStatus === "success" ? "Connected" : dbSyncStatus === "syncing" ? "Syncing..." : "Error"}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                        {dbSyncMessage}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
                    <button
                      onClick={() => setShowSqlModal(true)}
                      className="px-3.5 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-xs font-bold text-gray-600 flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-gray-500" />
                      <span>View SQL Schema Setup</span>
                    </button>

                    {supabaseReady && (
                      <>
                        <button
                          onClick={handleFetchFromSupabase}
                          disabled={dbSyncStatus === "syncing"}
                          className="px-3.5 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-xs font-bold text-gray-700 flex items-center gap-1.5 disabled:opacity-50 transition-all cursor-pointer"
                        >
                          <RefreshCw className="w-3.5 h-3.5 text-gray-500" />
                          <span>Fetch from Supabase</span>
                        </button>
                        
                        <button
                          onClick={handlePushToSupabase}
                          disabled={dbSyncStatus === "syncing"}
                          className="px-3.5 py-1.5 text-shadow rounded-lg bg-[#0a4a9b] hover:bg-[#083d80] text-white text-xs font-bold flex items-center gap-1.5 disabled:opacity-50 transition-all cursor-pointer"
                        >
                          <CheckCircle className="w-3.5 h-3.5 text-white" />
                          <span>Push Current to Cloud</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* LIVE RECOMMENDATIONS COMPONENT */}
              <AIAdvisor 
                menuList={menuList} 
                productionList={productionList} 
                wastageList={wastageList} 
                salesList={salesList} 
              />

              {/* DYNAMIC CHARTS */}
              <DashboardCharts 
                menuList={menuList} 
                productionList={productionList} 
                wastageList={wastageList} 
                salesList={salesList} 
              />
            </>
          )}

          {activeTab !== "overview" && (
            <>
              {/* TOOLBAR CONTROLS MATCHING IMAGE LAYOUT */}
              <div className="bg-white rounded-t-xl border-t border-x border-gray-200/90 p-4 flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-extrabold tracking-tight text-slate-800">
                {activeTab.replace("report-", "").replace("-", " ").toUpperCase()} VIEW
              </h2>
              <p className="text-xs text-gray-400 font-medium">Branch Indiranagar Report Base Terminal</p>
            </div>

            <div className="flex items-center gap-2.5 w-full md:w-auto">
              {/* Search input matching style */}
              <div className="relative flex-1 md:w-60">
                <Search className="absolute left-3 top-2.5 w-4.5 h-4.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search code, name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-gray-200 rounded-lg pl-9 pr-4 py-2 text-xs font-medium focus:ring-1 focus:ring-[#0a4a9b] focus:bg-white outline-none"
                />
              </div>

              {/* UOM Filter */}
              <select
                value={uomFilter}
                onChange={(e) => setUomFilter(e.target.value)}
                className="bg-slate-50 border border-gray-200 rounded-lg p-2 text-xs font-bold outline-none cursor-pointer"
                aria-label="Filter units of measure"
              >
                {uniqueUoms.map((uom) => (
                  <option key={uom} value={uom}>{uom}</option>
                ))}
              </select>

              {/* Action modals triggers */}
              <button
                onClick={() => setShowAddMenuModal(true)}
                className="bg-[#0a4a9b] hover:bg-[#083d80] text-white flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
              >
                <Plus className="w-4.5 h-4.5" />
                <span className="hidden sm:inline">Add Item</span>
              </button>
            </div>
          </div>

          {/* COMPACT VIEW CONTROLLER TABLE */}
          <div className="bg-white rounded-b-xl border-b border-x border-gray-200 overflow-x-auto shadow-xs mb-8">
            
            {/* VIEW 1: PRODUCTION VS WASTAGE (FROM SCREENSHOT) */}
            {activeTab === "report-production-wastage" && (
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead>
                  <tr className="bg-[#0a4a9b] text-white text-[11px] font-bold tracking-wider uppercase font-mono border-b border-gray-100">
                    <th className="py-3 px-4">Item Code</th>
                    <th className="py-3 px-4">Item Name</th>
                    <th className="py-3 px-4 text-center">UOM</th>
                    <th className="py-3 px-4 text-right">Prod Shift-1</th>
                    <th className="py-3 px-4 text-right">Prod Shift-2</th>
                    <th className="py-3 px-4 text-right bg-[#09418a]">Prod Total</th>
                    <th className="py-3 px-4 text-right">Waste Shift-1</th>
                    <th className="py-3 px-4 text-right">Waste Shift-2</th>
                    <th className="py-3 px-4 text-right bg-rose-950">Waste Total</th>
                    <th className="py-3 px-4 text-right">Waste %</th>
                    <th className="py-3 px-4 text-right">Waste Cost (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs font-medium text-gray-700">
                  {computedProductionVsWastage.map((row) => (
                    <tr key={row.itemCode} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-[#0a4a9b]">{row.itemCode}</td>
                      <td className="py-3 px-4 font-semibold text-gray-900">{row.itemName}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="bg-blue-50 text-[#0a4a9b] text-[10px] font-extrabold font-mono px-2 py-0.5 rounded-full">
                          {row.uom}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-gray-500">
                        <input
                          type="number"
                          value={row.prod.prodShift1}
                          onChange={(e) => updateProdState(row.itemCode, "prodShift1", parseInt(e.target.value) || 0)}
                          className="w-16 text-right font-bold bg-transparent border-b border-transparent hover:border-gray-300 focus:border-[#0a4a9b] focus:outline-none"
                          aria-label={`Prod Shift-1 for ${row.itemName}`}
                        />
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-gray-500">
                        <input
                          type="number"
                          value={row.prod.prodShift2}
                          onChange={(e) => updateProdState(row.itemCode, "prodShift2", parseInt(e.target.value) || 0)}
                          className="w-16 text-right font-bold bg-transparent border-b border-transparent hover:border-gray-300 focus:border-[#0a4a9b] focus:outline-none"
                          aria-label={`Prod Shift-2 for ${row.itemName}`}
                        />
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold bg-blue-50/50 text-[#0a4a9b]">
                        {row.prodTotal}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-gray-500">
                        <input
                          type="number"
                          value={row.waste.wasteShift1}
                          onChange={(e) => updateWasteState(row.itemCode, "wasteShift1", parseInt(e.target.value) || 0)}
                          className="w-16 text-right font-bold bg-transparent border-b border-transparent hover:border-gray-300 focus:border-[#0a4a9b] focus:outline-none"
                          aria-label={`Waste Shift-1 for ${row.itemName}`}
                        />
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-gray-500">
                        <input
                          type="number"
                          value={row.waste.wasteShift2}
                          onChange={(e) => updateWasteState(row.itemCode, "wasteShift2", parseInt(e.target.value) || 0)}
                          className="w-16 text-right font-bold bg-transparent border-b border-transparent hover:border-gray-300 focus:border-[#0a4a9b] focus:outline-none"
                          aria-label={`Waste Shift-2 for ${row.itemName}`}
                        />
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold bg-rose-50 text-rose-700">
                        {row.wasteTotal}
                      </td>
                      <td className={`py-3 px-4 text-right font-mono font-bold ${row.wastePercent > 10 ? "text-amber-600" : "text-gray-500"}`}>
                        {row.wastePercent.toFixed(1)}%
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-gray-900">
                        ₹{row.wasteCost.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                  {computedProductionVsWastage.length === 0 && (
                    <tr>
                      <td colSpan={11} className="py-10 text-center text-gray-400 font-bold">
                        No food items match the filter constraints.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}

            {/* VIEW 2: PRODUCTION VS SALES REPORT */}
            {activeTab === "report-production-sales" && (
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-[#0a4a9b] text-white text-[11px] font-bold tracking-wider uppercase font-mono">
                    <th className="py-3 px-4">Item Code</th>
                    <th className="py-3 px-4">Item Name</th>
                    <th className="py-3 px-4 text-center">UOM</th>
                    <th className="py-3 px-4 text-right">Production (IN)</th>
                    <th className="py-3 px-4 text-right">Qty Sold (OUT)</th>
                    <th className="py-3 px-4 text-right">Remaining Variance</th>
                    <th className="py-3 px-4 text-right">Yield Index</th>
                    <th className="py-3 px-4 text-right">Estimated Sales (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs font-medium text-gray-700">
                  {computedProductionVsSales.map((row) => (
                    <tr key={row.itemCode} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-[#0a4a9b]">{row.itemCode}</td>
                      <td className="py-3 px-4 font-bold text-gray-900">{row.itemName}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="bg-sky-50 text-sky-700 text-[10px] font-extrabold font-mono px-2 py-0.5 rounded-full">
                          {row.uom}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-gray-600">{row.prodTotal}</td>
                      <td className="py-3 px-4 text-right font-mono">
                        <input
                          type="number"
                          value={row.salesTotal}
                          onChange={(e) => updateSalesQtyState(row.itemCode, parseInt(e.target.value) || 0)}
                          className="w-16 text-right font-bold bg-transparent border-b border-transparent hover:border-gray-300 focus:border-[#0a4a9b] focus:outline-none"
                          aria-label={`Sales Total quantity for ${row.itemName}`}
                        />
                      </td>
                      <td className={`py-3 px-4 text-right font-mono font-bold ${row.variance < 0 ? "text-red-600" : "text-gray-500"}`}>
                        {row.variance}
                      </td>
                      <td className="py-3 px-4 text-right font-mono">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          row.yieldPercent > 90 ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"
                        }`}>
                          {row.yieldPercent.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600">
                        ₹{row.salesValue.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* VIEW 3: MAIN ITEM RECONCILIATION */}
            {activeTab === "report-reconciliation" && (
              <table className="w-full text-left border-collapse min-w-[1000px]">
                <thead>
                  <tr className="bg-[#0a4a9b] text-white text-[11px] font-bold tracking-wider uppercase font-mono">
                    <th className="py-3 px-4">Item Code</th>
                    <th className="py-3 px-4">Item Name</th>
                    <th className="py-3 px-4 text-right">Opening</th>
                    <th className="py-3 px-4 text-right">Prod (IN)</th>
                    <th className="py-3 px-4 text-right">Sold (OUT)</th>
                    <th className="py-3 px-4 text-right">Waste (OUT)</th>
                    <th className="py-3 px-4 text-right">Staff (OUT)</th>
                    <th className="py-3 px-4 text-right bg-blue-900/40">Expected Closing</th>
                    <th className="py-3 px-4 text-right bg-amber-900/40">Physical Count</th>
                    <th className="py-3 px-4 text-right">Recon Gap</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs font-medium text-gray-700">
                  {computedReconciliation.map((row) => (
                    <tr key={row.itemCode} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-gray-500">{row.itemCode}</td>
                      <td className="py-3 px-4 font-bold text-gray-900">{row.itemName}</td>
                      <td className="py-3 px-4 text-right font-mono">
                        <input
                          type="number"
                          value={row.opening}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 0;
                            setItemCountList(prev => prev.map(i => i.itemCode === row.itemCode ? { ...i, openingCount: val } : i));
                          }}
                          className="w-12 text-right font-bold bg-transparent border-b border-transparent hover:border-gray-200 focus:outline-none"
                          aria-label={`Opening Stock count for ${row.itemName}`}
                        />
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-gray-600">{row.production}</td>
                      <td className="py-3 px-4 text-right font-mono text-gray-600">{row.sales}</td>
                      <td className="py-3 px-4 text-right font-mono text-gray-600">{row.wastage}</td>
                      <td className="py-3 px-4 text-right font-mono text-gray-600">{row.staff}</td>
                      <td className="py-3 px-4 text-right font-mono font-black text-blue-700 bg-blue-50/40">{row.expectedClosing}</td>
                      <td className="py-3 px-4 text-right font-mono font-black text-amber-700 bg-amber-50/40">
                        <input
                          type="number"
                          value={row.physicalClosing}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 0;
                            setItemCountList(prev => prev.map(i => i.itemCode === row.itemCode ? { ...i, closingCount: val } : i));
                          }}
                          className="w-12 text-right font-bold bg-transparent border-b border-transparent hover:border-amber-300 focus:outline-none"
                          aria-label={`Physical closing stock count for ${row.itemName}`}
                        />
                      </td>
                      <td className={`py-3 px-4 text-right font-mono font-black ${row.variance === 0 ? "text-green-600" : "text-rose-600"}`}>
                        {row.variance > 0 ? `+${row.variance}` : row.variance}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* VIEW 4: HIGHEST AND LOWEST SELLING */}
            {activeTab === "report-highest-lowest" && (
              <div className="p-6">
                <h3 className="text-sm font-bold text-gray-800 mb-4">Volume Performance Rankings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Highest Sellers */}
                  <div className="bg-green-50/40 border border-green-100 rounded-xl p-4">
                    <h4 className="text-xs font-black text-green-800 uppercase tracking-widest font-mono mb-3">Top Kitchen Drivers</h4>
                    <div className="space-y-2">
                      {sortedHighestLowestSelling.slice(0, 5).map((item, idx) => (
                        <div key={item.itemCode} className="flex items-center justify-between p-2.5 bg-white rounded-lg shadow-2xs border border-gray-100">
                          <div className="flex items-center gap-3">
                            <span className="w-5 h-5 rounded-full bg-green-500 text-white flex items-center justify-center text-[10px] font-bold">
                              #{idx + 1}
                            </span>
                            <div>
                              <p className="text-xs font-bold text-gray-800">{item.itemName}</p>
                              <p className="text-[10px] font-mono font-semibold text-gray-400">{item.itemCode}</p>
                            </div>
                          </div>
                          <div className="text-right font-mono">
                            <p className="text-xs font-bold text-green-700">+{item.salesTotal} {item.uom}</p>
                            <p className="text-[10px] text-gray-400">₹{item.salesValue.toLocaleString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Lowest Sellers */}
                  <div className="bg-rose-50/40 border border-rose-100 rounded-xl p-4">
                    <h4 className="text-xs font-black text-rose-800 uppercase tracking-widest font-mono mb-3">Slower Stock lines</h4>
                    <div className="space-y-2">
                      {sortedHighestLowestSelling.slice(-5).reverse().map((item, idx) => (
                        <div key={item.itemCode} className="flex items-center justify-between p-2.5 bg-white rounded-lg shadow-2xs border border-gray-100">
                          <div className="flex items-center gap-3">
                            <span className="w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center text-[10px] font-bold">
                              #{idx + 1}
                            </span>
                            <div>
                              <p className="text-xs font-bold text-gray-800">{item.itemName}</p>
                              <p className="text-[10px] font-mono font-semibold text-gray-400">{item.itemCode}</p>
                            </div>
                          </div>
                          <div className="text-right font-mono">
                            <p className="text-xs font-bold text-rose-700">+{item.salesTotal} {item.uom}</p>
                            <p className="text-[10px] text-gray-400">₹{item.salesValue.toLocaleString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* VIEW 5: WASTAGE COSTING */}
            {activeTab === "report-wastage-costing" && (
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-[#0a4a9b] text-white text-[11px] font-bold tracking-wider uppercase font-mono">
                    <th className="py-3 px-4">Item Code</th>
                    <th className="py-3 px-4">Item Name</th>
                    <th className="py-3 px-4 text-center">UOM</th>
                    <th className="py-3 px-4 text-right">Wasted Value (Units)</th>
                    <th className="py-3 px-4 text-right">Standard Ing. Cost (₹)</th>
                    <th className="py-3 px-4 text-right">Financial Rupee Loss (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs font-medium text-gray-700">
                  {computedProductionVsWastage.map((row) => (
                    <tr key={row.itemCode} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-[#0a4a9b]">{row.itemCode}</td>
                      <td className="py-3 px-4 font-semibold text-gray-900">{row.itemName}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="bg-red-50 text-red-600 text-[10px] font-extrabold font-mono px-2 py-0.5 rounded-full">
                          {row.uom}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-gray-900 font-bold">{row.wasteTotal}</td>
                      <td className="py-3 px-4 text-right font-mono text-gray-500">₹{row.unitCost}/unit</td>
                      <td className={`py-3 px-4 text-right font-mono font-extrabold ${row.wasteCost > 400 ? "text-red-600 bg-red-50/30" : "text-gray-800"}`}>
                        ₹{row.wasteCost.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* VIEW 6: STAFF FOOD COSTING */}
            {activeTab === "report-staff-food" && (
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-[#0a4a9b] text-white text-[11px] font-bold tracking-wider uppercase font-mono">
                    <th className="py-3 px-4">Item Code</th>
                    <th className="py-3 px-4">Item Name</th>
                    <th className="py-3 px-4 text-center">UOM</th>
                    <th className="py-3 px-4 text-right">Staff Meals Shared</th>
                    <th className="py-3 px-4 text-right">Standard Cost (₹)</th>
                    <th className="py-3 px-4 text-right">Staff Food Expenditure (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs font-medium text-gray-700">
                  {computedStaffFood.map((row) => (
                    <tr key={row.itemCode} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-gray-500">{row.itemCode}</td>
                      <td className="py-3 px-4 font-semibold text-gray-900">{row.itemName}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="bg-purple-50 text-purple-700 text-[10px] font-extrabold font-mono px-2 py-0.5 rounded-full">
                          {row.uom}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono">
                        <input
                          type="number"
                          value={row.staffQty}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 0;
                            setStaffFoodList(prev => prev.map(s => s.itemCode === row.itemCode ? { ...s, staffQty: val } : s));
                          }}
                          className="w-16 text-right font-bold bg-transparent border-b border-transparent hover:border-gray-300 focus:outline-none"
                          aria-label={`Staff food quantity of ${row.itemName}`}
                        />
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-gray-500">₹{row.unitCost}</td>
                      <td className="py-3 px-4 text-right font-mono font-black text-purple-700">
                        ₹{row.totalCost.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* VIEW 7: BATTER RECONCILIATION */}
            {activeTab === "report-batter-reconciliation" && (
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-[#0a4a9b] text-white text-[11px] font-bold tracking-wider uppercase font-mono">
                    <th className="py-3 px-4">Batter Code</th>
                    <th className="py-3 px-4">Batter Type</th>
                    <th className="py-3 px-4 text-right">Ing. Raw Issued (KG)</th>
                    <th className="py-3 px-4 text-right">Standard Expected Yield (KG)</th>
                    <th className="py-3 px-4 text-right">Actual Fermented / Produced (KG)</th>
                    <th className="py-3 px-4 text-right">Grinding / Fermentation Variance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs font-medium text-gray-700">
                  {computedBatterRecon.map((row) => (
                    <tr key={row.itemCode} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-[#0a4a9b]">{row.itemCode}</td>
                      <td className="py-3 px-4 font-bold text-gray-900">{row.itemName}</td>
                      <td className="py-3 px-4 text-right font-mono">
                        <input
                          type="number"
                          value={row.ingredientsIssued}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setBatterReconList(prev => prev.map(b => b.itemCode === row.itemCode ? { ...b, ingredientsIssuedKg: val } : b));
                          }}
                          className="w-16 text-right font-bold bg-transparent border-b border-transparent hover:border-gray-200 focus:outline-none"
                          aria-label={`Raw ingredients issued for ${row.itemName}`}
                        />
                      </td>
                      <td className="py-3 px-4 text-right font-mono">
                        <input
                          type="number"
                          value={row.expectedYield}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setBatterReconList(prev => prev.map(b => b.itemCode === row.itemCode ? { ...b, expectedYieldKg: val } : b));
                          }}
                          className="w-16 text-right font-bold bg-transparent border-b border-transparent hover:border-gray-200 focus:outline-none"
                          aria-label={`Expected yield for ${row.itemName}`}
                        />
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-gray-700">{row.actualProduced}</td>
                      <td className={`py-3 px-4 text-right font-mono font-extrabold ${row.variance < 0 ? "text-amber-600" : "text-green-600"}`}>
                        {row.variance > 0 ? `+${row.variance.toFixed(1)}` : row.variance.toFixed(1)} KG
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* VIEW 8: ITEM-WISE COUNT REPORT */}
            {activeTab === "report-item-count" && (
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-[#0a4a9b] text-white text-[11px] font-bold tracking-wider uppercase font-mono">
                    <th className="py-3 px-4">Item Code</th>
                    <th className="py-3 px-4">Item Name</th>
                    <th className="py-3 px-4 text-center">UOM</th>
                    <th className="py-3 px-4 text-right">Physical Opening Count</th>
                    <th className="py-3 px-4 text-right">Physical Closing Count</th>
                    <th className="py-3 px-4 text-center">Count Verification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs font-medium text-gray-700">
                  {computedReconciliation.map((row) => (
                    <tr key={row.itemCode} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-gray-500">{row.itemCode}</td>
                      <td className="py-3 px-4 font-semibold text-gray-900">{row.itemName}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="bg-slate-100 text-gray-600 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                          {row.uom}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold">{row.opening}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold">{row.physicalClosing}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          row.variance === 0 ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                        }`}>
                          {row.variance === 0 ? "Matched OK" : "Rec. Needed"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* VIEW 9: JUICE AND ICECREAM REPORT */}
            {activeTab === "report-juice-icecream" && (
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-[#0a4a9b] text-white text-[11px] font-bold tracking-wider uppercase font-mono">
                    <th className="py-3 px-4">Asset Code</th>
                    <th className="py-3 px-4">Juice & Icecream Lines</th>
                    <th className="py-3 px-4 text-center">UOM</th>
                    <th className="py-3 px-4 text-right">Raw Brewed / Produced</th>
                    <th className="py-3 px-4 text-right">Sold Volume</th>
                    <th className="py-3 px-4 text-right">Wasted Volume</th>
                    <th className="py-3 px-4 text-right">Cost Efficiency</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs font-medium text-gray-700">
                  {computedJuiceAndIcecream.map((row) => {
                    const efficiency = row.prodTotal > 0 ? ((row.salesTotal) / row.prodTotal) * 100 : 0;
                    return (
                      <tr key={row.itemCode} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-[#0a4a9b]">{row.itemCode}</td>
                        <td className="py-3 px-4 font-bold text-gray-900">{row.itemName}</td>
                        <td className="py-3 px-4 text-center">
                          <span className="bg-amber-50 text-amber-700 text-[10px] font-extrabold font-mono px-2 py-0.5 rounded-full">
                            {row.uom}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono">{row.prodTotal}</td>
                        <td className="py-3 px-4 text-right font-mono text-green-600 font-bold">{row.salesTotal}</td>
                        <td className="py-3 px-4 text-right font-mono text-rose-500">{row.wasteTotal}</td>
                        <td className="py-3 px-4 text-right font-mono">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            efficiency > 85 ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                          }`}>
                            {efficiency.toFixed(1)}% Eff
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}

            {/* RAW TAB 1: FILES UPLOAD */}
            {activeTab === "files-upload" && (
              <div className="p-6 max-w-3xl">
                <h3 className="text-base font-extrabold text-gray-800 mb-1">Restaurant Ledger Files Integration</h3>
                <p className="text-xs text-gray-400 mb-6 leading-relaxed">
                  Bulk load raw transaction reports from various retail feeds, or upload sandbox backups directly into unified states.
                </p>

                {/* Switcher Mode Tab */}
                <div className="flex border-b border-gray-200 mb-6 gap-4">
                  <button
                    onClick={() => setUploadScreenMode("merger")}
                    className={`pb-2.5 text-xs font-bold transition-all border-b-2 px-1 cursor-pointer ${
                      uploadScreenMode === "merger" ? "border-[#0a4a9b] text-[#0a4a9b]" : "border-transparent text-gray-400 hover:text-gray-600"
                    }`}
                  >
                    Channel Sales File Merger
                  </button>
                  <button
                    onClick={() => setUploadScreenMode("quick")}
                    className={`pb-2.5 text-xs font-bold transition-all border-b-2 px-1 cursor-pointer ${
                      uploadScreenMode === "quick" ? "border-[#0a4a9b] text-[#0a4a9b]" : "border-transparent text-gray-400 hover:text-gray-600"
                    }`}
                  >
                    CSV State Quick Loads
                  </button>
                </div>

                {uploadScreenMode === "merger" && (
                  <div className="space-y-6">
                    <div className="bg-blue-50/50 border border-blue-200/50 rounded-xl p-4 flex gap-3 text-blue-800 text-xs leading-relaxed">
                      <HelpCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold">Merging Instructions:</span> Load standard outlet XLS/CSV raw sale sheets. The parser resolves and matches platform names with Master codes (from the Sales Master database table) automatically, and compiles a clean, filtered sales journal to <code className="bg-white px-1 border rounded text-sky-800 font-mono">sales_data</code>.
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Petpooja Offline */}
                      <div className="border border-gray-200 rounded-xl p-4 bg-white hover:shadow-sm transition-shadow">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-xs text-gray-700">1. Petpooja Offline Report</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${rawFiles.offline ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-400"}`}>
                            {rawFiles.offline ? "Ready" : "Optional"}
                          </span>
                        </div>
                        <input
                          type="file"
                          accept=".xlsx,.xls,.csv"
                          onChange={(e) => handleFileChange("offline", e.target.files?.[0] || null)}
                          className="block w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-[11px] file:font-semibold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100 cursor-pointer"
                        />
                        {rawFiles.offline && (
                          <p className="text-[10px] text-gray-400 mt-1 truncate">📄 {rawFiles.offline.name}</p>
                        )}
                      </div>

                      {/* Petpooja Online */}
                      <div className="border border-gray-200 rounded-xl p-4 bg-white hover:shadow-sm transition-shadow">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-xs text-gray-700">2. Petpooja Online Report</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${rawFiles.online ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-400"}`}>
                            {rawFiles.online ? "Ready" : "Optional"}
                          </span>
                        </div>
                        <input
                          type="file"
                          accept=".xlsx,.xls,.csv"
                          onChange={(e) => handleFileChange("online", e.target.files?.[0] || null)}
                          className="block w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-[11px] file:font-semibold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100 cursor-pointer"
                        />
                        {rawFiles.online && (
                          <p className="text-[10px] text-gray-400 mt-1 truncate">📄 {rawFiles.online.name}</p>
                        )}
                      </div>

                      {/* Petpooja Complimentary */}
                      <div className="border border-gray-200 rounded-xl p-4 bg-white hover:shadow-sm transition-shadow">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-xs text-gray-700">3. Complimentary Report</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${rawFiles.complimentary ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-400"}`}>
                            {rawFiles.complimentary ? "Ready" : "Optional"}
                          </span>
                        </div>
                        <input
                          type="file"
                          accept=".xlsx,.xls,.csv"
                          onChange={(e) => handleFileChange("complimentary", e.target.files?.[0] || null)}
                          className="block w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-[11px] file:font-semibold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100 cursor-pointer"
                        />
                        {rawFiles.complimentary && (
                          <p className="text-[10px] text-gray-400 mt-1 truncate">📄 {rawFiles.complimentary.name}</p>
                        )}
                      </div>

                      {/* Kiosk Itemwise */}
                      <div className="border border-gray-200 rounded-xl p-4 bg-white hover:shadow-sm transition-shadow">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-xs text-gray-700">4. Kiosk Itemwise POS</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${rawFiles.kiosk ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-400"}`}>
                            {rawFiles.kiosk ? "Ready" : "Optional"}
                          </span>
                        </div>
                        <input
                          type="file"
                          accept=".xlsx,.xls,.csv"
                          onChange={(e) => handleFileChange("kiosk", e.target.files?.[0] || null)}
                          className="block w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-[11px] file:font-semibold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100 cursor-pointer"
                        />
                        {rawFiles.kiosk && (
                          <p className="text-[10px] text-gray-400 mt-1 truncate">📄 {rawFiles.kiosk.name}</p>
                        )}
                      </div>

                      {/* Adon */}
                      <div className="border border-gray-200 rounded-xl p-4 bg-white hover:shadow-sm transition-shadow">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-xs text-gray-700">5. Adon Delivery Sheet</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${rawFiles.adon ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-400"}`}>
                            {rawFiles.adon ? "Ready" : "Optional"}
                          </span>
                        </div>
                        <input
                          type="file"
                          accept=".xlsx,.xls,.csv"
                          onChange={(e) => handleFileChange("adon", e.target.files?.[0] || null)}
                          className="block w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-[11px] file:font-semibold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100 cursor-pointer"
                        />
                        {rawFiles.adon && (
                          <p className="text-[10px] text-gray-400 mt-1 truncate">📄 {rawFiles.adon.name}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-between items-center bg-slate-50 border border-gray-200 p-4 rounded-xl gap-4 flex-wrap">
                      <div>
                        <p className="text-xs font-black text-gray-800">Ready to Consolidate & Resolve?</p>
                        <p className="text-[10px] text-gray-400 leading-tight">Using {Object.keys(rawFiles).length} active sources</p>
                      </div>
                      <button
                        onClick={handleMergeAndProcessSalesFiles}
                        disabled={isMerging || Object.keys(rawFiles).length === 0}
                        className={`font-mono text-xs font-black px-5 py-2.5 rounded-lg text-white transition-opacity flex items-center gap-2 ${
                          Object.keys(rawFiles).length === 0 ? "bg-gray-300 cursor-not-allowed" : "bg-[#0a4a9b] hover:bg-opacity-95 cursor-pointer"
                        }`}
                      >
                        {isMerging ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" /> Merging...
                          </>
                        ) : (
                          <>
                            <Database className="w-4 h-4" /> Run Python-Style Pipeline
                          </>
                        )}
                      </button>
                    </div>

                    {mergeSuccess && (
                      <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg p-3 text-xs flex items-start gap-2 leading-relaxed">
                        <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                        <span>{mergeSuccess}</span>
                      </div>
                    )}
                    {mergeError && (
                      <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-xs flex items-start gap-2 leading-relaxed">
                        <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                        <span>{mergeError}</span>
                      </div>
                    )}
                  </div>
                )}

                {uploadScreenMode === "quick" && (
                  <div>
                    <h3 className="text-xs font-bold text-gray-800 mb-1">CSV Data Overwrite Integration</h3>
                    <p className="text-[11px] text-gray-400 mb-4 leading-relaxed">
                      Fast-load bulk records directly into active screens. Paste comma-separated rows below.
                    </p>

                    {/* Templates selectors */}
                    <div className="bg-slate-50 border border-gray-200 rounded-lg p-3 mb-5">
                      <p className="text-xs font-black text-gray-700 mb-2">Click to load sandbox templates:</p>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => {
                            setActiveTab("production");
                            setCsvText(`TRCIP001, 245, 115\nTRCIP002, 70, 60\nTRCIP004, 150, 110\nTRCIP015, 210, 180`);
                            setCsvSuccess(null);
                            setCsvError(null);
                          }}
                          className="px-3 py-1.5 bg-white border border-gray-200 rounded text-[10px] font-bold text-gray-700 hover:bg-gray-100 flex items-center gap-1 cursor-pointer"
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600" /> Weekend High Production.csv
                        </button>
                        <button
                          onClick={() => {
                            setActiveTab("wastage");
                            setCsvText(`TRCIP001, 5, 15\nTRCIP002, 2, 9\nTRCIP005, 0, 4\nTRCIP015, 1, 3`);
                            setCsvSuccess(null);
                            setCsvError(null);
                          }}
                          className="px-3 py-1.5 bg-white border border-gray-200 rounded text-[10px] font-bold text-gray-700 hover:bg-gray-100 flex items-center gap-1 cursor-pointer"
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5 text-rose-600" /> Monday Spill Calibration.csv
                        </button>
                      </div>
                    </div>

                    <div 
                      className="border-2 border-dashed border-gray-200 rounded-xl p-5 text-center hover:bg-slate-50/50 transition-colors"
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        setCsvText(`TRCIP001, 290, 140\nTRCIP002, 90, 65\nTRCIP015, 250, 200`);
                        setNotifications(prev => ["File drop successfully processed in background.", ...prev]);
                      }}
                    >
                      <textarea
                        value={csvText}
                        onChange={(e) => setCsvText(e.target.value)}
                        placeholder="TRCIP001, 240, 120 (Format: ITEM_CODE, SHIFT1_QTY, SHIFT2_QTY)"
                        className="w-full h-32 p-3 bg-white border border-gray-200 rounded-lg text-xs font-mono outline-sky-600 focus:ring-1 focus:ring-[#0a4a9b]"
                      />
                      
                      <div className="flex items-center justify-between mt-3 flex-wrap gap-3">
                        <p className="text-[10px] text-gray-400 font-medium font-mono">Accepts: ITEM_CODE, VAL1, VAL2</p>
                        <button
                          onClick={handleParseCsv}
                          className="bg-[#0a4a9b] hover:bg-sky-900 text-white font-bold text-xs px-4 py-2 rounded-lg cursor-pointer transition-colors font-mono"
                        >
                          Parse & Overwrite Active States
                        </button>
                      </div>
                    </div>

                    {csvSuccess && (
                      <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg p-3 text-xs mt-4 flex items-center gap-2 font-sans">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span>{csvSuccess}</span>
                      </div>
                    )}
                    {csvError && (
                      <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-xs mt-4 flex items-center gap-2 font-sans">
                        <AlertTriangle className="w-4 h-4 text-red-600" />
                        <span>{csvError}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* RAW TABS: SALES MASTER */}
            {activeTab === "sales-master" && (
              <div className="flex flex-col gap-6 animate-fadeIn">
                
                {/* FILTER CONTROLS */}
                <div className="bg-slate-50 p-4 border border-gray-200 rounded-xl flex flex-wrap items-center gap-3">
                  <div className="flex-1 min-w-[200px] relative">
                    <span className="absolute left-3 top-2.5 text-gray-400">
                      <Search className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      placeholder="Search Master / Platform item name, Item Code..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full text-xs pl-9 bg-white border border-gray-300 rounded-lg py-2 focus:outline-none focus:ring-1 focus:ring-[#0a4a9b]"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-gray-500 font-sans uppercase">Platform:</span>
                    <select
                      value={smPlatformFilter}
                      onChange={(e) => setSmPlatformFilter(e.target.value)}
                      className="text-xs bg-white border border-gray-300 rounded-lg p-1.5 focus:outline-none"
                    >
                      {uniquePlatforms.map((plat) => (
                        <option key={plat} value={plat}>{plat}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-gray-500 font-sans uppercase">Category:</span>
                    <select
                      value={smCategoryFilter}
                      onChange={(e) => setSmCategoryFilter(e.target.value)}
                      className="text-xs bg-white border border-gray-300 rounded-lg p-1.5 focus:outline-none"
                    >
                      {uniqueCategories.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* SCROLLABLE GRID */}
                <div className="border border-gray-200 rounded-xl overflow-hidden shadow-xs bg-white">
                  <div className="max-h-[500px] overflow-y-auto scrollbar-thin">
                    <table className="w-full text-left border-collapse">
                      <thead className="sticky top-0 z-10 bg-[#0a4a9b]">
                        <tr className="text-white text-[11px] font-bold tracking-wider uppercase font-mono">
                          <th className="py-3 px-4">Master Item Name</th>
                          <th className="py-3 px-4">Master Category</th>
                          <th className="py-3 px-4">RSP Code</th>
                          <th className="py-3 px-4">Platform Item Name</th>
                          <th className="py-3 px-4 text-center font-sans tracking-tight">Platform (Channel)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 text-xs font-semibold text-gray-700">
                        {salesMasterList
                          .filter((item) => {
                            const q = searchQuery.toLowerCase().trim();
                            const matchesSearch = !q ||
                              item.masterName.toLowerCase().includes(q) ||
                              item.itemCode.toLowerCase().includes(q) ||
                              item.platformItemName.toLowerCase().includes(q) ||
                              item.platformName.toLowerCase().includes(q);

                            const matchesPlatform = smPlatformFilter === "All Platforms" || item.platformName === smPlatformFilter;
                            const matchesCategory = smCategoryFilter === "All Categories" || item.categoryName === smCategoryFilter;

                            return matchesSearch && matchesPlatform && matchesCategory;
                          })
                          .map((row, index) => {
                            // Get visual colors for different platforms/channels
                            let platBadgeColor = "bg-slate-100 text-slate-800 border-slate-200";
                            const pName = row.platformName || "";
                            if (pName.includes("Online")) {
                              platBadgeColor = "bg-orange-50 text-orange-700 border-orange-200";
                            } else if (pName.includes("Kiosk")) {
                              platBadgeColor = "bg-blue-50 text-blue-700 border-blue-200";
                            } else if (pName.includes("Offline")) {
                              platBadgeColor = "bg-emerald-50 text-[#075e54] border-emerald-200";
                            } else if (pName.includes("Staff")) {
                              platBadgeColor = "bg-purple-50 text-purple-700 border-purple-200";
                            } else if (pName.includes("Complimentary")) {
                              platBadgeColor = "bg-indigo-50 text-indigo-700 border-indigo-200";
                            } else if (pName.includes("Addon")) {
                              platBadgeColor = "bg-rose-50 text-rose-700 border-rose-100";
                            }

                            return (
                              <tr key={index} className="hover:bg-slate-50/80 transition-colors">
                                <td className="py-3 px-4 font-bold text-gray-900">{row.masterName}</td>
                                <td className="py-3 px-4">
                                  <span className="text-[10px] bg-slate-100 text-slate-500 font-bold px-2 py-0.5 rounded font-sans uppercase">
                                    {row.categoryName}
                                  </span>
                                </td>
                                <td className="py-3 px-4 font-mono font-bold text-rose-600 text-[11px]">{row.itemCode}</td>
                                <td className="py-3 px-4 text-emerald-950 font-medium italic">{row.platformItemName}</td>
                                <td className="py-3 px-4 text-center">
                                  <span className={`text-[10px] p-1 px-2.5 font-extrabold rounded-full border ${platBadgeColor}`}>
                                    {pName}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            )}

            {/* RAW TABS: SALES DATA */}
            {activeTab === "sales-data" && (
              <div className="p-6 animate-fadeIn">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-4 border-b border-gray-100 pb-4">
                  <div>
                    <h3 className="text-sm font-black text-gray-800">Sales Ledger & Resolution Hub</h3>
                    <p className="text-xs text-gray-400">View live simulation telemetry or deep merge real outlet journals</p>
                  </div>

                  <div className="flex bg-slate-100 rounded-lg p-0.5 border border-gray-200">
                    <button
                      onClick={() => setSalesDataSubTab("uploaded")}
                      className={`px-3 py-1.5 text-[11px] font-black rounded-md transition-all cursor-pointer ${
                        salesDataSubTab === "uploaded" ? "bg-white text-gray-800 shadow-xs" : "text-gray-400 hover:text-gray-600"
                      }`}
                    >
                      Real Uploaded Ledger ({salesDataList.length})
                    </button>
                    <button
                      onClick={() => setSalesDataSubTab("simulated")}
                      className={`px-3 py-1.5 text-[11px] font-black rounded-md transition-all cursor-pointer ${
                        salesDataSubTab === "simulated" ? "bg-white text-gray-800 shadow-xs" : "text-gray-400 hover:text-gray-600"
                      }`}
                    >
                      Simulated Live POS
                    </button>
                  </div>
                </div>

                {salesDataSubTab === "uploaded" && (
                  <div>
                    {salesDataList.length === 0 ? (
                      <div className="border border-dashed border-gray-200 rounded-xl p-8 text-center bg-slate-50/50">
                        <CheckCircle className="w-8 h-8 text-sky-800/20 mx-auto mb-2" />
                        <h4 className="text-xs font-bold text-gray-700">No Deep Merged Data Found</h4>
                        <p className="text-[10px] text-gray-400 max-w-sm mx-auto mt-1 mb-4">
                          Your local sales ledger has not been loaded with real spreadsheets yet. Head over to <b>Upload Files</b> to integrate today&apos;s receipts!
                        </p>
                        <button
                          onClick={() => setActiveTab("files-upload")}
                          className="bg-[#0a4a9b] hover:bg-opacity-95 text-white font-mono text-[10px] font-bold px-3 py-1.5 rounded cursor-pointer transition-opacity"
                        >
                          Go to Upload Files
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* Metrics bar for uploaded */}
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                          <div className="border border-gray-200/60 rounded-xl p-3 bg-white">
                            <p className="text-[10px] uppercase font-bold text-gray-400 font-sans tracking-wide">Total Rows</p>
                            <p className="text-lg font-black text-slate-800 font-mono mt-0.5">{salesDataList.length}</p>
                          </div>
                          <div className="border border-gray-200/60 rounded-xl p-3 bg-white">
                            <p className="text-[10px] uppercase font-bold text-gray-400 font-sans tracking-wide">Gross Merged Value</p>
                            <p className="text-lg font-black text-green-600 font-mono mt-0.5">
                              ₹{salesDataList.reduce((acc, x) => acc + (x.finalTotal || 0), 0).toLocaleString()}
                            </p>
                          </div>
                          <div className="border border-gray-200/60 rounded-xl p-3 bg-white">
                            <p className="text-[10px] uppercase font-bold text-gray-400 font-sans tracking-wide">Unmapped items</p>
                            <p className="text-lg font-black text-rose-500 font-mono mt-0.5">
                              {salesDataList.filter(x => !x.code).length}
                            </p>
                          </div>
                          <div className="border border-gray-200/60 rounded-xl p-3 bg-white">
                            <p className="text-[10px] uppercase font-bold text-gray-400 font-sans tracking-wide">Kiosk / Addon Qty</p>
                            <p className="text-lg font-black text-[#0a4a9b] font-mono mt-0.5">
                              {salesDataList.filter(x => x.salesType === "KIOSK" || x.salesType === "Addon").reduce((acc, x) => acc + (x.qty || 0), 0)} units
                            </p>
                          </div>
                        </div>

                        {/* Search and warning alert if any unmapped exists */}
                        {salesDataList.some(x => !x.code) && (
                          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-amber-800 text-[11px] flex gap-2 leading-relaxed">
                            <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                            <div>
                              <span className="font-bold">Unresolved Platform Identifiers Detected:</span> Some raw items do not have an active matching mapping defined in the <b>Sales Master</b> table. They are highlighted below. Defining these in your Sales Master ensures flawless automated recipe tracking!
                            </div>
                          </div>
                        )}

                        <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-xs">
                          <div className="max-h-[400px] overflow-y-auto scrollbar-thin">
                            <table className="w-full text-left border-collapse">
                              <thead className="bg-[#0a4a9b] text-white text-[10px] font-bold uppercase font-mono tracking-wider sticky top-0 z-10">
                                <tr>
                                  <th className="py-2.5 px-3">Type</th>
                                  <th className="py-2.5 px-3">Invoice No.</th>
                                  <th className="py-2.5 px-3">Raw Name</th>
                                  <th className="py-2.5 px-3">Resolved Master (Code)</th>
                                  <th className="py-2.5 px-3 text-right">Qty</th>
                                  <th className="py-2.5 px-3 text-right">Final Total</th>
                                  <th className="py-2.5 px-3">Date</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100 text-[11px] leading-relaxed">
                                {salesDataList.map((row, idx) => {
                                  const unmapped = !row.code;
                                  return (
                                    <tr key={idx} className={`hover:bg-slate-50/50 transition-colors ${unmapped ? "bg-amber-50/35" : ""}`}>
                                      <td className="py-2 px-3 font-mono">
                                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold tracking-wider uppercase font-sans ${
                                          row.salesType === 'Petpooja-offline' ? 'bg-indigo-50 text-indigo-700' :
                                          row.salesType === 'Petpooja-online' ? 'bg-sky-50 text-sky-700' :
                                          row.salesType === 'KIOSK' ? 'bg-teal-50 text-teal-700 font-black' :
                                          row.salesType === 'Addon' ? 'bg-pink-50 text-pink-700' : 'bg-gray-50 text-gray-500'
                                        }`}>
                                          {row.salesType}
                                        </span>
                                      </td>
                                      <td className="py-2 px-3 font-mono text-gray-400">{row.invoiceNo || "N/A"}</td>
                                      <td className="py-2 px-3 font-medium text-gray-700">{row.itemName}</td>
                                      <td className="py-2 px-3">
                                        {unmapped ? (
                                          <span className="text-amber-600 font-extrabold flex items-center gap-1">
                                            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> Unresolved (unmapped)
                                          </span>
                                        ) : (
                                          <span className="text-gray-800">
                                            {row.masterItemName}{" "}
                                            <span className="text-xs text-sky-700 font-mono font-bold bg-sky-50 px-1 rounded">
                                              ({row.code})
                                            </span>
                                          </span>
                                        )}
                                      </td>
                                      <td className="py-2 px-3 text-right font-mono font-medium">{row.qty}</td>
                                      <td className="py-2 px-3 text-right font-mono text-slate-800 font-bold">
                                        ₹{(row.finalTotal || 0).toLocaleString()}
                                      </td>
                                      <td className="py-2 px-3 text-gray-400 font-mono text-[10px]">{row.date || "—"}</td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {salesDataSubTab === "simulated" && (
                  <div>
                    <h3 className="text-sm font-bold text-gray-800 mb-1">Simulated POS Feed Ledger</h3>
                    <p className="text-xs text-gray-400 mb-4 font-sans">Chronological receipt log of customer transactions on Indiranagar</p>
                    <div className="bg-slate-50 border border-gray-200 rounded-xl p-4 max-h-[300px] overflow-y-auto font-mono text-[11px] leading-relaxed space-y-1.5 scrollbar-thin">
                      {simulationLogs.map((log) => (
                        <div key={log.id} className={`flex items-center justify-between border-b border-gray-200/50 pb-1.5 ${log.type === "alert" ? "text-rose-600 font-bold bg-rose-50/50 px-2 py-0.5 rounded" : "text-gray-600"}`}>
                          <div className="flex items-center gap-2">
                            <span className="text-gray-400 font-medium">[{log.time}]</span>
                            <span>{log.msg}</span>
                          </div>
                          <span className={`text-[9px] px-1.5 rounded uppercase font-bold tracking-widest ${log.type === "alert" ? "bg-red-100" : "bg-green-100 text-green-700"}`}>
                            {log.type}
                          </span>
                        </div>
                      ))}
                      <div ref={logsEndRef}></div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* RAW TABS: SALES */}
            {activeTab === "sales" && (
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-[#0a4a9b] text-white text-[11px] font-bold tracking-wider uppercase font-mono">
                    <th className="py-3 px-4">Item Code</th>
                    <th className="py-3 px-4">Item Name</th>
                    <th className="py-3 px-4 text-center">UOM</th>
                    <th className="py-3 px-4 text-right">Consolidated Sold Volume</th>
                    <th className="py-3 px-4 text-right">Price per Unit</th>
                    <th className="py-3 px-4 text-right">Live Generated Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs font-medium text-gray-700">
                  {computedProductionVsSales.map((row) => (
                    <tr key={row.itemCode} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-gray-500">{row.itemCode}</td>
                      <td className="py-3 px-4 font-bold text-gray-900">{row.itemName}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="bg-sky-50 text-sky-700 text-[10px] font-extrabold font-mono px-2 py-0.5 rounded-full">
                          {row.uom}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold">{row.salesTotal}</td>
                      <td className="py-3 px-4 text-right font-mono text-gray-500">₹{row.unitPrice}</td>
                      <td className="py-3 px-4 text-right font-mono font-black text-emerald-600">₹{row.salesValue.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* RAW TABS: PRODUCTION */}
            {activeTab === "production" && (
              <div className="p-6">
                <p className="text-xs text-amber-600 font-bold mb-4 flex items-center gap-1 bg-amber-50 rounded-lg p-3 border border-amber-100 max-w-xl">
                  <AlertCircle className="w-4.5 h-4.5" /> Note: Any alterations on these raw inputs immediately synchronizes the charts and report ratios!
                </p>
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="bg-[#0a4a9b] text-white text-[11px] font-bold tracking-wider uppercase font-mono">
                      <th className="py-3 px-4">Item Code</th>
                      <th className="py-3 px-4">Item Name</th>
                      <th className="py-3 px-4 text-right">Production Shift-1</th>
                      <th className="py-3 px-4 text-right">Production Shift-2</th>
                      <th className="py-3 px-4 text-right">Total Quantity Produced</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs font-medium text-gray-700">
                    {menuList.map((row) => {
                      const prodObj = productionList.find(p => p.itemCode === row.itemCode) || { prodShift1: 0, prodShift2: 0 };
                      const total = prodObj.prodShift1 + prodObj.prodShift2;
                      return (
                        <tr key={row.itemCode} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-[#0a4a9b]">{row.itemCode}</td>
                          <td className="py-3 px-4 font-bold text-gray-900">{row.itemName}</td>
                          <td className="py-3 px-4 text-right font-mono">
                            <input
                              type="number"
                              value={prodObj.prodShift1}
                              onChange={(e) => updateProdState(row.itemCode, "prodShift1", parseInt(e.target.value) || 0)}
                              className="w-20 text-right bg-slate-50 border border-gray-200 focus:bg-white rounded p-1"
                              aria-label={`Prod Shift-1 for ${row.itemName}`}
                            />
                          </td>
                          <td className="py-3 px-4 text-right font-mono">
                            <input
                              type="number"
                              value={prodObj.prodShift2}
                              onChange={(e) => updateProdState(row.itemCode, "prodShift2", parseInt(e.target.value) || 0)}
                              className="w-20 text-right bg-slate-50 border border-gray-200 focus:bg-white rounded p-1"
                              aria-label={`Prod Shift-2 for ${row.itemName}`}
                            />
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-sky-700 bg-slate-50/40">{total} {row.uom}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* RAW TABS: WASTAGE */}
            {activeTab === "wastage" && (
              <div className="p-6">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="bg-[#0a4a9b] text-white text-[11px] font-bold tracking-wider uppercase font-mono">
                      <th className="py-3 px-4">Item Code</th>
                      <th className="py-3 px-4">Item Name</th>
                      <th className="py-3 px-4 text-right">Wastage Shift-1 (Units)</th>
                      <th className="py-3 px-4 text-right">Wastage Shift-2 (Units)</th>
                      <th className="py-3 px-4 text-right">Total Damaged / Spoiled</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs font-medium text-gray-700">
                    {menuList.map((row) => {
                      const wasteObj = wastageList.find(w => w.itemCode === row.itemCode) || { wasteShift1: 0, wasteShift2: 0 };
                      const total = wasteObj.wasteShift1 + wasteObj.wasteShift2;
                      return (
                        <tr key={row.itemCode} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-rose-700">{row.itemCode}</td>
                          <td className="py-3 px-4 font-bold text-gray-900">{row.itemName}</td>
                          <td className="py-3 px-4 text-right font-mono">
                            <input
                              type="number"
                              value={wasteObj.wasteShift1}
                              onChange={(e) => updateWasteState(row.itemCode, "wasteShift1", parseInt(e.target.value) || 0)}
                              className="w-20 text-right bg-slate-50 border border-gray-200 focus:bg-white rounded p-1"
                              aria-label={`Waste Shift-1 for ${row.itemName}`}
                            />
                          </td>
                          <td className="py-3 px-4 text-right font-mono">
                            <input
                              type="number"
                              value={wasteObj.wasteShift2}
                              onChange={(e) => updateWasteState(row.itemCode, "wasteShift2", parseInt(e.target.value) || 0)}
                              className="w-20 text-right bg-slate-50 border border-gray-200 focus:bg-white rounded p-1"
                              aria-label={`Waste Shift-2 for ${row.itemName}`}
                            />
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-rose-700 bg-rose-50/30">{total} {row.uom}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Total record indicators */}
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 font-mono">
              <span>{menuList.length} total menu inventory points parsed</span>
              <span>Indiranagar Client synced OK</span>
            </div>
          </div>
        </>
      )}

          <p className="text-[10.5px] text-gray-400 font-medium text-center pb-6">
            © 2026 Rameshwaram Cafe Dashboard | Developed by <a href="#" className="underline font-bold text-[#0a4a9b]">Fernhill Technologies</a>
          </p>
        </main>

        {/* 4. ALERTS BAR (SLIDES FROM RIGHT IF BELL INTERACTION TRIGGERS) */}
        {notificationsOpen && (
          <div className="absolute right-0 top-0 w-80 h-full bg-white border-l border-gray-200 shadow-2xl z-50 p-5 flex flex-col justify-between select-none animate-fade-in">
            <div>
              <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
                <h3 className="text-sm font-black text-gray-800 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> Active Audit Signals
                </h3>
                <button 
                  onClick={() => setNotificationsOpen(false)}
                  className="p-1 hover:bg-gray-100 rounded text-gray-400"
                  aria-label="Close alerts panel"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {notifications.map((notif, idx) => (
                  <div key={idx} className="bg-red-50/40 border border-red-100 rounded-lg p-3 text-xs leading-relaxed text-gray-700 flex gap-2">
                    <span className="text-red-500 text-sm font-bold flex shrink-0">!</span>
                    <span>{notif}</span>
                  </div>
                ))}
              </div>
            </div>
            <button 
              onClick={() => {
                setNotifications([]);
                setNotificationsOpen(false);
              }}
              className="w-full bg-[#0a4a9b] text-white p-2 rounded text-xs font-bold hover:bg-[#07346d] transition-colors"
            >
              Flush Audit Queue
            </button>
          </div>
        )}

      </div>

      {/* 5. ADD ITEM MODAL */}
      {showAddMenuModal && (
        <div className="fixed inset-0 bg-[#02132a]/60 backdrop-blur-xs flex items-center justify-center z-50 animate-fade-in p-4">
          <form 
            onSubmit={handleAddMenuItem}
            className="bg-white rounded-xl shadow-2xl border border-gray-100 p-6 max-w-sm w-full space-y-4"
          >
            <div>
              <h3 className="font-extrabold text-base text-gray-800">Add Menu Item line</h3>
              <p className="text-xs text-gray-400">Installs a new tracking code in cafeteria state</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase font-mono block mb-1">Item Tracking Index (Code)</label>
                <input
                  type="text"
                  placeholder="TRCIP025"
                  required
                  value={newMenuCode}
                  onChange={(e) => setNewMenuCode(e.target.value)}
                  className="w-full bg-slate-50 border border-gray-200 rounded p-2 text-xs font-mono font-bold text-[#0a4a9b] uppercase"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase font-mono block mb-1">Product Description</label>
                <input
                  type="text"
                  placeholder="Ghee Roast Batter"
                  required
                  value={newMenuName}
                  onChange={(e) => setNewMenuName(e.target.value)}
                  className="w-full bg-slate-50 border border-gray-200 rounded p-2 text-xs font-bold text-gray-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase font-mono block mb-1">UOM</label>
                  <select
                    value={newMenuUom}
                    onChange={(e) => setNewMenuUom(e.target.value)}
                    className="w-full bg-slate-50 border border-gray-200 rounded p-2 text-xs font-bold text-gray-700 cursor-pointer"
                  >
                    <option value="KG">KG</option>
                    <option value="LTR">LTR</option>
                    <option value="PCS">PCS</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase font-mono block mb-1">Category</label>
                  <select 
                    value={newMenuCat}
                    onChange={(e) => setNewMenuCat(e.target.value)}
                    className="w-full bg-slate-50 border border-gray-200 rounded p-2 text-xs font-bold text-gray-700 cursor-pointer"
                  >
                    <option value="Batter">Batter</option>
                    <option value="Chutney">Chutney</option>
                    <option value="Beverage">Beverage</option>
                    <option value="Main Dishes">Main Dishes</option>
                    <option value="Sweets">Sweets</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase font-mono block mb-1">Ing. Cost (₹)</label>
                  <input
                    type="number"
                    value={newMenuCost}
                    onChange={(e) => setNewMenuCost(e.target.value)}
                    className="w-full bg-slate-50 border border-gray-200 rounded p-2 text-xs font-mono font-bold text-gray-800"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase font-mono block mb-1">Menu Price (₹)</label>
                  <input
                    type="number"
                    value={newMenuPrice}
                    onChange={(e) => setNewMenuPrice(e.target.value)}
                    className="w-full bg-slate-50 border border-gray-200 rounded p-2 text-xs font-mono font-bold text-gray-800"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowAddMenuModal(false)}
                className="p-2 text-xs font-bold text-gray-400 hover:text-gray-500 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-[#0a4a9b] text-white p-2 text-xs font-bold rounded-lg hover:bg-sky-900 shadow-xs cursor-pointer"
              >
                Create Asset
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SQL SCHEMA BOOTSTRAP MODAL */}
      {showSqlModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-[100] animate-fadeIn">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-[#0a4a9b]" />
                <div>
                  <h3 className="font-extrabold text-base text-gray-800">Supabase SQL Schema Bootstrap</h3>
                  <p className="text-[10px] text-gray-400 font-mono">Create required relational tables with permissive RLS</p>
                </div>
              </div>
              <button
                onClick={() => setShowSqlModal(false)}
                className="text-gray-400 hover:text-gray-600 font-bold text-sm bg-gray-100 hover:bg-gray-200/80 p-1.5 px-3 rounded-md transition-all cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            <div className="p-6 overflow-y-auto font-mono text-xs text-slate-300 bg-slate-950 border-b border-slate-900 leading-normal selection:bg-sky-500/30">
              <div className="mb-4 bg-sky-950/40 p-3 rounded-lg border border-sky-800/30 text-sky-200 text-left">
                <p className="font-bold font-sans text-xs flex items-center gap-2">
                  <span className="flex h-2 w-2 rounded-full bg-sky-400 animate-pulse"></span>
                  Bootstrap Instructions:
                </p>
                <ol className="list-decimal text-[11px] list-inside font-sans text-sky-300/80 mt-1.5 space-y-1">
                  <li>Go to your <a href="https://supabase.com" target="_blank" rel="noreferrer" className="underline font-bold text-white hover:text-sky-200">Supabase Dashboard</a> and open your project.</li>
                  <li>Click on <b>SQL Editor</b> in the left navigation sidebar.</li>
                  <li>Click <b>New Query</b>, paste the SQL block below, and click <b>Run</b>.</li>
                  <li>Now click <b>Push Current to Cloud</b> in RestoRep to sync your initial state!</li>
                </ol>
              </div>
              <pre className="p-4 bg-black/40 rounded-lg overflow-x-auto text-[10px] text-sky-300 font-mono max-h-[300px] border border-white/5 scrollbar-thin text-left select-all">
                {getSupabaseSetupSQL()}
              </pre>
            </div>

            <div className="p-4 bg-slate-50 flex items-center justify-between text-xs">
              <span className="text-gray-400 font-medium font-sans">Double-click or drag inside the dark box to copy all.</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(getSupabaseSetupSQL());
                  alert("SQL setup script copied to clipboard successfully!");
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1.5 px-4 rounded-lg shadow-sm transition-all cursor-pointer"
              >
                Copy Setup SQL
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
