import React, { useState } from 'react';
import {
  Wrench,
  Clock,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Filter,
  Play,
  Scissors,
  Layers,
  Coins,
  X,
  RotateCcw,
  PlusCircle,
} from 'lucide-react';
import { CURATED_UPCYCLE_PROJECTS } from '../data/mockData';
import { FastHomeUpcycle } from '../types/recycling';

interface HomeUpcyclingProps {
  onEarnCoins: (amount: number, reason: string) => void;
  initialSelectedProject?: FastHomeUpcycle | null;
}

export const HomeUpcycling: React.FC<HomeUpcyclingProps> = ({
  onEarnCoins,
  initialSelectedProject,
}) => {
  const [selectedTimeFilter, setSelectedTimeFilter] = useState<'all' | 'under5' | '5to10' | '10to15'>('all');
  const [selectedMaterialFilter, setSelectedMaterialFilter] = useState<string>('all');
  const [activeProject, setActiveProject] = useState<any | null>(initialSelectedProject || null);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [completedProjects, setCompletedProjects] = useState<Record<string, boolean>>({});

  // AI Custom Generator state
  const [customItemQuery, setCustomItemQuery] = useState('');
  const [customTimeLimit, setCustomTimeLimit] = useState(10);
  const [isGeneratingCustom, setIsGeneratingCustom] = useState(false);
  const [customGeneratedProject, setCustomGeneratedProject] = useState<any | null>(null);

  const filteredProjects = CURATED_UPCYCLE_PROJECTS.filter((p) => {
    if (selectedTimeFilter === 'under5' && p.timeEstimateMinutes > 5) return false;
    if (selectedTimeFilter === '5to10' && (p.timeEstimateMinutes < 5 || p.timeEstimateMinutes > 10)) return false;
    if (selectedTimeFilter === '10to15' && p.timeEstimateMinutes < 10) return false;
    if (selectedMaterialFilter !== 'all' && !p.material.toLowerCase().includes(selectedMaterialFilter.toLowerCase())) return false;
    return true;
  });

  const handleStartProject = (project: any) => {
    setActiveProject(project);
    setActiveStepIndex(0);
  };

  const handleFinishProject = () => {
    if (!activeProject) return;
    const projId = activeProject.id || activeProject.title;
    setCompletedProjects((prev) => ({ ...prev, [projId]: true }));
    onEarnCoins(40, `Upcycled ${activeProject.title}`);
  };

  const handleGenerateCustomAI = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customItemQuery.trim()) return;

    setIsGeneratingCustom(true);
    setCustomGeneratedProject(null);

    try {
      const response = await fetch('/api/generate-upcycle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemDescription: customItemQuery,
          timeLimitMinutes: customTimeLimit,
        }),
      });

      const data = await response.json();
      setIsGeneratingCustom(false);
      if (data.success && data.data) {
        setCustomGeneratedProject(data.data);
      }
    } catch (err) {
      setIsGeneratingCustom(false);
      console.error('Custom upcycle generation failed:', err);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Hero Header */}
      <div className="text-center space-y-3 pt-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold">
          <Wrench className="w-3.5 h-3.5" />
          <span>Home DIY Circular Studio</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
          Fast Home Upcycling in 3 to 15 Minutes
        </h1>
        <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto">
          Don&apos;t throw it out just yet! Transform ordinary trash like cardboard boxes, glass jars, and plastic containers into functional home items in just a few quick steps.
        </p>
      </div>

      {/* AI Instant Custom Upcycle Generator Card */}
      <div className="rounded-3xl border border-emerald-500/30 bg-gradient-to-r from-slate-900 via-emerald-950/20 to-slate-900 p-6 sm:p-7 shadow-xl">
        <div className="flex items-center gap-2.5 mb-2">
          <Sparkles className="w-5 h-5 text-emerald-400" />
          <h2 className="text-lg sm:text-xl font-bold text-white">
            Custom AI Upcycle Idea Generator
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-slate-300 mb-4">
          Have an odd piece of trash at home? Enter it below and Gemini will generate a step-by-step DIY transformation using things in your house.
        </p>

        <form onSubmit={handleGenerateCustomAI} className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-7">
            <input
              type="text"
              value={customItemQuery}
              onChange={(e) => setCustomItemQuery(e.target.value)}
              placeholder="e.g. Cardboard shoebox, wine corks, aluminium foil tray, tin can..."
              className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div className="sm:col-span-3">
            <select
              value={customTimeLimit}
              onChange={(e) => setCustomTimeLimit(Number(e.target.value))}
              aria-label="Target Time Limit"
              className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-slate-700 text-white text-sm focus:outline-none focus:border-emerald-500"
            >
              <option value={5}>⚡ Under 5 Mins (Fast)</option>
              <option value={10}>⏱️ 10 Minutes (Standard)</option>
              <option value={15}>🛠️ 15 Minutes (Craft)</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={isGeneratingCustom || !customItemQuery.trim()}
              className="w-full h-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isGeneratingCustom ? 'Creating...' : 'Generate'}</span>
            </button>
          </div>
        </form>

        {/* Custom Generated Result Box */}
        {customGeneratedProject && (
          <div className="mt-5 p-5 rounded-2xl bg-slate-950/70 border border-emerald-500/40 animate-in fade-in">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                  Custom AI Project • {customGeneratedProject.timeEstimateMinutes} mins • {customGeneratedProject.difficulty}
                </span>
                <h3 className="text-lg font-black text-white mt-0.5">
                  {customGeneratedProject.title}
                </h3>
              </div>
              <button
                onClick={() => handleStartProject(customGeneratedProject)}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Follow Steps & Earn +40 Coins</span>
              </button>
            </div>

            <div className="text-xs text-slate-400 mb-2">
              Tools needed: <span className="text-slate-200 font-medium">{customGeneratedProject.toolsNeeded?.join(', ')}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 pt-2">
              {customGeneratedProject.steps?.map((st: string, idx: number) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
                  <span className="text-emerald-400 font-bold block mb-1">Step {idx + 1}</span>
                  <span>{st}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        {/* Time Filters */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          <Clock className="w-4 h-4 text-slate-400 shrink-0" />
          <button
            onClick={() => setSelectedTimeFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedTimeFilter === 'all'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            All Speeds
          </button>
          <button
            onClick={() => setSelectedTimeFilter('under5')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedTimeFilter === 'under5'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            ⚡ Under 5 Mins
          </button>
          <button
            onClick={() => setSelectedTimeFilter('5to10')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedTimeFilter === '5to10'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            ⏱️ 5 - 10 Mins
          </button>
          <button
            onClick={() => setSelectedTimeFilter('10to15')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedTimeFilter === '10to15'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            🛠️ 10 - 15 Mins
          </button>
        </div>

        {/* Material Filters */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          {['all', 'Cardboard', 'Plastic', 'Glass', 'Coffee'].map((mat) => (
            <button
              key={mat}
              onClick={() => setSelectedMaterialFilter(mat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                selectedMaterialFilter === mat
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {mat === 'all' ? 'All Materials' : mat}
            </button>
          ))}
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map((project) => {
          const isDone = completedProjects[project.id];
          return (
            <div
              key={project.id}
              className="rounded-3xl border border-slate-800 bg-slate-900/90 hover:border-amber-500/40 transition-all flex flex-col justify-between overflow-hidden group shadow-lg"
            >
              <div className="relative h-44 overflow-hidden bg-slate-950">
                <img
                  src={project.image}
                  alt={project.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                <div className="absolute top-3 left-3 flex gap-2">
                  <span className="px-2.5 py-1 rounded-full bg-slate-900/90 backdrop-blur-md border border-slate-700 text-white text-[11px] font-bold flex items-center gap-1">
                    <Clock className="w-3 h-3 text-amber-400" />
                    {project.timeEstimateMinutes} mins
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/80 backdrop-blur-md text-white text-[11px] font-bold">
                    {project.material}
                  </span>
                </div>
                {isDone && (
                  <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-emerald-600 text-white text-[11px] font-bold flex items-center gap-1 shadow-md">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Completed
                  </div>
                )}
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-base font-bold text-white group-hover:text-amber-300 transition-colors leading-snug">
                    {project.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-2 line-clamp-2">
                    {project.benefit}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {project.toolsNeeded.slice(0, 3).map((tool, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700/60"
                      >
                        {tool}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-1 text-xs font-semibold text-amber-400">
                    <Coins className="w-3.5 h-3.5" />
                    <span>+40 Coins</span>
                  </div>

                  <button
                    onClick={() => handleStartProject(project)}
                    className="px-4 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <span>Start DIY</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Active Project Step-by-Step Guided Modal */}
      {activeProject && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] font-bold">
                    ⏱️ {activeProject.timeEstimateMinutes} Mins • {activeProject.difficulty || 'Easy'}
                  </span>
                  <span className="text-xs text-slate-400">
                    Step {activeStepIndex + 1} of {activeProject.steps.length}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white">
                  {activeProject.title}
                </h2>
              </div>
              <button
                onClick={() => setActiveProject(null)}
                className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tools Required */}
            <div className="mt-4 p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-3">
              <Scissors className="w-4 h-4 text-amber-400 shrink-0" />
              <div className="text-xs text-slate-300">
                <strong className="text-white">Things Needed: </strong>
                {activeProject.toolsNeeded?.join(' • ')}
              </div>
            </div>

            {/* Current Step Big Card */}
            <div className="my-6 p-6 rounded-2xl bg-gradient-to-br from-slate-950 to-slate-900 border border-amber-500/30 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 font-black text-xl flex items-center justify-center mx-auto border border-amber-500/40">
                {activeStepIndex + 1}
              </div>
              <p className="text-base sm:text-lg text-white font-medium max-w-lg mx-auto leading-relaxed">
                {activeProject.steps[activeStepIndex]}
              </p>
            </div>

            {/* Progress dots */}
            <div className="flex justify-center gap-2 mb-6">
              {activeProject.steps.map((_: any, idx: number) => (
                <div
                  key={idx}
                  onClick={() => setActiveStepIndex(idx)}
                  className={`h-2.5 rounded-full cursor-pointer transition-all ${
                    idx === activeStepIndex
                      ? 'w-8 bg-amber-400'
                      : idx < activeStepIndex
                      ? 'w-2.5 bg-emerald-500'
                      : 'w-2.5 bg-slate-700'
                  }`}
                />
              ))}
            </div>

            {/* Navigation buttons */}
            <div className="flex items-center justify-between gap-4 pt-2 border-t border-slate-800">
              <button
                onClick={() => setActiveStepIndex((prev) => Math.max(0, prev - 1))}
                disabled={activeStepIndex === 0}
                className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold disabled:opacity-40"
              >
                Previous Step
              </button>

              {activeStepIndex < activeProject.steps.length - 1 ? (
                <button
                  onClick={() => setActiveStepIndex((prev) => prev + 1)}
                  className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md"
                >
                  <span>Next Step</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => {
                    handleFinishProject();
                    setActiveProject(null);
                  }}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/25 active:scale-95 transition-all"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>I Finished Upcycling! (+40 EcoCoins)</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
