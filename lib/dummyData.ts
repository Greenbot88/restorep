export interface MenuItem {
  itemCode: string;
  itemName: string;
  uom: string;
  unitPrice: number;
  unitCost: number;
  category: "Batter" | "Chutney" | "Beverage" | "Main Dishes" | "Sweets";
}

export interface ProductionRecord {
  itemCode: string;
  prodShift1: number;
  prodShift2: number;
}

export interface WastageRecord {
  itemCode: string;
  wasteShift1: number;
  wasteShift2: number;
}

export interface SalesRecord {
  itemCode: string;
  qtySold: number;
  shift: 1 | 2;
  channel: "DineIn" | "Takeaway" | "Online";
}

export interface SalesDataRecord {
  id?: number;
  masterItemName: string;
  masterCategory: string;
  salesType: string;
  date: string;
  timestamp: string;
  invoiceNo: string;
  itemName: string;
  price: number;
  qty: number;
  subTotal: number;
  discount: number;
  tax: number;
  finalTotal: number;
  tableNo: string;
  serverName: string;
  covers: number;
  variation: string;
  category: string;
  hsn: string;
  code: string;
}

export interface StaffFoodRecord {
  itemCode: string;
  staffQty: number;
}

export interface BatterReconciliation {
  itemCode: string;
  ingredientsIssuedKg: number;
  expectedYieldKg: number;
}

export interface ItemCountRecord {
  itemCode: string;
  openingCount: number;
  closingCount: number;
}

export const INITIAL_MENU: MenuItem[] = [
  { itemCode: "TRCIP001", itemName: "Masala Dosa Batter", uom: "KG", unitPrice: 150, unitCost: 55, category: "Batter" },
  { itemCode: "TRCIP002", itemName: "Khali Dosa Batter", uom: "KG", unitPrice: 130, unitCost: 48, category: "Batter" },
  { itemCode: "TRCIP004", itemName: "Idli Batter", uom: "KG", unitPrice: 110, unitCost: 40, category: "Batter" },
  { itemCode: "TRCIP005", itemName: "Neer Dosa Batter", uom: "KG", unitPrice: 160, unitCost: 65, category: "Batter" },
  { itemCode: "TRCIP007", itemName: "Neer Chutney", uom: "KG", unitPrice: 180, unitCost: 75, category: "Chutney" },
  { itemCode: "TRCIP009", itemName: "Plain Vada Batter", uom: "KG", unitPrice: 170, unitCost: 70, category: "Batter" },
  { itemCode: "TRCIP015", itemName: "White Chutney", uom: "KG", unitPrice: 90, unitCost: 35, category: "Chutney" },
  { itemCode: "TRCIP020", itemName: "Ghee Podi Idli", uom: "PCS", unitPrice: 60, unitCost: 20, category: "Main Dishes" },
  { itemCode: "TRCIP021", itemName: "Rava Kesari", uom: "PCS", unitPrice: 50, unitCost: 15, category: "Sweets" },
  { itemCode: "TRCIP022", itemName: "Pineapple Juice", uom: "LTR", unitPrice: 120, unitCost: 45, category: "Beverage" },
  { itemCode: "TRCIP023", itemName: "Vanilla Icecream", uom: "LTR", unitPrice: 200, unitCost: 80, category: "Beverage" },
  { itemCode: "TRCIP024", itemName: "Filter Coffee", uom: "LTR", unitPrice: 140, unitCost: 50, category: "Beverage" }
];

export const INITIAL_PRODUCTION: ProductionRecord[] = [
  { itemCode: "TRCIP001", prodShift1: 211, prodShift2: 100 },
  { itemCode: "TRCIP002", prodShift1: 58, prodShift2: 47 },
  { itemCode: "TRCIP004", prodShift1: 139, prodShift2: 103 },
  { itemCode: "TRCIP005", prodShift1: 16, prodShift2: 14 },
  { itemCode: "TRCIP007", prodShift1: 26, prodShift2: 35 },
  { itemCode: "TRCIP009", prodShift1: 31, prodShift2: 7 },
  { itemCode: "TRCIP015", prodShift1: 192, prodShift2: 169 },
  { itemCode: "TRCIP020", prodShift1: 350, prodShift2: 220 },
  { itemCode: "TRCIP021", prodShift1: 120, prodShift2: 80 },
  { itemCode: "TRCIP022", prodShift1: 45, prodShift2: 30 },
  { itemCode: "TRCIP023", prodShift1: 25, prodShift2: 15 },
  { itemCode: "TRCIP024", prodShift1: 85, prodShift2: 65 }
];

export const INITIAL_WASTAGE: WastageRecord[] = [
  { itemCode: "TRCIP001", wasteShift1: 0, wasteShift2: 9 },
  { itemCode: "TRCIP002", wasteShift1: 0, wasteShift2: 7 },
  { itemCode: "TRCIP004", wasteShift1: 0, wasteShift2: 0 },
  { itemCode: "TRCIP005", wasteShift1: 0, wasteShift2: 0 },
  { itemCode: "TRCIP007", wasteShift1: 0, wasteShift2: 3 },
  { itemCode: "TRCIP009", wasteShift1: 0, wasteShift2: 0 },
  { itemCode: "TRCIP015", wasteShift1: 0, wasteShift2: 0 },
  { itemCode: "TRCIP020", wasteShift1: 5, wasteShift2: 12 },
  { itemCode: "TRCIP021", wasteShift1: 2, wasteShift2: 4 },
  { itemCode: "TRCIP022", wasteShift1: 1, wasteShift2: 2 },
  { itemCode: "TRCIP023", wasteShift1: 0, wasteShift2: 1 },
  { itemCode: "TRCIP024", wasteShift1: 3, wasteShift2: 4 }
];

export const INITIAL_SALES: SalesRecord[] = [
  // Masala Dosa Batter: total production = 311, waste = 9. Sales qty = 295.
  { itemCode: "TRCIP001", qtySold: 190, shift: 1, channel: "DineIn" },
  { itemCode: "TRCIP001", qtySold: 65, shift: 1, channel: "Online" },
  { itemCode: "TRCIP001", qtySold: 40, shift: 2, channel: "Takeaway" },

  // Khali Dosa Batter: total prod = 105, waste = 7. Sales qty = 95.
  { itemCode: "TRCIP002", qtySold: 50, shift: 1, channel: "DineIn" },
  { itemCode: "TRCIP002", qtySold: 30, shift: 2, channel: "Online" },
  { itemCode: "TRCIP002", qtySold: 15, shift: 2, channel: "Takeaway" },

  // Idli Batter: total prod = 242, waste = 0. Sales qty = 232.
  { itemCode: "TRCIP004", qtySold: 130, shift: 1, channel: "DineIn" },
  { itemCode: "TRCIP004", qtySold: 65, shift: 1, channel: "Online" },
  { itemCode: "TRCIP004", qtySold: 37, shift: 2, channel: "Takeaway" },

  // Neer Dosa Batter: prod = 30, waste = 0. Sales = 28.
  { itemCode: "TRCIP005", qtySold: 18, shift: 1, channel: "DineIn" },
  { itemCode: "TRCIP005", qtySold: 10, shift: 2, channel: "Online" },

  // Neer Chutney: prod = 61, waste = 3. Sales = 55.
  { itemCode: "TRCIP007", qtySold: 35, shift: 1, channel: "DineIn" },
  { itemCode: "TRCIP007", qtySold: 20, shift: 2, channel: "Online" },

  // Plain Vada Batter: prod = 38, waste = 0. Sales = 35.
  { itemCode: "TRCIP009", qtySold: 25, shift: 1, channel: "DineIn" },
  { itemCode: "TRCIP009", qtySold: 10, shift: 2, channel: "Takeaway" },

  // White Chutney: prod = 361, waste = 0. Sales = 350.
  { itemCode: "TRCIP015", qtySold: 220, shift: 1, channel: "DineIn" },
  { itemCode: "TRCIP015", qtySold: 80, shift: 1, channel: "Online" },
  { itemCode: "TRCIP015", qtySold: 50, shift: 2, channel: "Takeaway" },

  // Ghee Podi Idli
  { itemCode: "TRCIP020", qtySold: 320, shift: 1, channel: "DineIn" },
  { itemCode: "TRCIP020", qtySold: 150, shift: 2, channel: "Online" },

  // Rava Kesari
  { itemCode: "TRCIP021", qtySold: 180, shift: 1, channel: "DineIn" },

  // Pineapple Juice
  { itemCode: "TRCIP022", qtySold: 68, shift: 1, channel: "DineIn" },

  // Vanilla Icecream
  { itemCode: "TRCIP023", qtySold: 36, shift: 2, channel: "Takeaway" },

  // Filter Coffee
  { itemCode: "TRCIP024", qtySold: 138, shift: 1, channel: "DineIn" }
];

export const INITIAL_STAFF_FOOD: StaffFoodRecord[] = [
  { itemCode: "TRCIP001", staffQty: 5 },
  { itemCode: "TRCIP002", staffQty: 2 },
  { itemCode: "TRCIP004", staffQty: 8 },
  { itemCode: "TRCIP005", staffQty: 1 },
  { itemCode: "TRCIP007", staffQty: 2 },
  { itemCode: "TRCIP009", staffQty: 2 },
  { itemCode: "TRCIP015", staffQty: 8 },
  { itemCode: "TRCIP020", staffQty: 12 },
  { itemCode: "TRCIP021", staffQty: 5 },
  { itemCode: "TRCIP024", staffQty: 6 }
];

export const INITIAL_BATTER_RECONCILIATION: BatterReconciliation[] = [
  { itemCode: "TRCIP001", ingredientsIssuedKg: 350, expectedYieldKg: 320 },
  { itemCode: "TRCIP002", ingredientsIssuedKg: 120, expectedYieldKg: 110 },
  { itemCode: "TRCIP004", ingredientsIssuedKg: 270, expectedYieldKg: 250 },
  { itemCode: "TRCIP005", ingredientsIssuedKg: 35, expectedYieldKg: 32 },
  { itemCode: "TRCIP009", ingredientsIssuedKg: 45, expectedYieldKg: 40 }
];

export const INITIAL_ITEM_COUNT: ItemCountRecord[] = [
  { itemCode: "TRCIP001", openingCount: 45, closingCount: 42 },
  { itemCode: "TRCIP002", openingCount: 15, closingCount: 12 },
  { itemCode: "TRCIP004", openingCount: 30, closingCount: 28 },
  { itemCode: "TRCIP005", openingCount: 8, closingCount: 7 },
  { itemCode: "TRCIP007", openingCount: 12, closingCount: 10 },
  { itemCode: "TRCIP009", openingCount: 10, closingCount: 9 },
  { itemCode: "TRCIP015", openingCount: 40, closingCount: 38 },
  { itemCode: "TRCIP020", openingCount: 100, closingCount: 80 },
  { itemCode: "TRCIP021", openingCount: 50, closingCount: 45 },
  { itemCode: "TRCIP022", openingCount: 20, closingCount: 18 },
  { itemCode: "TRCIP023", openingCount: 15, closingCount: 14 },
  { itemCode: "TRCIP024", openingCount: 60, closingCount: 55 }
];
