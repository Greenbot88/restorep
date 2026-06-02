import { createClient } from "@supabase/supabase-js";
import {
  MenuItem,
  ProductionRecord,
  WastageRecord,
  SalesRecord,
  StaffFoodRecord,
  BatterReconciliation,
  ItemCountRecord,
  SalesDataRecord
} from "./dummyData";
import { SalesMasterRow } from "./salesMasterData";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

/**
 * Checks if the user has provided valid Supabase credentials.
 * Avoids initializing with empty placeholders.
 */
export const isSupabaseConfigured = (): boolean => {
  return (
    typeof window !== "undefined" &&
    !!supabaseUrl &&
    supabaseUrl.trim() !== "" &&
    supabaseUrl !== "MY_SUPABASE_URL" &&
    !supabaseUrl.includes("insert-your") &&
    !!supabaseAnonKey &&
    supabaseAnonKey.trim() !== "" &&
    supabaseAnonKey !== "MY_SUPABASE_ANON_KEY" &&
    !supabaseAnonKey.includes("insert-your")
  );
};

export const supabase = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Re-export original types for convenient unified importing if needed
export type {
  MenuItem,
  ProductionRecord,
  WastageRecord,
  SalesRecord,
  StaffFoodRecord,
  BatterReconciliation,
  ItemCountRecord,
  SalesMasterRow,
  SalesDataRecord
};

/**
 * Generates SQL script needed for the user to run in Supabase's SQL editor.
 */
export const getSupabaseSetupSQL = (): string => {
  return `-- 1. Create menu_items Table
CREATE TABLE IF NOT EXISTS menu_items (
  item_code TEXT PRIMARY KEY,
  item_name TEXT NOT NULL,
  uom TEXT NOT NULL,
  unit_cost NUMERIC DEFAULT 0,
  unit_price NUMERIC DEFAULT 0,
  category TEXT DEFAULT 'Food'
);

-- 2. Create production_records Table
CREATE TABLE IF NOT EXISTS production_records (
  item_code TEXT PRIMARY KEY REFERENCES menu_items(item_code) ON DELETE CASCADE,
  prod_shift_1 NUMERIC DEFAULT 0,
  prod_shift_2 NUMERIC DEFAULT 0
);

-- 3. Create wastage_records Table
CREATE TABLE IF NOT EXISTS wastage_records (
  item_code TEXT PRIMARY KEY REFERENCES menu_items(item_code) ON DELETE CASCADE,
  waste_shift_1 NUMERIC DEFAULT 0,
  waste_shift_2 NUMERIC DEFAULT 0
);

-- 4. Create sales_records Table
CREATE TABLE IF NOT EXISTS sales_records (
  id BIGSERIAL PRIMARY KEY,
  item_code TEXT REFERENCES menu_items(item_code) ON DELETE CASCADE,
  qty_sold NUMERIC DEFAULT 0,
  shift INT DEFAULT 1,
  channel TEXT NOT NULL
);

-- 5. Create staff_food_records Table
CREATE TABLE IF NOT EXISTS staff_food_records (
  item_code TEXT PRIMARY KEY REFERENCES menu_items(item_code) ON DELETE CASCADE,
  staff_qty NUMERIC DEFAULT 0
);

-- 6. Create batter_reconciliation Table
CREATE TABLE IF NOT EXISTS batter_reconciliation (
  item_code TEXT PRIMARY KEY REFERENCES menu_items(item_code) ON DELETE CASCADE,
  ingredients_issued_kg NUMERIC DEFAULT 0,
  expected_yield_kg NUMERIC DEFAULT 0
);

-- 7. Create item_count_records Table
CREATE TABLE IF NOT EXISTS item_count_records (
  item_code TEXT PRIMARY KEY REFERENCES menu_items(item_code) ON DELETE CASCADE,
  opening_count NUMERIC DEFAULT 0,
  closing_count NUMERIC DEFAULT 0
);

-- Enable row level security (RLS) or add default permissive policies for development:
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE wastage_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_food_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE batter_reconciliation ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_count_records ENABLE ROW LEVEL SECURITY;

-- Dynamic Policies for demo (Permissive anonymous access)
CREATE POLICY "Permissive menu_items" ON menu_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permissive production" ON production_records FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permissive wastage" ON wastage_records FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permissive sales" ON sales_records FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permissive staff_food" ON staff_food_records FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permissive batter" ON batter_reconciliation FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permissive item_count" ON item_count_records FOR ALL USING (true) WITH CHECK (true);

-- Initial Mock Data insert
INSERT INTO menu_items (item_code, item_name, uom, unit_cost, unit_price, category) VALUES
('TRCIP001', 'Masala Dosa Batter', 'KG', 45, 120, 'Batter'),
('TRCIP002', 'Idli Batter', 'KG', 40, 90, 'Batter'),
('TRCIP003', 'Khali Dosa Batter', 'KG', 35, 100, 'Batter'),
('TRCIP004', 'Sambar Standard', 'LTR', 25, 70, 'Accompaniment'),
('TRCIP005', 'Coconut Chutney', 'KG', 30, 80, 'Accompaniment'),
('TRCIP006', 'Filter Coffee Decoction', 'LTR', 90, 250, 'Beverage'),
('TRCIP007', 'Ghee Clarifiedized', 'KG', 650, 850, 'Food'),
('TRCIP008', 'Jaggery Syrup', 'LTR', 50, 110, 'Sweet'),
('TRCIP009', 'Almond Milk Drink', 'LTR', 75, 160, 'Beverage'),
('TRCIP010', 'Kesari Bath Mix', 'KG', 80, 150, 'Sweet')
ON CONFLICT (item_code) DO NOTHING;

INSERT INTO production_records (item_code, prod_shift_1, prod_shift_2) VALUES
('TRCIP001', 350, 200),
('TRCIP002', 250, 150),
('TRCIP003', 180, 100),
('TRCIP004', 300, 200),
('TRCIP005', 250, 150)
ON CONFLICT (item_code) DO NOTHING;

INSERT INTO wastage_records (item_code, waste_shift_1, waste_shift_2) VALUES
('TRCIP001', 12, 28),
('TRCIP002', 5, 8),
('TRCIP003', 15, 22),
('TRCIP004', 8, 14),
('TRCIP005', 10, 18)
ON CONFLICT (item_code) DO NOTHING;

INSERT INTO batter_reconciliation (item_code, ingredients_issued_kg, expected_yield_kg) VALUES
('TRCIP001', 400, 500),
('TRCIP002', 280, 380),
('TRCIP003', 200, 260)
ON CONFLICT (item_code) DO NOTHING;

INSERT INTO item_count_records (item_code, opening_count, closing_count) VALUES
('TRCIP001', 50, 48),
('TRCIP002', 40, 36),
('TRCIP003', 30, 24),
('TRCIP004', 60, 54),
('TRCIP005', 80, 75)
ON CONFLICT (item_code) DO NOTHING;

-- 8. Create sales_master Table
CREATE TABLE IF NOT EXISTS sales_master (
  id BIGSERIAL PRIMARY KEY,
  master_code TEXT,
  master_name TEXT NOT NULL,
  category_name TEXT,
  item_code TEXT NOT NULL,
  platform_item_name TEXT NOT NULL,
  platform_category_name TEXT,
  platform_name TEXT NOT NULL
);

ALTER TABLE sales_master ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permissive sales_master" ON sales_master FOR ALL USING (true) WITH CHECK (true);

-- Seed basic sample mappings
INSERT INTO sales_master (master_code, master_name, category_name, item_code, platform_item_name, platform_category_name, platform_name) VALUES
('', 'Badam Milk', 'Beverages', 'TRCIZ019', 'Badam Milk', 'Beverages', 'Offline'),
('', 'Black Coffee', 'Beverages', 'TRCIZ031', 'Black Coffee', 'Beverages', 'Offline'),
('', 'Filter Coffee', 'Beverages', 'TRCIZ083', 'Filter Coffee', 'Beverages', 'Offline'),
('', 'Butter Idli', 'Break Fast (Idli and Vada)', 'TRCIZ038', 'Butter Idli', 'Break Fast (Idli & Vada)', 'Offline'),
('', 'Plain Idli', 'Break Fast (Idli and Vada)', 'TRCIZ196', 'Plain Idli', 'Break Fast (Idli & Vada)', 'Offline');

-- 9. Create sales_data Table for consolidated raw records
CREATE TABLE IF NOT EXISTS sales_data (
  id BIGSERIAL PRIMARY KEY,
  master_item_name TEXT,
  master_category TEXT,
  sales_type TEXT,
  date TEXT,
  timestamp TEXT,
  invoice_no TEXT,
  item_name TEXT,
  price NUMERIC DEFAULT 0,
  qty NUMERIC DEFAULT 0,
  sub_total NUMERIC DEFAULT 0,
  discount NUMERIC DEFAULT 0,
  tax NUMERIC DEFAULT 0,
  final_total NUMERIC DEFAULT 0,
  table_no TEXT,
  server_name TEXT,
  covers NUMERIC DEFAULT 0,
  variation TEXT,
  category TEXT,
  hsn TEXT,
  code TEXT
);

ALTER TABLE sales_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permissive sales_data" ON sales_data FOR ALL USING (true) WITH CHECK (true);
`;
};

/**
 * Fetches all records from Supabase tables.
 * Returns null if Supabase is not configured or if fetching fails.
 */
export const fetchAllSupabaseData = async () => {
  if (!supabase) return null;

  try {
    const [
      { data: menu, error: menuErr },
      { data: prod, error: prodErr },
      { data: waste, error: wasteErr },
      { data: sales, error: salesErr },
      { data: staff, error: staffErr },
      { data: batter, error: batterErr },
      { data: itemCount, error: itemCountErr },
      { data: salesMaster, error: salesMasterErr },
      salesDataResponse,
    ] = await Promise.all([
      supabase.from("menu_items").select("*"),
      supabase.from("production_records").select("*"),
      supabase.from("wastage_records").select("*"),
      supabase.from("sales_records").select("*"),
      supabase.from("staff_food_records").select("*"),
      supabase.from("batter_reconciliation").select("*"),
      supabase.from("item_count_records").select("*"),
      supabase.from("sales_master").select("*"),
      Promise.resolve(supabase.from("sales_data").select("*")).catch(() => ({ data: [] as any[], error: null })),
    ]);

    if (menuErr || prodErr || wasteErr || salesErr || staffErr || batterErr || itemCountErr || salesMasterErr) {
      console.warn("Supabase fetch completed with some errors. The database schema may not be created yet.", {
        menuErr, prodErr, wasteErr, salesErr, staffErr, batterErr, itemCountErr, salesMasterErr
      });
      return {
        error: "Tables might be missing. You need to create tables in the Supabase Dashboard first.",
      };
    }

    // Adapt database snakeCase properties to app's camelCase structure
    const menuFormatted: MenuItem[] = (menu || []).map((m: any) => ({
      itemCode: m.item_code,
      itemName: m.item_name,
      uom: m.uom,
      unitCost: Number(m.unit_cost) || 0,
      unitPrice: Number(m.unit_price) || 0,
      category: m.category,
    }));

    const prodFormatted: ProductionRecord[] = (prod || []).map((p: any) => ({
      itemCode: p.item_code,
      prodShift1: Number(p.prod_shift_1) || 0,
      prodShift2: Number(p.prod_shift_2) || 0,
    }));

    const wasteFormatted = (w: any): WastageRecord => ({
      itemCode: w.item_code,
      wasteShift1: Number(w.waste_shift_1) || 0,
      wasteShift2: Number(w.waste_shift_2) || 0,
    });
    const wasteMapped: WastageRecord[] = (waste || []).map(wasteFormatted);

    const salesFormatted: SalesRecord[] = (sales || []).map((s: any) => ({
      itemCode: s.item_code,
      qtySold: Number(s.qty_sold) || 0,
      shift: s.shift === 2 ? 2 : 1,
      channel: s.channel,
    }));

    const staffFormatted = (sf: any): StaffFoodRecord => ({
      itemCode: sf.item_code,
      staffQty: Number(sf.staff_qty) || 0,
    });
    const staffMapped: StaffFoodRecord[] = (staff || []).map(staffFormatted);

    const batterFormatted = (b: any): BatterReconciliation => ({
      itemCode: b.item_code,
      ingredientsIssuedKg: Number(b.ingredients_issued_kg) || 0,
      expectedYieldKg: Number(b.expected_yield_kg) || 0,
    });
    const batterMapped: BatterReconciliation[] = (batter || []).map(batterFormatted);

    const countFormatted = (ic: any): ItemCountRecord => ({
      itemCode: ic.item_code,
      openingCount: Number(ic.opening_count) || 0,
      closingCount: Number(ic.closing_count) || 0,
    });
    const countMapped: ItemCountRecord[] = (itemCount || []).map(countFormatted);

    const salesMasterFormatted = (sm: any): SalesMasterRow => ({
      masterCode: sm.master_code || "",
      masterName: sm.master_name || "",
      categoryName: sm.category_name || "",
      itemCode: sm.item_code || "",
      platformItemName: sm.platform_item_name || "",
      platformCategoryName: sm.platform_category_name || "",
      platformName: sm.platform_name || "",
    });
    const salesMasterMapped: SalesMasterRow[] = (salesMaster || []).map(salesMasterFormatted);

    const sdData = salesDataResponse?.data || [];
    const salesDataMapped: SalesDataRecord[] = sdData.map((s: any) => ({
      id: s.id,
      masterItemName: s.master_item_name || "",
      masterCategory: s.master_category || "",
      salesType: s.sales_type || "",
      date: s.date || "",
      timestamp: s.timestamp || "",
      invoiceNo: s.invoice_no || "",
      itemName: s.item_name || "",
      price: Number(s.price) || 0,
      qty: Number(s.qty) || 0,
      subTotal: Number(s.sub_total) || 0,
      discount: Number(s.discount) || 0,
      tax: Number(s.tax) || 0,
      finalTotal: Number(s.final_total) || 0,
      tableNo: s.table_no || "",
      serverName: s.server_name || "",
      covers: Number(s.covers) || 0,
      variation: s.variation || "",
      category: s.category || "",
      hsn: s.hsn || "",
      code: s.code || ""
    }));

    return {
      menuList: menuFormatted,
      productionList: prodFormatted,
      wastageList: wasteMapped,
      salesList: salesFormatted,
      staffFoodList: staffMapped,
      batterReconList: batterMapped,
      itemCountList: countMapped,
      salesMasterList: salesMasterMapped,
      salesDataList: salesDataMapped,
    };
  } catch (error: any) {
    console.error("Critical Supabase Fetch Error", error);
    return { error: error.message };
  }
};

/**
 * Persists all local states safely back into Supabase in logical batches.
 */
export const syncAllToSupabase = async (
  menuList: MenuItem[],
  productionList: ProductionRecord[],
  wastageList: WastageRecord[],
  salesList: SalesRecord[],
  staffFoodList: StaffFoodRecord[],
  batterReconList: BatterReconciliation[],
  itemCountList: ItemCountRecord[],
  salesMasterList?: SalesMasterRow[]
) => {
  if (!supabase) return { error: "Supabase client not initialized" };

  try {
    // 1. Menu Items
    const dbMenuItems = menuList.map((m) => ({
      item_code: m.itemCode,
      item_name: m.itemName,
      uom: m.uom,
      unit_cost: m.unitCost,
      unit_price: m.unitPrice,
      category: m.category,
    }));
    const { error: menuErr } = await supabase.from("menu_items").upsert(dbMenuItems, { onConflict: "item_code" });
    if (menuErr) throw menuErr;

    // 2. Production Records
    const dbProd = productionList.map((p) => ({
      item_code: p.itemCode,
      prod_shift_1: p.prodShift1,
      prod_shift_2: p.prodShift2,
    }));
    if (dbProd.length > 0) {
      const { error: prodErr } = await supabase.from("production_records").upsert(dbProd, { onConflict: "item_code" });
      if (prodErr) throw prodErr;
    }

    // 3. Wastage Records
    const dbWaste = wastageList.map((w) => ({
      item_code: w.itemCode,
      waste_shift_1: w.wasteShift1,
      waste_shift_2: w.wasteShift2,
    }));
    if (dbWaste.length > 0) {
      const { error: wasteErr } = await supabase.from("wastage_records").upsert(dbWaste, { onConflict: "item_code" });
      if (wasteErr) throw wasteErr;
    }

    // 4. Sales Records (Wipe and replenish table to mirror standard live simulated states cleanly)
    // Wipe:
    const { error: deleteSalesErr } = await supabase.from("sales_records").delete().neq("id", 0);
    if (deleteSalesErr) throw deleteSalesErr;

    const dbSales = salesList.map((s) => ({
      item_code: s.itemCode,
      qty_sold: s.qtySold,
      shift: s.shift,
      channel: s.channel,
    }));
    if (dbSales.length > 0) {
      const { error: salesErr } = await supabase.from("sales_records").insert(dbSales);
      if (salesErr) throw salesErr;
    }

    // 5. Staff Food
    const dbStaff = staffFoodList.map((sf) => ({
      item_code: sf.itemCode,
      staff_qty: sf.staffQty,
    }));
    if (dbStaff.length > 0) {
      const { error: staffErr } = await supabase.from("staff_food_records").upsert(dbStaff, { onConflict: "item_code" });
      if (staffErr) throw staffErr;
    }

    // 6. Batter Reconciliation
    const dbBatter = batterReconList.map((b) => ({
      item_code: b.itemCode,
      ingredients_issued_kg: b.ingredientsIssuedKg,
      expected_yield_kg: b.expectedYieldKg,
    }));
    if (dbBatter.length > 0) {
      const { error: batterErr } = await supabase.from("batter_reconciliation").upsert(dbBatter, { onConflict: "item_code" });
      if (batterErr) throw batterErr;
    }

    // 7. Item-wise counts
    const dbCounts = itemCountList.map((ic) => ({
      item_code: ic.itemCode,
      opening_count: ic.openingCount,
      closing_count: ic.closingCount,
    }));
    if (dbCounts.length > 0) {
      const { error: countErr } = await supabase.from("item_count_records").upsert(dbCounts, { onConflict: "item_code" });
      if (countErr) throw countErr;
    }

    // 8. Sales Master Mappings (RSP)
    if (salesMasterList && salesMasterList.length > 0) {
      // Clear and repopulate sales_master for perfect consistency
      const { error: deleteSMErr } = await supabase.from("sales_master").delete().neq("id", 0);
      // Ignore if table is missing or empty, throw on real authentication or validation errors
      if (deleteSMErr && !deleteSMErr.message.includes("does not exist")) throw deleteSMErr;

      const dbSM = salesMasterList.map((sm) => ({
        master_code: sm.masterCode || "",
        master_name: sm.masterName,
        category_name: sm.categoryName,
        item_code: sm.itemCode,
        platform_item_name: sm.platformItemName,
        platform_category_name: sm.platformCategoryName,
        platform_name: sm.platformName,
      }));
      
      const { error: smErr } = await supabase.from("sales_master").insert(dbSM);
      if (smErr) throw smErr;
    }

    return { success: true };
  } catch (err: any) {
    console.error("Supabase Save Error", err);
    return { error: err.message || err };
  }
};

/**
 * Uploads/Push merged & resolved raw sales data ledger directly into 'sales_data' table
 */
export const pushSalesDataToSupabase = async (salesDataList: SalesDataRecord[]) => {
  if (!supabase) return { error: "Supabase client not initialized" };

  try {
    // Wipe matching table rows first to keep a single correct copy of the uploaded day/matrix
    const { error: deleteErr } = await supabase.from("sales_data").delete().neq("id", 0);
    if (deleteErr && !deleteErr.message.includes("does not exist")) {
      throw deleteErr;
    }

    // Insert rows in compact batches
    const batchSize = 100;
    for (let i = 0; i < salesDataList.length; i += batchSize) {
      const batchChunk = salesDataList.slice(i, i + batchSize).map((s) => ({
        master_item_name: s.masterItemName || "",
        master_category: s.masterCategory || "",
        sales_type: s.salesType || "",
        date: s.date || "",
        timestamp: s.timestamp || "",
        invoice_no: s.invoiceNo || "",
        item_name: s.itemName || "",
        price: s.price || 0,
        qty: s.qty || 0,
        sub_total: s.subTotal || 0,
        discount: s.discount || 0,
        tax: s.tax || 0,
        final_total: s.finalTotal || 0,
        table_no: s.tableNo || "",
        server_name: s.serverName || "",
        covers: s.covers || 0,
        variation: s.variation || "",
        category: s.category || "",
        hsn: s.hsn || "",
        code: s.code || ""
      }));

      const { error: insertErr } = await supabase.from("sales_data").insert(batchChunk);
      if (insertErr) throw insertErr;
    }

    return { success: true };
  } catch (err: any) {
    console.error("Supabase sales_data Insert Error", err);
    return { error: err.message || err };
  }
};
