"use client";

import { useState, useEffect } from "react";
import { Coffee, Bell, LogOut, ChevronDown, Check, RefreshCw } from "lucide-react";

interface HeaderProps {
  activeBranch: string;
  setActiveBranch: (branch: string) => void;
  reportDate: string;
  setReportDate: (date: string) => void;
  posSimulationActive: boolean;
  setPosSimulationActive: (active: boolean) => void;
  notificationCount: number;
  openNotifications: () => void;
}

export default function DashboardHeader({
  activeBranch,
  setActiveBranch,
  reportDate,
  setReportDate,
  posSimulationActive,
  setPosSimulationActive,
  notificationCount,
  openNotifications,
}: HeaderProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState("");

  const branches = ["Indiranagar", "Jayanagar", "Whitefield", "Koramangala"];

  useEffect(() => {
    // Elegant dynamic clock
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString("en-US", { hour12: false }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between h-16 px-6 bg-white border-b border-gray-200 shadow-xs">
      {/* BRAND HEADER */}
      <div className="flex items-center gap-3">
        <div className="bg-[#0a4a9b]/5 p-2 rounded-lg text-[#0a4a9b]">
          <Coffee className="w-6 h-6 stroke-[2.2]" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900 flex items-center gap-1.5 leading-none">
            Resto<span className="text-[#0a4a9b]">Rep</span>
          </h1>
          <p className="text-[10px] font-medium tracking-wider text-gray-400 uppercase font-mono mt-0.5">
            Rameshwaram Feed Client
          </p>
        </div>
      </div>

      {/* METADATA CONTROLS - Matches screenshot */}
      <div className="hidden md:flex items-center gap-4 text-sm font-medium text-gray-600">
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors text-xs font-semibold cursor-pointer"
          >
            <span>Branch: <span className="text-[#0a4a9b] font-bold">{activeBranch}</span></span>
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
          {dropdownOpen && (
            <div className="absolute top-[110%] left-0 w-44 bg-white border border-gray-200 rounded-lg shadow-md py-1 z-50">
              {branches.map((b) => (
                <button
                  key={b}
                  onClick={() => {
                    setActiveBranch(b);
                    setDropdownOpen(false);
                  }}
                  className="flex items-center justify-between w-full px-3 py-2 text-left text-xs hover:bg-gray-50 text-gray-700"
                >
                  <span className={b === activeBranch ? "font-bold text-[#0a4a9b]" : ""}>{b}</span>
                  {b === activeBranch && <Check className="w-3 h-3 text-[#0a4a9b]" />}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 border-l border-gray-200 pl-4">
          <span className="text-xs text-gray-400 font-mono">Report Date:</span>
          <input
            type="date"
            value={reportDate}
            onChange={(e) => setReportDate(e.target.value)}
            className="px-2.5 py-1 text-xs font-bold font-mono border border-gray-200 rounded-lg bg-gray-50 outline-none text-[#021f42]"
          />
        </div>


      </div>

      {/* ADMIN CONTROLS & CLOCK */}
      <div className="flex items-center gap-4">
        {/* Real-time Clock */}
        <div className="hidden lg:flex flex-col items-end border-r border-gray-200 pr-4 text-right">
          <span className="text-xs font-bold font-mono text-gray-800 tracking-wider">
            {currentTime}
          </span>
          <span className="text-[9px] font-bold text-green-600 uppercase tracking-widest font-mono flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping"></span>
            Synced
          </span>
        </div>

        {/* Notifications Bell */}
        <button
          onClick={openNotifications}
          className="relative p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-50 transition-colors"
        >
          <Bell className="w-5 h-5 stroke-[2]" />
          {notificationCount > 0 && (
            <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white leading-none">
              {notificationCount}
            </span>
          )}
        </button>

        {/* User Account Menu */}
        <div className="relative">
          <button
            onClick={() => setUserDropdownOpen(!userDropdownOpen)}
            className="flex items-center gap-3 text-left focus:outline-none cursor-pointer"
          >
            <div className="relative">
              {/* Profile Pic Placeholder matching image */}
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-[#0a4a9b] flex items-center justify-center text-white font-black text-sm border-2 border-white shadow-xs">
                M
              </div>
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-white"></div>
            </div>
            <div className="hidden sm:block">
              <p className="text-xs font-bold text-gray-800 leading-none">Mahesh Admin</p>
              <p className="text-[10px] font-medium text-gray-400 mt-0.5">Manager Office</p>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </button>

          {userDropdownOpen && (
            <div className="absolute right-0 top-[120%] w-48 bg-white border border-gray-200 rounded-lg shadow-md py-1 z-50">
              <div className="px-4 py-2 border-b border-gray-100">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Signed In As</p>
                <p className="text-xs font-bold text-gray-800">jambu.aj@gmail.com</p>
              </div>
              <button
                onClick={() => {
                  alert("Signed out from preview mode. Data is retained locally.");
                  setUserDropdownOpen(false);
                }}
                className="flex items-center gap-2 w-full px-4 py-2 text-left text-xs text-red-600 hover:bg-red-50 hover:font-bold transition-all"
              >
                <LogOut className="w-4.5 h-4.5" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
