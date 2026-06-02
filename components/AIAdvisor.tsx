"use client";

import { useState } from "react";
import { Sparkles, Sliders, RefreshCw, CheckCircle, AlertCircle, TrendingUpIcon } from "lucide-react";
import { MenuItem, ProductionRecord, WastageRecord, SalesRecord } from "@/lib/dummyData";

interface AIAdvisorProps {
  menuList: MenuItem[];
  productionList: ProductionRecord[];
  wastageList: WastageRecord[];
  salesList: SalesRecord[];
}

export default function AIAdvisor({
  menuList,
  productionList,
  wastageList,
  salesList,
}: AIAdvisorProps) {
  const [loading, setLoading] = useState(false);
  const [adviceHtml, setAdviceHtml] = useState<string | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [analyticsType, setAnalyticsType] = useState("Wastage Minimization & Batch Sizes");

  const options = [
    "Wastage Minimization & Batch Sizes",
    "Staff Food Cost Reduction",
    "Dynamic Bundles / Special Promos for Excess",
    "Reconciliation Variance Discrepancy Alert",
  ];

  const handleRunAudit = async () => {
    setLoading(true);
    setErrorText(null);
    setAdviceHtml(null);

    // Compute aggregated totals of live state to pass as context
    const datasetSummary = menuList.map((item) => {
      const prod = productionList.find((p) => p.itemCode === item.itemCode);
      const prodTotal = (prod?.prodShift1 || 0) + (prod?.prodShift2 || 0);

      const waste = wastageList.find((w) => w.itemCode === item.itemCode);
      const wasteTotal = (waste?.wasteShift1 || 0) + (waste?.wasteShift2 || 0);

      const itemSales = salesList.filter((s) => s.itemCode === item.itemCode);
      const qtySold = itemSales.reduce((sum, current) => sum + current.qtySold, 0);

      const wasteCost = wasteTotal * item.unitCost;
      const salesValue = qtySold * item.unitPrice;

      return {
        itemCode: item.itemCode,
        itemName: item.itemName,
        uom: item.uom,
        prodTotal,
        wasteTotal,
        wastePercentage: prodTotal > 0 ? ((wasteTotal / prodTotal) * 100).toFixed(1) + "%" : "0.0%",
        wasteCostRupeas: wasteCost,
        qtySold,
        salesRevRupeas: salesValue,
        variance: prodTotal - qtySold - wasteTotal
      };
    });

    try {
      const response = await fetch("/applet/api/gemini", {
        // Fallback checks due to reverse proxy layouts
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ datasetSummary, analyticsType })
      }).then(async (res) => {
        // Try fallback to absolute url if reverse proxy relative route isn't hit
        if (!res.ok) {
          return fetch("/api/gemini", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ datasetSummary, analyticsType })
          });
        }
        return res;
      });

      if (!response.ok) {
        throw new Error(`Server returned status: ${response.status}`);
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.details || data.error);
      }

      setAdviceHtml(data.text);
    } catch (err: any) {
      console.error(err);
      setErrorText(
        err.message || 
        "Something went wrong while auditing the kitchen metrics. Please ensure your Gemini API Key is set up in secrets."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-[#0c2f5d] to-[#01142a] rounded-xl text-white shadow-md border border-sky-900/40 p-6 mb-8 select-none">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5">
        
        {/* Header Branding */}
        <div className="flex items-start gap-3">
          <div className="bg-sky-400/10 p-2 rounded-xl text-sky-400 border border-sky-400/20">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <span className="bg-sky-400/20 border border-sky-400/30 text-sky-200 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider font-mono">
              Live AI Expert Integration
            </span>
            <h3 className="text-base font-extrabold tracking-tight mt-1 flex items-center gap-2">
              Rameshwaram Operations Coach
            </h3>
            <p className="text-xs text-sky-200/60 font-medium">
              Connected to server-side Gemini 2.5 Audit model
            </p>
          </div>
        </div>

        {/* Configurations Selector Menu */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5">
            <Sliders className="w-3.5 h-3.5 text-sky-400" />
            <select
              value={analyticsType}
              onChange={(e) => setAnalyticsType(e.target.value)}
              className="bg-transparent text-xs text-white outline-none cursor-pointer border-none font-sans font-bold py-0"
              disabled={loading}
            >
              {options.map((opt) => (
                <option key={opt} value={opt} className="bg-[#02142a] text-xs text-white font-sans font-bold">
                  {opt}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleRunAudit}
            disabled={loading}
            className="flex items-center gap-2 bg-gradient-to-r from-sky-400 to-[#1283e3] hover:from-sky-300 hover:to-sky-400 text-slate-950 font-black tracking-tight text-xs px-4 py-2.5 rounded-lg active:scale-95 transition-all shadow-lg hover:shadow-sky-500/10 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
          >
            {loading ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            <span>{loading ? "Analyzing..." : "Perform Kitchen Audit"}</span>
          </button>
        </div>
      </div>

      {/* RESULT AND LOADER CONTAINER */}
      <div className="mt-5 min-h-[50px]">
        {loading && (
          <div className="py-6 flex flex-col items-center justify-center gap-3">
            <div className="relative w-10 h-10 flex items-center justify-center">
              <div className="absolute w-full h-full rounded-full border-4 border-sky-400/20 border-t-sky-400 animate-spin"></div>
              <Sparkles className="w-4 h-4 text-sky-400 animate-bounce" />
            </div>
            <p className="text-xs text-sky-200/70 font-mono animate-pulse text-center max-w-sm">
              Parsing raw quantities of {menuList.length} items, computing losses in ₹, and preparing operations strategy...
            </p>
          </div>
        )}

        {errorText && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3.5 text-red-100 text-xs flex gap-2.5">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
            <div>
              <p className="font-bold mb-0.5">Audit Processing Failure</p>
              <p className="opacity-80 leading-relaxed font-mono text-[10px]">{errorText}</p>
            </div>
          </div>
        )}

        {adviceHtml && !loading && (
          <div className="bg-white/5 border border-white/10 rounded-lg p-5 font-sans text-sm text-sky-100">
            <div className="flex items-center gap-2.5 mb-3 border-b border-white/10 pb-2 text-sky-300">
              <CheckCircle className="w-4.5 h-4.5 text-green-400" />
              <span className="text-[11px] font-black uppercase tracking-widest font-mono">
                Mahesh&apos;s Active Audit Recommendation Ready
              </span>
            </div>
            
            {/* Displaying AI recommendations */}
            <div className="prose prose-invert prose-xs leading-relaxed space-y-4 font-normal text-gray-200">
              {adviceHtml.split("\n\n").map((para, pi) => {
                // Formatting bullet checklists
                if (para.trim().startsWith("*") || para.trim().startsWith("-")) {
                  return (
                    <ul key={pi} className="list-disc pl-5 space-y-1.5">
                      {para.split("\n").map((li, liIdx) => (
                        <li key={liIdx} className="text-xs">
                          {li.replace(/^[\s*-]+/, "").replace(/\*\*(.*?)\*\*/g, "$1")}
                        </li>
                      ))}
                    </ul>
                  );
                }
                
                // Formatting headings
                if (para.trim().startsWith("###")) {
                  return (
                    <h4 key={pi} className="text-sm font-black text-sky-300 mt-4 border-l-2 border-sky-400 pl-2">
                      {para.replace("###", "").trim()}
                    </h4>
                  );
                }
                
                // Bold replacement helper
                const formattedText = para.replace(/\*\*(.*?)\*\*/g, "$1");
                return (
                  <p key={pi} className="text-xs leading-relaxed" style={{ contentVisibility: "auto" }}>
                    {formattedText}
                  </p>
                );
              })}
            </div>
          </div>
        )}

        {!loading && !adviceHtml && !errorText && (
          <div className="bg-white/5 border border-dashed border-white/10 rounded-lg p-6 text-center text-xs text-sky-200/50">
            <p className="font-semibold mb-1">Audit Coach Node is Idle</p>
            <p className="text-[10px] leading-relaxed max-w-md mx-auto">
              Click &quot;Perform Kitchen Audit&quot; to run the metrics analyzer. It will trace shift balances, identify battery leaks, and offer strategic suggestions based on today&apos;s Indiranagar records.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
