"use client";

import { useState } from "react";
import { MenuItem, ProductionRecord, WastageRecord, SalesRecord } from "@/lib/dummyData";

interface ChartsProps {
  menuList: MenuItem[];
  productionList: ProductionRecord[];
  wastageList: WastageRecord[];
  salesList: SalesRecord[];
}

export default function DashboardCharts({
  menuList,
  productionList,
  wastageList,
  salesList,
}: ChartsProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [hoveredType, setHoveredType] = useState<"prod" | "waste" | "sales" | null>(null);

  // 1. Calculate aggregated dataset for top 6 items by total production
  const calculatedData = menuList.map((item) => {
    const prod = productionList.find((p) => p.itemCode === item.itemCode);
    const prodTotal = (prod?.prodShift1 || 0) + (prod?.prodShift2 || 0);

    const waste = wastageList.find((w) => w.itemCode === item.itemCode);
    const wasteTotal = (waste?.wasteShift1 || 0) + (waste?.wasteShift2 || 0);

    const matchSales = salesList.filter((s) => s.itemCode === item.itemCode);
    const salesTotal = matchSales.reduce((acc, curr) => acc + curr.qtySold, 0);

    return {
      code: item.itemCode,
      name: item.itemName,
      production: prodTotal,
      wastage: wasteTotal,
      sales: salesTotal,
      uom: item.uom,
      wasteCost: wasteTotal * item.unitCost,
      salesVal: salesTotal * item.unitPrice,
      category: item.category,
    };
  });

  // Take top items to render beautifully in limited graph real estate
  const barChartData = calculatedData.slice(0, 6);

  // Maximum production value for graph scaling
  const maxVal = Math.max(...barChartData.map((d) => Math.max(d.production, d.sales)), 100);

  // 2. Aggregate wastage cost by category for Donut chart
  const categoryWastageMap: Record<string, number> = {};
  calculatedData.forEach((d) => {
    categoryWastageMap[d.category] = (categoryWastageMap[d.category] || 0) + d.wasteCost;
  });
  const totalWastageCost = Object.values(categoryWastageMap).reduce((sum, v) => sum + v, 0);
  const categoryColors: Record<string, string> = {
    Batter: "#0a4a9b",
    Chutney: "#38bdf8",
    Beverage: "#fbbf24",
    "Main Dishes": "#34d399",
    Sweets: "#ec4899",
  };

  const donutSegments = Object.keys(categoryWastageMap).map((cat) => ({
    name: cat,
    val: categoryWastageMap[cat],
    percent: totalWastageCost > 0 ? (categoryWastageMap[cat] / totalWastageCost) * 100 : 0,
    color: categoryColors[cat] || "#94a3b8",
  }));

  // Calculations for donut SVGs (radius 40, stroke 12, circumference 2 * Math.PI * 40 = 251.32)
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  let accumulatedAngle = 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 select-none">
      
      {/* CHART 1: PRODUCTION VS WASTAGE COMPARISON BAR CHART (SVG) */}
      <div className="lg:col-span-2 bg-white rounded-xl shadow-xs border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-gray-800">Operational Breakdown (Top Items)</h3>
            <p className="text-xs text-gray-400">Comparing Production, Sales & Wastage Vol</p>
          </div>
          <div className="flex items-center gap-3 text-[10px] font-bold font-mono">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-[#0a4a9b] rounded-xs"></span>PROD</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-green-500 rounded-xs"></span>SALES</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-rose-500 rounded-xs"></span>WASTE</span>
          </div>
        </div>

        {/* Dynamic bar charts using inline responsive heights scaling */}
        <div className="h-64 flex items-end gap-5 pt-6 px-1 relative border-b border-gray-100">
          
          {barChartData.map((d, index) => {
            const prodHeight = (d.production / maxVal) * 82; // 82% of container
            const salesHeight = (d.sales / maxVal) * 82;
            const wasteHeight = (d.wastage / maxVal) * 82;

            return (
              <div key={d.code} className="flex-1 flex flex-col items-center h-full group relative">
                
                {/* TOOLTIP ON HOVER */}
                {hoveredIndex === index && (
                  <div className="absolute top-1 z-30 bg-[#02142a] text-white p-2 w-40 rounded-lg shadow-xl text-[10px] animate-fade-in pointer-events-none">
                    <p className="font-bold border-b border-white/20 pb-1 mb-1 truncate text-center">{d.name}</p>
                    <div className="flex justify-between font-mono">
                      <span>Production:</span> 
                      <span className="font-bold">{d.production} {d.uom}</span>
                    </div>
                    <div className="flex justify-between font-mono">
                      <span>Total Sales:</span> 
                      <span className="font-bold text-green-300">{d.sales} {d.uom}</span>
                    </div>
                    <div className="flex justify-between font-mono">
                      <span>Wastage:</span> 
                      <span className="font-bold text-rose-300">{d.wastage} {d.uom}</span>
                    </div>
                    <div className="flex justify-between border-t border-white/10 mt-1 pt-1 font-mono text-cyan-200">
                      <span>Waste Cost:</span> 
                      <span>₹{d.wasteCost.toLocaleString()}</span>
                    </div>
                  </div>
                )}

                {/* GRAPH COLUMN CONTAINER */}
                <div 
                  className="flex items-end justify-center gap-[4%] w-full h-[85%] relative hover:bg-slate-50/50 rounded-t-lg transition-colors cursor-pointer"
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => { setHoveredIndex(null); setHoveredType(null); }}
                >
                  {/* PROD BAR */}
                  <div
                    style={{ height: `${prodHeight}%` }}
                    className={`w-[24%] bg-[#0a4a9b] rounded-t-md transition-all duration-500 ease-out relative ${
                      hoveredType === "prod" || (hoveredIndex === index && hoveredType === null) ? "brightness-125 scale-x-110" : "opacity-85"
                    }`}
                    onMouseEnter={() => setHoveredType("prod")}
                  />
                  
                  {/* SALES BAR */}
                  <div
                    style={{ height: `${salesHeight}%` }}
                    className={`w-[24%] bg-green-500 rounded-t-md transition-all duration-300 ease-out relative ${
                      hoveredType === "sales" || (hoveredIndex === index && hoveredType === null) ? "brightness-110 scale-x-110" : "opacity-85"
                    }`}
                    onMouseEnter={() => setHoveredType("sales")}
                  />

                  {/* WASTE BAR */}
                  <div
                    style={{ height: `${wasteHeight}%` }}
                    className={`w-[24%] bg-rose-500 rounded-t-md transition-all duration-300 ease-out relative ${
                      hoveredType === "waste" || (hoveredIndex === index && hoveredType === null) ? "brightness-110 scale-x-110" : "opacity-85"
                    }`}
                    onMouseEnter={() => setHoveredType("waste")}
                  />
                </div>

                {/* X-AXIS LABELS */}
                <span className="text-[10px] font-bold text-gray-700 tracking-tight block mt-2 mt-auto text-center truncate w-full">
                  {d.name.split(" ")[0]}
                </span>
                <span className="text-[8px] font-mono font-bold text-gray-400">
                  {d.code}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* CHART 2: WASTAGE COSTING SPLIT DONUT CHART (SVG) */}
      <div className="bg-white rounded-xl shadow-xs border border-gray-100 p-5 flex flex-col">
        <div>
          <h3 className="text-sm font-bold text-gray-800">Wastage Cost Split</h3>
          <p className="text-xs text-gray-400">Financial leaking split by product categories</p>
        </div>

        <div className="flex-1 flex flex-col justify-center items-center mt-4">
          <div className="relative w-40 h-40 flex items-center justify-center">
            
            {/* Center Summary Labels */}
            <div className="absolute text-center">
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider font-mono">Total Leak</p>
              <p className="text-lg font-black text-gray-800 font-mono">₹{totalWastageCost.toLocaleString()}</p>
            </div>

            {/* SVG circle rendering */}
            <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
              {donutSegments.length === 0 || totalWastageCost === 0 ? (
                <circle cx="50" cy="50" r={radius} fill="transparent" stroke="#f1f5f9" strokeWidth="11" />
              ) : (
                donutSegments.map((seg, i) => {
                  const strokeWidth = 11;
                  const strokeDasharray = `${(seg.percent / 100) * circumference} ${circumference}`;
                  const strokeDashoffset = -accumulatedAngle;
                  accumulatedAngle += (seg.percent / 100) * circumference;

                  return (
                    <circle
                      key={seg.name}
                      cx="50"
                      cy="50"
                      r={radius}
                      fill="transparent"
                      stroke={seg.color}
                      strokeWidth={strokeWidth}
                      strokeDasharray={strokeDasharray}
                      strokeDashoffset={strokeDashoffset}
                      className="transition-all duration-300 hover:scale-105 transform origin-center cursor-pointer"
                    >
                      <title>{`${seg.name}: ${seg.percent.toFixed(1)}%`}</title>
                    </circle>
                  );
                })
              )}
            </svg>
          </div>

          {/* Color Indicators Legend panel */}
          <div className="w-full mt-5 space-y-1">
            {donutSegments.map((seg) => (
              <div key={seg.name} className="flex items-center justify-between text-xs text-gray-600 font-medium">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: seg.color }} />
                  <span className="truncate">{seg.name}</span>
                </div>
                <div className="flex items-center gap-1.5 font-mono">
                  <span className="text-gray-900 font-bold">₹{seg.val.toLocaleString()}</span>
                  <span className="text-gray-400 text-[10px]">({seg.percent.toFixed(1)}%)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
