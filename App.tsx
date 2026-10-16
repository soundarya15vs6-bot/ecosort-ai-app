/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { WasteScanner } from './components/WasteScanner';
import { HomeUpcycling } from './components/HomeUpcycling';
import { CommunityExchange } from './components/CommunityExchange';
import { EcoRewards } from './components/EcoRewards';
import { SmartBinLogistics } from './components/SmartBinLogistics';
import { EcoAssistantChat } from './components/EcoAssistantChat';
import { VoiceConversationLive } from './components/VoiceConversationLive';
import { AudioTranscriber } from './components/AudioTranscriber';
import { WasteAnalysisResult, FastHomeUpcycle, CouponReward, UserCoupon } from './types/recycling';
import { Coins, Sparkles, X, Heart, ShieldCheck, Radio, Mic } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('scanner');
  const [coins, setCoins] = useState(165); // Generous starting balance so user can immediately test coupon bazaar
  const [userCoupons, setUserCoupons] = useState<UserCoupon[]>([
    {
      id: 'COUP-INIT-1',
      couponId: 'COUP-2',
      title: 'Free Artisanal Coffee or Refillable Drink',
      partner: 'Café Vert Eco-Roasters',
      discountValue: '100% Free Drink',
      code: 'VERTECO-8821',
      redeemedAt: 'Yesterday',
      expiresAt: 'In 14 days',
      used: false,
    },
  ]);

  // Cross-tab workflows
  const [communityPrefillItem, setCommunityPrefillItem] = useState<WasteAnalysisResult | null>(null);
  const [selectedUpcycleItem, setSelectedUpcycleItem] = useState<FastHomeUpcycle | null>(null);
  const [coinAwardAlert, setCoinAwardAlert] = useState<{ amount: number; reason: string } | null>(null);

  const handleEarnCoins = (amount: number, reason: string) => {
    setCoins((prev) => prev + amount);
    setCoinAwardAlert({ amount, reason });
    setTimeout(() => {
      setCoinAwardAlert(null);
    }, 4500);
  };

  const handleDisposedItem = (coinsEarned: number, itemName: string) => {
    handleEarnCoins(coinsEarned, `Properly sorted ${itemName}`);
  };

  const handleNavigateToCommunityWithItem = (item: WasteAnalysisResult) => {
    setCommunityPrefillItem(item);
    setActiveTab('community');
  };

  const handleNavigateToUpcycleWithItem = (upcycle: FastHomeUpcycle) => {
    setSelectedUpcycleItem(upcycle);
    setActiveTab('upcycle');
  };

  const handleRedeemCoupon = (coupon: CouponReward): boolean => {
    if (coins < coupon.coinCost) return false;

    setCoins((prev) => prev - coupon.coinCost);

    const newUserCoupon: UserCoupon = {
      id: `USER-COUP-${Date.now()}`,
      couponId: coupon.id,
      title: coupon.title,
      partner: coupon.partner,
      discountValue: coupon.discountValue,
      code: `ECO-${Math.floor(1000 + Math.random() * 9000)}-${coupon.category.slice(0, 3).toUpperCase()}`,
      redeemedAt: 'Just now',
      expiresAt: 'In 30 days',
      used: false,
    };

    setUserCoupons((prev) => [newUserCoupon, ...prev]);
    return true;
  };

  const handleMarkCouponUsed = (couponId: string) => {
    setUserCoupons((prev) =>
      prev.map((c) => (c.id === couponId ? { ...c, used: true } : c))
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        coins={coins}
        unresolvedBinAlertsCount={2}
      />

      {/* Dynamic Animated Coin Reward Toast */}
      {coinAwardAlert && (
        <div className="fixed top-24 right-4 z-50 animate-in slide-in-from-top-4 fade-in duration-300">
          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow-2xl shadow-amber-500/30 border border-amber-300">
            <div className="w-8 h-8 rounded-full bg-slate-950/20 flex items-center justify-center font-black text-slate-950">
              <Coins className="w-5 h-5 fill-slate-950 text-amber-300" />
            </div>
            <div>
              <p className="text-sm font-black leading-none">
                +{coinAwardAlert.amount} EcoCoins Earned!
              </p>
              <p className="text-xs font-semibold opacity-90 mt-0.5">
                {coinAwardAlert.reason}
              </p>
            </div>
            <button
              onClick={() => setCoinAwardAlert(null)}
              className="text-slate-900/80 hover:text-slate-950 ml-2"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === 'scanner' && (
          <WasteScanner
            onDisposedItem={handleDisposedItem}
            onNavigateToCommunityWithItem={handleNavigateToCommunityWithItem}
            onNavigateToUpcycleWithItem={handleNavigateToUpcycleWithItem}
          />
        )}

        {activeTab === 'upcycle' && (
          <HomeUpcycling
            onEarnCoins={handleEarnCoins}
            initialSelectedProject={selectedUpcycleItem}
          />
        )}

        {activeTab === 'community' && (
          <CommunityExchange
            onEarnCoins={handleEarnCoins}
            prefillFromScan={communityPrefillItem}
          />
        )}

        {activeTab === 'rewards' && (
          <EcoRewards
            coins={coins}
            onRedeemCoupon={handleRedeemCoupon}
            userCoupons={userCoupons}
            onMarkCouponUsed={handleMarkCouponUsed}
            onNavigateToScanner={() => setActiveTab('scanner')}
          />
        )}

        {activeTab === 'smartbins' && (
          <SmartBinLogistics onEarnCoins={handleEarnCoins} />
        )}

        {activeTab === 'livevoice' && <VoiceConversationLive />}

        {activeTab === 'transcribe' && (
          <AudioTranscriber
            onSendToScanner={(txt) => {
              setActiveTab('scanner');
            }}
            onSendToChat={(txt) => {
              setActiveTab('assistant');
            }}
          />
        )}

        {activeTab === 'assistant' && <EcoAssistantChat />}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-900 bg-slate-950/80 py-8 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">EcoSort AI</span>
            <span>•</span>
            <span>Next-Gen Smart Recycling, Hyperlocal Exchanges & B2B Logistics</span>
          </div>

          <div className="flex items-center gap-6 text-slate-400">
            <span className="flex items-center gap-1 text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              Circular Economy Verified
            </span>
            <span>Local Municipality Certified</span>
            <span>Privacy Preserving</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
