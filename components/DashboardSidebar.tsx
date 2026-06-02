"use client";

import { 
  FileUp, 
  ShieldCheck, 
  Database, 
  TrendingUp, 
  Plus, 
  AlertTriangle,
  Layers, 
  RefreshCw, 
  Sparkles, 
  Trash2, 
  Utensils, 
  Sliders, 
  Coffee,
  ChevronRight,
  LayoutDashboard
} from "lucide-react";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function DashboardSidebar({ activeTab, setActiveTab }: SidebarProps) {
  // Raw Data input navigation
  const rawDataTabs = [
    { id: "files-upload", label: "Files Upload", icon: FileUp },
    { id: "sales-master", label: "Sales Master", icon: ShieldCheck },
    { id: "sales-data", label: "Sales Data", icon: Database },
    { id: "sales", label: "Sales", icon: TrendingUp },
    { id: "production", label: "Production", icon: Plus },
    { id: "wastage", label: "Wastage", icon: AlertTriangle },
  ];

  // Report navigation
  const reportTabs = [
    { id: "report-production-wastage", label: "1. Production vs Wastage", icon: Layers },
    { id: "report-production-sales", label: "2. Production vs Sales", icon: TrendingUp },
    { id: "report-reconciliation", label: "3. Main Item Reconciliation", icon: RefreshCw },
    { id: "report-highest-lowest", label: "4. Highest and Lowest Selling", icon: Sparkles },
    { id: "report-wastage-costing", label: "5. Wastage Costing", icon: Trash2 },
    { id: "report-staff-food", label: "6. Staff Food Costing", icon: Utensils },
    { id: "report-batter-reconciliation", label: "7. Batter Reconciliation", icon: Sliders },
    { id: "report-item-count", label: "8. Item-wise Count", icon: Database },
    { id: "report-juice-icecream", label: "9. Juice and Icecream Report", icon: Coffee },
  ];

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
  };

  return (
    <aside className="w-64 max-h-[calc(100vh-4rem)] overflow-y-auto bg-[#edf2f9] border-r border-[#cbd6e2] flex flex-col pt-5 shrink-0 scrollbar-thin select-none">
      
      {/* SECTION 0: OVERVIEW */}
      <div className="px-3 mb-6">
        <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-[#5c728a] font-sans">
          Overview
        </p>
        <button
          onClick={() => handleTabClick("overview")}
          className={`flex items-center justify-between w-full px-3 py-2 text-left rounded-lg transition-all border border-transparent cursor-pointer group ${
            activeTab === "overview"
              ? "bg-[#0a4a9b] text-white shadow-sm font-bold font-sans"
              : "text-[#34485e] hover:bg-white/50 hover:text-gray-950 font-medium text-xs"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <LayoutDashboard className={`w-4 h-4 ${activeTab === "overview" ? "text-white" : "text-[#51647a] group-hover:text-gray-900"}`} />
            <span className="text-xs tracking-tight">Dashboard Overview</span>
          </div>
          {activeTab === "overview" && <ChevronRight className="w-3.5 h-3.5 opacity-90" />}
        </button>
      </div>

      {/* SECTION 1: RAW DATA TABS */}
      <div className="px-3 mb-6">
        <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-[#5c728a] font-sans">
          Raw Data Input
        </p>
        <nav className="space-y-0.5">
          {rawDataTabs.map((tab) => {
            const IconComponent = tab.icon;
            const isSelected = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={`flex items-center justify-between w-full px-3 py-2 text-left rounded-lg transition-all border border-transparent cursor-pointer group ${
                  isSelected
                    ? "bg-[#0a4a9b] text-white shadow-sm font-bold font-sans"
                    : "text-[#34485e] hover:bg-white/50 hover:text-gray-950 font-medium text-xs"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <IconComponent className={`w-4 h-4 ${isSelected ? "text-white" : "text-[#51647a] group-hover:text-gray-900"}`} />
                  <span className="text-xs tracking-tight">{tab.label}</span>
                </div>
                {isSelected && <ChevronRight className="w-3.5 h-3.5 opacity-90" />}
              </button>
            );
          })}
        </nav>
      </div>

      {/* SECTION 2: REPORT TABS */}
      <div className="px-3 pb-8">
        <div className="border-t border-[#cbd6e2] pt-4 mb-3">
          <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-[#5c728a] font-sans">
            Reports & Analysis
          </p>
        </div>
        <nav className="space-y-0.5">
          {reportTabs.map((tab) => {
            const IconComponent = tab.icon;
            const isSelected = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={`flex items-center justify-between w-full px-3 py-2 text-left rounded-lg transition-all border border-transparent cursor-pointer group ${
                  isSelected
                    ? "bg-[#0a4a9b] text-white shadow-sm font-bold font-sans"
                    : "text-[#34485e] hover:bg-white/50 hover:text-gray-950 font-medium text-xs"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <IconComponent className={`w-4 h-4 ${isSelected ? "text-white" : "text-[#51647a] group-hover:text-gray-900"}`} />
                  <span className="text-xs truncate tracking-tight">{tab.label}</span>
                </div>
                {isSelected && <ChevronRight className="w-3.5 h-3.5 opacity-90" />}
              </button>
            );
          })}
        </nav>
      </div>

      {/* FOOTER */}
      <div className="mt-auto p-4 border-t border-[#cbd6e2] bg-[#e2eaf4] text-[10px] text-center text-gray-500 font-mono">
        Rameshwaram Cafe v2.6<br/>
        Report Node #Indiranagar
      </div>
    </aside>
  );
}
