import React, { useState } from 'react';
import {
  Gift,
  Coins,
  Sparkles,
  CheckCircle2,
  QrCode,
  ShoppingBag,
  Coffee,
  Bus,
  Zap,
  Trees,
  Tag,
  ArrowRight,
  Clock,
  Check,
  AlertCircle,
} from 'lucide-react';
import { CouponReward, UserCoupon } from '../types/recycling';
import { INITIAL_COUPON_REWARDS } from '../data/mockData';

interface EcoRewardsProps {
  coins: number;
  onRedeemCoupon: (coupon: CouponReward) => boolean;
  userCoupons: UserCoupon[];
  onMarkCouponUsed: (couponId: string) => void;
  onNavigateToScanner: () => void;
}

export const EcoRewards: React.FC<EcoRewardsProps> = ({
  coins,
  onRedeemCoupon,
  userCoupons,
  onMarkCouponUsed,
  onNavigateToScanner,
}) => {
  const [activeTab, setActiveTab] = useState<'catalog' | 'wallet'>('catalog');
  const [selectedCouponForDetail, setSelectedCouponForDetail] = useState<UserCoupon | null>(null);
  const [redeemSuccessAlert, setRedeemSuccessAlert] = useState<string | null>(null);

  const getPartnerIcon = (category: string) => {
    switch (category) {
      case 'Groceries':
        return ShoppingBag;
      case 'Cafe':
        return Coffee;
      case 'Transit':
        return Bus;
      case 'Utility Credits':
        return Zap;
      case 'Tree Planting':
        return Trees;
      default:
        return Tag;
    }
  };

  const handleRedeem = (coupon: CouponReward) => {
    if (coins < coupon.coinCost) {
      alert(`You need ${coupon.coinCost - coins} more EcoCoins to redeem this voucher. Try scanning a waste item or sharing cardboard boxes with a neighbor!`);
      return;
    }

    const success = onRedeemCoupon(coupon);
    if (success) {
      setRedeemSuccessAlert(`Congratulations! ${coupon.title} is now in your Coupon Wallet!`);
      setTimeout(() => setRedeemSuccessAlert(null), 5000);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Hero Balance & Impact Banner */}
      <div className="rounded-3xl border border-amber-500/30 bg-gradient-to-br from-slate-900 via-amber-950/20 to-slate-900 p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Verified Circular Economy Currency</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white">
              EcoRewards & Municipal Coupons
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
              Turn proper waste sorting, fast home upcycling, and neighborhood donation into tangible coupons for local groceries, transit, zero-waste cafes, and municipal utility bills.
            </p>
          </div>

          {/* Balance Widget */}
          <div className="px-6 py-5 rounded-2xl bg-slate-950/80 border border-amber-500/40 text-center shrink-0 shadow-lg min-w-[200px]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
              Available Balance
            </span>
            <div className="flex items-center justify-center gap-2 my-1">
              <Coins className="w-7 h-7 text-amber-400 fill-amber-400 animate-pulse" />
              <span className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                {coins.toLocaleString()}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              ≈ ${(coins * 0.05).toFixed(2)} in local merchant credit
            </p>
          </div>
        </div>

        {/* Earning Tip Bar */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-emerald-400">Ways to earn:</span>
            <span>Scan trash (+25)</span>
            <span>•</span>
            <span>DIY upcycling (+40)</span>
            <span>•</span>
            <span>Neighbor material gift (+80)</span>
          </div>
          <button
            onClick={onNavigateToScanner}
            className="text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 cursor-pointer"
          >
            <span>Scan trash now</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Success notification */}
      {redeemSuccessAlert && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-200 text-xs sm:text-sm flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{redeemSuccessAlert}</span>
          </div>
          <button
            onClick={() => setActiveTab('wallet')}
            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs"
          >
            Open Wallet
          </button>
        </div>
      )}

      {/* Tab Selector */}
      <div className="flex border-b border-slate-800 gap-6">
        <button
          onClick={() => setActiveTab('catalog')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'catalog'
              ? 'border-amber-400 text-amber-300'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Gift className="w-4 h-4" />
          <span>Reward Coupon Catalog ({INITIAL_COUPON_REWARDS.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('wallet')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'wallet'
              ? 'border-amber-400 text-amber-300'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <QrCode className="w-4 h-4" />
          <span>My Active Coupons ({userCoupons.filter((c) => !c.used).length})</span>
        </button>
      </div>

      {/* REWARD CATALOG */}
      {activeTab === 'catalog' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {INITIAL_COUPON_REWARDS.map((reward) => {
            const Icon = getPartnerIcon(reward.category);
            const canAfford = coins >= reward.coinCost;

            return (
              <div
                key={reward.id}
                className="rounded-3xl border border-slate-800 bg-slate-900 p-6 flex flex-col justify-between hover:border-amber-500/40 transition-all shadow-lg group relative overflow-hidden"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-[11px] font-semibold">
                      {reward.partner}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-bold">
                      {reward.badge}
                    </span>
                  </div>

                  <div className="flex items-start gap-3.5 my-2">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white group-hover:text-amber-200 transition-colors leading-snug">
                        {reward.title}
                      </h3>
                      <p className="text-sm font-extrabold text-emerald-400 mt-0.5">
                        {reward.discountValue}
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 mt-2">
                    {reward.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Coins className="w-4 h-4 text-amber-400 fill-amber-400" />
                    <span className="text-sm font-black text-white">
                      {reward.coinCost} Coins
                    </span>
                  </div>

                  <button
                    onClick={() => handleRedeem(reward)}
                    disabled={!canAfford}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      canAfford
                        ? 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 shadow-md shadow-amber-500/20 active:scale-95 cursor-pointer'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    <span>{canAfford ? 'Redeem Voucher' : `Need ${reward.coinCost - coins} more`}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* USER ACTIVE COUPONS WALLET */}
      {activeTab === 'wallet' && (
        <div className="space-y-6">
          {userCoupons.length === 0 ? (
            <div className="p-12 rounded-3xl border border-dashed border-slate-800 bg-slate-900/50 text-center space-y-3">
              <Gift className="w-12 h-12 text-slate-600 mx-auto" />
              <h3 className="text-lg font-bold text-white">No Coupons In Wallet Yet</h3>
              <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
                Scan household waste or share surplus materials on the community board to earn EcoCoins, then redeem them here for local vouchers!
              </p>
              <button
                onClick={() => setActiveTab('catalog')}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
              >
                Browse Reward Catalog
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {userCoupons.map((coupon) => (
                <div
                  key={coupon.id}
                  className={`rounded-3xl border p-6 flex flex-col justify-between shadow-xl transition-all relative overflow-hidden ${
                    coupon.used
                      ? 'bg-slate-950 border-slate-800 opacity-60'
                      : 'bg-gradient-to-br from-slate-900 to-slate-950 border-emerald-500/40 shadow-emerald-950/20'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-400">
                        {coupon.partner}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          coupon.used
                            ? 'bg-slate-800 text-slate-400'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}
                      >
                        {coupon.used ? 'Redeemed' : 'Ready to Use'}
                      </span>
                    </div>

                    <h3 className="text-lg font-black text-white">{coupon.title}</h3>
                    <p className="text-base font-extrabold text-amber-400 mt-0.5">
                      {coupon.discountValue}
                    </p>

                    {/* QR Code and Barcode Visual */}
                    <div className="my-4 p-4 rounded-2xl bg-white text-slate-950 flex flex-col items-center justify-center gap-2">
                      <div className="flex items-center gap-3">
                        <QrCode className="w-16 h-16 text-slate-950" />
                        <div className="space-y-1">
                          <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
                            Cashier / Portal Promo Code
                          </p>
                          <p className="text-lg font-mono font-black tracking-widest text-emerald-700">
                            {coupon.code}
                          </p>
                          <p className="text-[10px] text-slate-500">Scan at register or bill pay</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-500" />
                        Expires {coupon.expiresAt}
                      </span>
                    </div>
                  </div>

                  {!coupon.used && (
                    <div className="mt-5 pt-4 border-t border-slate-800 flex justify-end">
                      <button
                        onClick={() => onMarkCouponUsed(coupon.id)}
                        className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Mark as Used at Store</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
