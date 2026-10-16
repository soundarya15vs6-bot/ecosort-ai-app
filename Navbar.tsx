import React from 'react';
import {
  Recycle,
  Coins,
  Camera,
  Wrench,
  Users,
  Gift,
  Truck,
  MessageSquare,
  Sparkles,
  AlertTriangle,
  Radio,
  Mic,
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  coins: number;
  unresolvedBinAlertsCount: number;
  openCoinsModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  coins,
  unresolvedBinAlertsCount,
}) => {
  const navItems = [
    { id: 'scanner', label: 'AI Waste Scan', icon: Camera },
    { id: 'livevoice', label: 'Live Voice (3.8 Live)', icon: Radio },
    { id: 'transcribe', label: 'Transcribe Audio (3.5)', icon: Mic },
    { id: 'upcycle', label: 'Home Upcycling', icon: Wrench },
    { id: 'community', label: 'Neighborhood Exchange', icon: Users },
    { id: 'rewards', label: 'EcoRewards & Coupons', icon: Gift },
    { id: 'smartbins', label: 'Smart Bins & B2B', icon: Truck, badge: unresolvedBinAlertsCount },
    { id: 'assistant', label: 'AI Eco Advisor', icon: MessageSquare },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-emerald-900/30 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo & Brand */}
          <div
            onClick={() => setActiveTab('scanner')}
            className="flex items-center gap-3 cursor-pointer group select-none"
          >
            <div className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-green-400 p-0.5 shadow-lg shadow-emerald-500/25 group-hover:scale-105 transition-all">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Recycle className="w-6 h-6 text-emerald-400 animate-spin-slow group-hover:text-emerald-300" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg sm:text-xl tracking-tight bg-gradient-to-r from-emerald-300 via-teal-200 to-white bg-clip-text text-transparent">
                  EcoSort AI
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  Circular Loop
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Smart Sorting • DIY Upcycle • Neighborhood Share • B2B Logistics
              </p>
            </div>
          </div>

          {/* EcoCoins Pill & Quick Action */}
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => setActiveTab('rewards')}
              className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-gradient-to-r from-amber-500/20 to-yellow-500/10 border border-amber-500/30 text-amber-300 hover:border-amber-400 transition-all shadow-sm group"
              title="Click to view EcoRewards and redeem coupons"
            >
              <div className="w-6 h-6 rounded-full bg-amber-400/20 flex items-center justify-center text-amber-300 group-hover:rotate-12 transition-transform">
                <Coins className="w-4 h-4 fill-amber-400 text-amber-500" />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xs font-semibold leading-none text-amber-200">
                  {coins.toLocaleString()}
                </span>
                <span className="text-[10px] text-amber-400/80 leading-none">
                  EcoCoins
                </span>
              </div>
              <Sparkles className="w-3.5 h-3.5 text-amber-300/80 group-hover:scale-125 transition-transform hidden sm:inline" />
            </button>

            <button
              onClick={() => setActiveTab('livevoice')}
              className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-full border text-xs font-semibold transition-all shadow-sm cursor-pointer ${
                activeTab === 'livevoice'
                  ? 'bg-violet-600 border-violet-400 text-white shadow-violet-900/40'
                  : 'bg-violet-500/15 border-violet-500/30 text-violet-300 hover:bg-violet-500/25'
              }`}
              title="Start real-time voice conversation with Gemini 3.8 Live"
            >
              <Radio className="w-3.5 h-3.5 text-violet-300 animate-pulse" />
              <span className="hidden sm:inline">Talk Live</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-violet-400/20 text-violet-200">3.8 Live</span>
            </button>

            {unresolvedBinAlertsCount > 0 && (
              <button
                onClick={() => setActiveTab('smartbins')}
                className="relative hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-medium hover:bg-rose-500/25 transition-colors"
                title={`${unresolvedBinAlertsCount} municipal bins are at capacity and ready for factory collection`}
              >
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                <span>{unresolvedBinAlertsCount} Full Bins</span>
              </button>
            )}
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto no-scrollbar py-2 border-t border-slate-800/80">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap relative ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
                {item.badge && item.badge > 0 ? (
                  <span className="ml-1 px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-bold">
                    {item.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
