import React, { useState, useEffect } from 'react';
import {
  Truck,
  AlertTriangle,
  CheckCircle2,
  Bell,
  Activity,
  Factory,
  RefreshCw,
  MapPin,
  Clock,
  ShieldAlert,
  Send,
  Zap,
  Leaf,
  Plus,
  Radio,
  FileText,
} from 'lucide-react';
import { SmartBin, B2BDispatchOrder } from '../types/recycling';
import { INITIAL_SMART_BINS } from '../data/mockData';

interface SmartBinLogisticsProps {
  onEarnCoins: (amount: number, reason: string) => void;
}

export const SmartBinLogistics: React.FC<SmartBinLogisticsProps> = ({ onEarnCoins }) => {
  const [smartBins, setSmartBins] = useState<SmartBin[]>(INITIAL_SMART_BINS);
  const [dispatches, setDispatches] = useState<B2BDispatchOrder[]>([]);
  const [isLoadingDispatches, setIsLoadingDispatches] = useState(false);
  const [selectedBinForAlert, setSelectedBinForAlert] = useState<SmartBin | null>(null);
  const [alertNotes, setAlertNotes] = useState('');
  const [isDispatching, setIsDispatching] = useState(false);
  const [alertSuccessToast, setAlertSuccessToast] = useState<string | null>(null);

  // Fetch dispatches on load
  useEffect(() => {
    fetchDispatches();
  }, []);

  const fetchDispatches = async () => {
    setIsLoadingDispatches(true);
    try {
      const res = await fetch('/api/b2b/dispatches');
      const data = await res.json();
      if (data.success && data.dispatches) {
        setDispatches(data.dispatches);
      }
    } catch (err) {
      console.warn('Could not fetch dispatches:', err);
    } finally {
      setIsLoadingDispatches(false);
    }
  };

  const handleSimulateFill = (binId: string, deltaPercent: number) => {
    setSmartBins((prev) =>
      prev.map((bin) => {
        if (bin.id !== binId) return bin;
        const newFill = Math.min(100, Math.max(0, bin.fillPercentage + deltaPercent));
        const newKg = Math.round((newFill / 100) * bin.capacityKg);
        const newStatus =
          newFill >= 85 ? 'Full / Pickup Needed' : newFill >= 70 ? 'Warning' : 'Normal';

        // If crossed into >= 85%, trigger automated notification
        if (newFill >= 85 && bin.fillPercentage < 85) {
          triggerAutoDispatch(bin, newFill);
        }

        return {
          ...bin,
          fillPercentage: newFill,
          currentKg: newKg,
          status: newStatus,
        };
      })
    );
  };

  const triggerAutoDispatch = async (bin: SmartBin, fillLevel: number) => {
    try {
      const response = await fetch('/api/b2b/dispatch-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          binId: bin.id,
          binType: bin.type,
          location: bin.location,
          fillLevel,
          notes: 'Automated IoT ultrasonic sensor threshold trigger (>= 85% full)',
        }),
      });
      const data = await response.json();
      if (data.success && data.dispatch) {
        setDispatches((prev) => [data.dispatch, ...prev]);
        setAlertSuccessToast(`Automated sensor trigger: ${bin.name} notified ${data.dispatch.assignedFactory}!`);
        setTimeout(() => setAlertSuccessToast(null), 6000);
      }
    } catch (err) {
      console.error('Auto dispatch error:', err);
    }
  };

  const handleManualDispatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBinForAlert) return;

    setIsDispatching(true);
    try {
      const response = await fetch('/api/b2b/dispatch-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          binId: selectedBinForAlert.id,
          binType: selectedBinForAlert.type,
          location: selectedBinForAlert.location,
          fillLevel: selectedBinForAlert.fillPercentage,
          notes: alertNotes || 'Community verified full bin alert',
        }),
      });

      const data = await response.json();
      setIsDispatching(false);
      if (data.success && data.dispatch) {
        setDispatches((prev) => [data.dispatch, ...prev]);
        setAlertSuccessToast(`Factory Pickup Dispatched! Assigned to ${data.dispatch.assignedFactory} (Truck ETA: ${data.dispatch.etaMinutes} mins)`);
        onEarnCoins(50, `Reported full bin ${selectedBinForAlert.name}`);
        setSelectedBinForAlert(null);
        setAlertNotes('');
        setTimeout(() => setAlertSuccessToast(null), 6000);
      }
    } catch (err) {
      setIsDispatching(false);
      console.error('Manual dispatch error:', err);
    }
  };

  // Color helper for fill progress bar
  const getFillColor = (percentage: number) => {
    if (percentage >= 85) return 'from-rose-500 to-red-600';
    if (percentage >= 70) return 'from-amber-500 to-yellow-500';
    return 'from-emerald-500 to-teal-500';
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Hero Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-2">
            <Radio className="w-3.5 h-3.5 animate-pulse text-blue-400" />
            <span>IoT Sensor Mesh & Municipal B2B Recycling Chain</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            Smart Bin Monitoring & B2B Logistics
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
            When bins reach capacity (85%+), automated alerts notify municipal waste management and specialized recycling factories for scheduled zero-emission EV truck collection.
          </p>
        </div>

        <button
          onClick={fetchDispatches}
          disabled={isLoadingDispatches}
          className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoadingDispatches ? 'animate-spin' : ''}`} />
          <span>Refresh Logistics Feeds</span>
        </button>
      </div>

      {/* Alert toast notification */}
      {alertSuccessToast && (
        <div className="p-4 rounded-2xl bg-blue-500/15 border border-blue-500/40 text-blue-200 text-xs sm:text-sm flex items-center gap-3 animate-in fade-in">
          <Truck className="w-5 h-5 text-blue-400 shrink-0" />
          <span className="font-medium">{alertSuccessToast}</span>
        </div>
      )}

      {/* B2B Logistics KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs">Monitored Bins</span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white">
            {smartBins.length} Nodes
          </p>
          <p className="text-[11px] text-emerald-400 mt-1">100% Online IoT Sensors</p>
        </div>

        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs">Active Dispatches</span>
            <Truck className="w-4 h-4 text-sky-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-sky-400">
            {dispatches.filter((d) => d.status !== 'Processed').length} Trucks
          </p>
          <p className="text-[11px] text-slate-400 mt-1">EV Fleet En Route</p>
        </div>

        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs">Recycled Tonnage</span>
            <Factory className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white">
            {(dispatches.reduce((acc, d) => acc + d.weightEstKg, 0) / 1000).toFixed(2)} Tons
          </p>
          <p className="text-[11px] text-amber-400 mt-1">Diverted to circular factories</p>
        </div>

        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs">Municipal Savings</span>
            <Leaf className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-emerald-400">
            ${(dispatches.reduce((acc, d) => acc + d.weightEstKg, 0) * 0.18).toFixed(0)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Scrap commodity value</p>
        </div>
      </div>

      {/* SECTION 1: SMART BINS LIVE SENSOR GRID */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-400" />
            <span>Community IoT Smart Bin Nodes</span>
          </h2>
          <span className="text-xs text-slate-400">
            Automated pickup triggers at 85% fill
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {smartBins.map((bin) => {
            const isFull = bin.fillPercentage >= 85;
            const isWarning = bin.fillPercentage >= 70 && !isFull;

            return (
              <div
                key={bin.id}
                className={`rounded-3xl border p-5 flex flex-col justify-between shadow-xl transition-all relative overflow-hidden ${
                  isFull
                    ? 'bg-slate-900 border-rose-500/50 shadow-rose-950/20'
                    : isWarning
                    ? 'bg-slate-900 border-amber-500/40'
                    : 'bg-slate-900 border-slate-800'
                }`}
              >
                <div>
                  {/* Status header */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-mono text-slate-400">
                      {bin.id}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                        isFull
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse'
                          : isWarning
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      {bin.status}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white leading-snug">
                    {bin.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                    {bin.location}
                  </p>

                  {/* Fill progress visualization */}
                  <div className="my-4 space-y-2">
                    <div className="flex justify-between items-baseline text-xs">
                      <span className="text-slate-400">Current Volume:</span>
                      <span className="text-base font-black text-white">
                        {bin.fillPercentage}%{' '}
                        <span className="text-xs font-normal text-slate-400">
                          ({bin.currentKg}/{bin.capacityKg} kg)
                        </span>
                      </span>
                    </div>

                    <div className="w-full bg-slate-950 rounded-full h-3.5 p-0.5 border border-slate-800 overflow-hidden">
                      <div
                        className={`bg-gradient-to-r ${getFillColor(
                          bin.fillPercentage
                        )} h-full rounded-full transition-all duration-500`}
                        style={{ width: `${bin.fillPercentage}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>Sensor Battery: {bin.sensorBatteryPercent}%</span>
                    <span>Emptied {bin.lastEmptied}</span>
                  </div>
                </div>

                {/* Actions & Simulation Controls */}
                <div className="mt-5 pt-4 border-t border-slate-800 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    {isFull ? (
                      <button
                        onClick={() => setSelectedBinForAlert(bin)}
                        className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-rose-900/30 cursor-pointer"
                      >
                        <Bell className="w-3.5 h-3.5 animate-bounce" />
                        <span>Dispatch Factory Pickup</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => setSelectedBinForAlert(bin)}
                        className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Bell className="w-3.5 h-3.5" />
                        <span>Manual Alert</span>
                      </button>
                    )}
                  </div>

                  {/* Test simulator button */}
                  <div className="flex items-center justify-between gap-1.5 pt-1 text-[10px]">
                    <span className="text-slate-500">Test Simulator:</span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleSimulateFill(bin.id, 10)}
                        className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                      >
                        +10% Fill
                      </button>
                      <button
                        onClick={() => handleSimulateFill(bin.id, -40)}
                        className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                      >
                        -40% Empty
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: B2B FACTORY DISPATCH LOG & VEHICLE FLEET */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
            <Factory className="w-5 h-5 text-amber-400" />
            <span>B2B Circular Recycling Logistics Fleet Feed</span>
          </h2>
          <span className="text-xs text-slate-400">
            Real-time municipal & factory collection orders
          </span>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-5 py-4">Dispatch ID</th>
                  <th className="px-5 py-4">Bin & Material Type</th>
                  <th className="px-5 py-4">Partner Recycling Factory</th>
                  <th className="px-5 py-4">Fleet Vehicle & ETA</th>
                  <th className="px-5 py-4">Tonnage / CO₂ Offset</th>
                  <th className="px-5 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-300">
                {dispatches.map((disp) => (
                  <tr key={disp.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-5 py-4 font-mono font-bold text-white">
                      {disp.id}
                      <span className="block text-[10px] text-slate-500 font-normal">
                        {new Date(disp.dispatchedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-white">{disp.binType}</p>
                      <p className="text-[11px] text-slate-400">{disp.location}</p>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 text-amber-300 font-medium">
                        <Factory className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                        <span>{disp.assignedFactory}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-white flex items-center gap-1">
                        <Truck className="w-3.5 h-3.5 text-blue-400" />
                        {disp.truckId}
                      </p>
                      <p className="text-[11px] text-emerald-400">
                        {disp.etaMinutes > 0 ? `ETA: ${disp.etaMinutes} mins` : 'Completed pickup'}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-bold text-white">{disp.weightEstKg} kg</span>
                      <span className="block text-[10px] text-emerald-400">
                        -{disp.divertedCo2Kg} kg CO₂e
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                          disp.status === 'En Route'
                            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                            : disp.status === 'Dispatched'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}
                      >
                        {disp.status === 'En Route' && <Truck className="w-3 h-3" />}
                        {disp.status === 'Processed' && <CheckCircle2 className="w-3 h-3" />}
                        {disp.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* DISPATCH ALERT MODAL */}
      {selectedBinForAlert && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl relative">
            <h3 className="text-lg font-black text-white mb-1">
              Dispatch Factory Collection
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Send priority pickup notification to municipal route logistics & recycling factory.
            </p>

            <form onSubmit={handleManualDispatchSubmit} className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Target Bin:</span>
                  <span className="text-white font-bold">{selectedBinForAlert.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Location:</span>
                  <span className="text-white">{selectedBinForAlert.location}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Fill Level:</span>
                  <span className="text-rose-400 font-bold">{selectedBinForAlert.fillPercentage}% Capacity</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Logistics Dispatch Notes (Optional)
                </label>
                <textarea
                  value={alertNotes}
                  onChange={(e) => setAlertNotes(e.target.value)}
                  placeholder="e.g. Bin lid is overflowing with cardboard boxes; high foot traffic plaza..."
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedBinForAlert(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-semibold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isDispatching}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-blue-900/30 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isDispatching ? 'Dispatching...' : 'Confirm Dispatch'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
