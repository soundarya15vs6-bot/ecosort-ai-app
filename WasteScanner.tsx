import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Upload,
  Search,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Share2,
  Wrench,
  Leaf,
  Droplets,
  Coins,
  ShieldCheck,
  Zap,
  CircleDollarSign,
  Store,
  Banknote,
  QrCode,
  MapPin,
  X,
  Mic,
} from 'lucide-react';
import { WasteAnalysisResult } from '../types/recycling';
import { SAMPLE_PRESET_WASTE_ITEMS } from '../data/mockData';

interface WasteScannerProps {
  onDisposedItem: (coinsEarned: number, itemName: string) => void;
  onNavigateToCommunityWithItem: (item: WasteAnalysisResult) => void;
  onNavigateToUpcycleWithItem: (upcycle: WasteAnalysisResult['fastHomeUpcycle']) => void;
}

export const WasteScanner: React.FC<WasteScannerProps> = ({
  onDisposedItem,
  onNavigateToCommunityWithItem,
  onNavigateToUpcycleWithItem,
}) => {
  const [activeMode, setActiveMode] = useState<'camera' | 'upload' | 'text'>('camera');
  const [isScanning, setIsScanning] = useState(false);
  const [scanStepIndex, setScanStepIndex] = useState(0);
  const [result, setResult] = useState<WasteAnalysisResult | null>(null);
  const [claimedReward, setClaimedReward] = useState(false);
  const [inputText, setInputText] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [completedSteps, setCompletedSteps] = useState<Record<number, boolean>>({});
  const [isRvmModalOpen, setIsRvmModalOpen] = useState(false);
  const [rvmDepositProgress, setRvmDepositProgress] = useState<'idle' | 'scanning' | 'crushing' | 'dispensed'>('idle');
  const [rvmReceiptCode, setRvmReceiptCode] = useState<string | null>(null);
  const [isRecordingMic, setIsRecordingMic] = useState(false);
  const [isTranscribingVoice, setIsTranscribingVoice] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const scanSteps = [
    'Capturing visual signatures & surface texture...',
    'Matching material polymers against municipal sorting catalog...',
    'Searching neighborhood exchange requests within 2 miles...',
    'Synthesizing fast 5-10 minute home upcycling project...',
  ];

  // Camera stream setup
  useEffect(() => {
    if (activeMode === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [activeMode]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access not supported by browser.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
    } catch (err: any) {
      console.warn('Camera stream error:', err);
      setCameraError('Unable to access camera. You can upload a photo or pick a sample item below!');
      setActiveMode('upload');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const captureCameraFrame = (): string | null => {
    if (!videoRef.current) return null;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.85);
  };

  const handleScanAction = async (payload: { imageBase64?: string; mimeType?: string; queryText?: string }) => {
    setIsScanning(true);
    setResult(null);
    setClaimedReward(false);
    setCompletedSteps({});
    setScanStepIndex(0);

    // Animate scan progression steps
    const stepInterval = setInterval(() => {
      setScanStepIndex((prev) => (prev < scanSteps.length - 1 ? prev + 1 : prev));
    }, 450);

    try {
      const response = await fetch('/api/identify-waste', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      clearInterval(stepInterval);
      setIsScanning(false);

      if (data.success && data.data) {
        setResult({
          ...data.data,
          scannedImageUrl: payload.imageBase64 || previewImage || undefined,
        });
      } else {
        throw new Error(data.error || 'Failed to analyze');
      }
    } catch (err) {
      clearInterval(stepInterval);
      setIsScanning(false);
      console.error('Scan request failed:', err);
    }
  };

  const compressImage = (dataUrl: string, maxDimension = 1200, quality = 0.85): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        } else {
          resolve(dataUrl);
        }
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  };

  const handleCaptureSnapshot = () => {
    const frame = captureCameraFrame();
    if (frame) {
      setPreviewImage(frame);
      handleScanAction({ imageBase64: frame, mimeType: 'image/jpeg' });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const rawBase64 = reader.result as string;
      const optimizedBase64 = await compressImage(rawBase64);
      setPreviewImage(optimizedBase64);
      handleScanAction({ imageBase64: optimizedBase64, mimeType: 'image/jpeg' });
    };
    reader.readAsDataURL(file);
  };

  const handlePresetClick = (sampleQuery: string) => {
    setPreviewImage(null);
    setInputText(sampleQuery);
    handleScanAction({ queryText: sampleQuery });
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    setPreviewImage(null);
    handleScanAction({ queryText: inputText });
  };

  const toggleStep = (idx: number) => {
    setCompletedSteps((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const handleClaimReward = () => {
    if (!result || claimedReward) return;
    setClaimedReward(true);
    onDisposedItem(result.coinsReward, result.itemName);
  };

  const handleStartRvmDeposit = () => {
    setIsRvmModalOpen(true);
    setRvmDepositProgress('scanning');
    setRvmReceiptCode(null);

    setTimeout(() => {
      setRvmDepositProgress('crushing');
      setTimeout(() => {
        const code = `RVM-DEP-${Math.floor(1000 + Math.random() * 9000)}`;
        setRvmReceiptCode(code);
        setRvmDepositProgress('dispensed');
        const bonusCoins = result?.reverseVending?.instantRevendReward?.bonusCoins || 35;
        onDisposedItem(bonusCoins, `Reverse Vending Deposit: ${result?.itemName || 'Recyclable Container'}`);
      }, 1400);
    }, 1200);
  };

  const handleVoiceTranscribeInput = async () => {
    if (isRecordingMic) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        setIsRecordingMic(false);
        setIsTranscribingVoice(true);

        const blob = new Blob(chunks, { type: mediaRecorder.mimeType || 'audio/webm' });
        const reader = new FileReader();
        reader.onload = async () => {
          const base64 = reader.result as string;
          try {
            const res = await fetch('/api/transcribe-audio', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                audioBase64: base64,
                mimeType: mediaRecorder.mimeType || 'audio/webm',
              }),
            });
            const data = await res.json();
            setIsTranscribingVoice(false);
            if (data.success && data.transcription) {
              setInputText(data.transcription);
              handleScanAction({ queryText: data.transcription });
            }
          } catch (e) {
            setIsTranscribingVoice(false);
          }
        };
        reader.readAsDataURL(blob);
      };

      setIsRecordingMic(true);
      mediaRecorder.start();
      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
        }
      }, 4000);
    } catch (err) {
      console.warn('Voice recording error:', err);
      setIsRecordingMic(false);
    }
  };

  // Bin color themes helper
  const getBinStyle = (binColor: string) => {
    const lower = binColor.toLowerCase();
    if (lower.includes('blue')) {
      return {
        bg: 'from-blue-600 to-sky-700',
        badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
        border: 'border-blue-500/40',
        glow: 'shadow-blue-500/20',
        iconColor: 'text-blue-400',
      };
    }
    if (lower.includes('green') || lower.includes('compost')) {
      return {
        bg: 'from-emerald-600 to-green-700',
        badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
        border: 'border-emerald-500/40',
        glow: 'shadow-emerald-500/20',
        iconColor: 'text-emerald-400',
      };
    }
    if (lower.includes('yellow') || lower.includes('orange')) {
      return {
        bg: 'from-amber-600 to-yellow-600',
        badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
        border: 'border-amber-500/40',
        glow: 'shadow-amber-500/20',
        iconColor: 'text-amber-400',
      };
    }
    if (lower.includes('red') || lower.includes('hazard')) {
      return {
        bg: 'from-rose-600 to-red-700',
        badge: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
        border: 'border-rose-500/40',
        glow: 'shadow-rose-500/20',
        iconColor: 'text-rose-400',
      };
    }
    return {
      bg: 'from-slate-700 to-slate-800',
      badge: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
      border: 'border-slate-500/40',
      glow: 'shadow-slate-500/20',
      iconColor: 'text-slate-400',
    };
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Intro Hero Section */}
      <div className="text-center space-y-3 pt-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 animate-spin-slow" />
          <span>Multimodal Gemini 3.8 Flash Neural Classifier</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
          Smart Waste Identification & Sorting
        </h1>
        <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto">
          Scan any trash item to get instant municipal bin recommendations, quick 5-minute home upcycling ideas, and find out if a neighbor needs it!
        </p>
      </div>

      {/* Mode Selector Tabs */}
      <div className="flex justify-center">
        <div className="inline-flex p-1 bg-slate-900 border border-slate-800 rounded-2xl shadow-inner">
          <button
            onClick={() => setActiveMode('camera')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeMode === 'camera'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>Live Camera</span>
          </button>
          <button
            onClick={() => setActiveMode('upload')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeMode === 'upload'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Upload Photo</span>
          </button>
          <button
            onClick={() => setActiveMode('text')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeMode === 'text'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Search className="w-4 h-4" />
            <span>Describe Trash</span>
          </button>
        </div>
      </div>

      {/* Main Scanner Container */}
      <div className="bg-slate-900/90 rounded-3xl border border-slate-800 p-4 sm:p-6 shadow-2xl relative overflow-hidden">
        {/* Active Capture / Input View */}
        {activeMode === 'camera' && (
          <div className="relative rounded-2xl overflow-hidden bg-black aspect-video max-h-[460px] flex items-center justify-center border border-slate-800 shadow-inner">
            <video
              ref={videoRef}
              playsInline
              muted
              autoPlay
              className="w-full h-full object-cover"
            />
            {/* Viewfinder Target Graphic */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-64 h-64 sm:w-80 sm:h-80 border-2 border-dashed border-emerald-400/60 rounded-3xl relative animate-pulse flex items-center justify-center">
                <div className="absolute -top-3 px-3 py-0.5 bg-slate-900/90 border border-emerald-500/40 rounded-full text-[11px] text-emerald-300 font-medium">
                  Center Trash Item Here
                </div>
                <div className="w-8 h-8 border-t-2 border-l-2 border-emerald-400 absolute top-2 left-2 rounded-tl-lg" />
                <div className="w-8 h-8 border-t-2 border-r-2 border-emerald-400 absolute top-2 right-2 rounded-tr-lg" />
                <div className="w-8 h-8 border-b-2 border-l-2 border-emerald-400 absolute bottom-2 left-2 rounded-bl-lg" />
                <div className="w-8 h-8 border-b-2 border-r-2 border-emerald-400 absolute bottom-2 right-2 rounded-br-lg" />
              </div>
            </div>

            {/* Camera Floating Controls */}
            <div className="absolute bottom-5 inset-x-0 flex items-center justify-center gap-4">
              <button
                onClick={handleCaptureSnapshot}
                disabled={isScanning}
                className="flex items-center gap-2.5 px-6 py-3 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-sm shadow-xl shadow-emerald-500/30 transform active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              >
                <Camera className="w-5 h-5" />
                <span>Snap & Identify</span>
              </button>
            </div>
          </div>
        )}

        {activeMode === 'upload' && (
          <div className="space-y-4">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-700 hover:border-emerald-500/60 rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-colors bg-slate-950/40 flex flex-col items-center justify-center group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4 group-hover:scale-110 transition-transform">
                <Upload className="w-8 h-8" />
              </div>
              <p className="text-white font-semibold text-base mb-1">
                Click to browse or drop a photo of your trash
              </p>
              <p className="text-slate-400 text-xs sm:text-sm">
                Supports packaging, boxes, plastics, compost scraps, containers (PNG, JPG, WEBP)
              </p>
            </div>

            {previewImage && (
              <div className="relative rounded-2xl overflow-hidden max-h-60 bg-black flex items-center justify-center border border-slate-800">
                <img
                  src={previewImage}
                  alt="Preview"
                  className="max-h-60 object-contain rounded-xl"
                />
              </div>
            )}
          </div>
        )}

        {activeMode === 'text' && (
          <form onSubmit={handleTextSubmit} className="space-y-4">
            <div className="relative">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="e.g. Cardboard pizza box with grease, clear glass tomato jar, blister pack pill sheet..."
                className="w-full px-5 py-4 pl-12 rounded-2xl bg-slate-950/70 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
              />
              <Search className="w-5 h-5 text-slate-400 absolute left-4 top-4" />
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleVoiceTranscribeInput}
                disabled={isScanning || isTranscribingVoice}
                className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  isRecordingMic
                    ? 'bg-rose-500/20 border-rose-500 text-rose-300 animate-pulse'
                    : isTranscribingVoice
                    ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                    : 'bg-slate-950 border-slate-700 text-slate-300 hover:text-white hover:border-emerald-500/50'
                }`}
                title="Speak to transcribe waste description using gemini-3.5-transcribe"
              >
                <Mic className={`w-4 h-4 ${isRecordingMic ? 'text-rose-400 animate-bounce' : 'text-cyan-400'}`} />
                <span>
                  {isRecordingMic
                    ? 'Listening... (Speak Now)'
                    : isTranscribingVoice
                    ? 'Transcribing (gemini-3.5)...'
                    : 'Speak Description (gemini-3.5-transcribe)'}
                </span>
              </button>

              <button
                type="submit"
                disabled={isScanning || !inputText.trim()}
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md transition-all disabled:opacity-50 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Analyze with AI</span>
              </button>
            </div>
          </form>
        )}

        {cameraError && (
          <div className="mt-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{cameraError}</span>
          </div>
        )}

        {/* Quick Sample Item Presets */}
        <div className="mt-6 pt-5 border-t border-slate-800/80">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Quick 1-Click Test Samples:
            </span>
            <span className="text-[11px] text-slate-500">Click any item to simulate instant scan</span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {SAMPLE_PRESET_WASTE_ITEMS.map((sample) => (
              <button
                key={sample.id}
                onClick={() => handlePresetClick(sample.sampleQuery)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800/70 hover:bg-emerald-950/50 border border-slate-700 hover:border-emerald-500/40 text-slate-300 hover:text-emerald-200 text-xs font-medium whitespace-nowrap transition-all group shrink-0"
              >
                <span>{sample.label}</span>
                <span className="text-[10px] text-slate-400 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 group-hover:border-emerald-500/30">
                  {sample.category}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Scanning Progress Overlay */}
        {isScanning && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-20">
            <div className="relative w-20 h-20 mb-6">
              <div className="absolute inset-0 rounded-full border-4 border-emerald-500/20 animate-ping" />
              <div className="w-full h-full rounded-full border-4 border-t-emerald-400 border-r-teal-500 border-b-emerald-600 border-l-transparent animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-emerald-400" />
              </div>
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Analyzing Waste Material</h3>
            <p className="text-sm text-emerald-300 font-medium h-6 transition-all duration-300">
              {scanSteps[scanStepIndex]}
            </p>
            <div className="w-64 bg-slate-800 rounded-full h-2 mt-4 overflow-hidden border border-slate-700">
              <div
                className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full transition-all duration-300"
                style={{ width: `${((scanStepIndex + 1) / scanSteps.length) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* AI Analysis Result Display */}
      {result && (
        <div className="space-y-6 animate-in fade-in duration-500">
          {/* Header Card with Bin Color */}
          {(() => {
            const binStyle = getBinStyle(result.binColor);
            return (
              <div
                className={`rounded-3xl border ${binStyle.border} bg-slate-900 p-6 sm:p-8 shadow-2xl relative overflow-hidden`}
              >
                {/* Real-time detection status bar */}
                <div className="flex items-center justify-between gap-2 pb-4 mb-4 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-bold text-emerald-300">
                      Live Neural Vision Detection • Real-Time AI Analysis
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setResult(null);
                      setPreviewImage(null);
                      setInputText('');
                    }}
                    className="text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Scan New Item</span>
                  </button>
                </div>

                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-slate-800">
                  <div className="flex items-start gap-4">
                    {/* User's Uploaded / Captured Image Thumbnail */}
                    {result.scannedImageUrl && (
                      <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-2 border-emerald-500/50 shadow-xl shrink-0 bg-black">
                        <img
                          src={result.scannedImageUrl}
                          alt="Scanned item"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-0 inset-x-0 bg-slate-950/80 backdrop-blur-xs py-0.5 text-center text-[9px] font-bold text-emerald-300">
                          Your Photo
                        </div>
                      </div>
                    )}

                    <div>
                      <div className="flex flex-wrap items-center gap-2.5 mb-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${binStyle.badge}`}>
                          {result.wasteCategory.replace('_', ' ')}
                        </span>
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                          {result.confidenceScore}% AI Confidence
                        </span>
                      </div>
                      <h2 className="text-2xl sm:text-3xl font-black text-white">
                        {result.itemName}
                      </h2>
                      <p className="text-sm text-slate-400 mt-1">
                        Material: <span className="text-slate-300 font-medium">{result.materialComposition}</span>
                      </p>

                      {/* Detected Visual Features Highlight */}
                      {result.detectedVisualFeatures && (
                        <div className="mt-2.5 inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300">
                          <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span>
                            <strong className="text-white">Detected Cues: </strong>
                            {result.detectedVisualFeatures}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bin Assignment Hero Badge */}
                  <div className={`px-6 py-4 rounded-2xl bg-gradient-to-br ${binStyle.bg} text-white shadow-xl ${binStyle.glow} text-center md:text-right shrink-0 border border-white/10 w-full md:w-auto`}>
                    <p className="text-[11px] font-bold uppercase tracking-wider opacity-90">
                      Target Municipal Bin
                    </p>
                    <p className="text-xl sm:text-2xl font-black mt-0.5">
                      {result.binColor}
                    </p>
                  </div>
                </div>

                {/* Preparation Instructions */}
                <div className="mt-6">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Proper Disposal Preparation Steps:
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {result.binInstructions.map((instruction, idx) => (
                      <div
                        key={idx}
                        onClick={() => toggleStep(idx)}
                        className={`p-3.5 rounded-2xl border text-xs sm:text-sm cursor-pointer transition-all flex items-start gap-2.5 ${
                          completedSteps[idx]
                            ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                            : 'bg-slate-950/50 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-md border mt-0.5 flex items-center justify-center shrink-0 ${
                            completedSteps[idx]
                              ? 'bg-emerald-500 border-emerald-400 text-white'
                              : 'border-slate-600'
                          }`}
                        >
                          {completedSteps[idx] && <CheckCircle2 className="w-3.5 h-3.5" />}
                        </div>
                        <span className="leading-snug">{instruction}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Contamination Alert */}
                {result.contaminationWarning && (
                  <div className="mt-5 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-amber-300 uppercase tracking-wide">
                        Anti-Contamination Rule
                      </p>
                      <p className="text-xs sm:text-sm text-amber-200/90 mt-0.5">
                        {result.contaminationWarning}
                      </p>
                    </div>
                  </div>
                )}

                {/* Environmental Impact Counter */}
                <div className="mt-6 pt-6 border-t border-slate-800 grid grid-cols-3 gap-4 text-center">
                  <div className="p-3 rounded-2xl bg-slate-950/40 border border-slate-800">
                    <Leaf className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                    <p className="text-lg sm:text-xl font-black text-white">
                      -{result.environmentalImpact.co2SavedKg} kg
                    </p>
                    <p className="text-[10px] sm:text-xs text-slate-400">CO₂e Avoided</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-950/40 border border-slate-800">
                    <Droplets className="w-4 h-4 text-sky-400 mx-auto mb-1" />
                    <p className="text-lg sm:text-xl font-black text-white">
                      +{result.environmentalImpact.waterSavedLiters} L
                    </p>
                    <p className="text-[10px] sm:text-xs text-slate-400">Water Conserved</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-950/40 border border-slate-800">
                    <Zap className="w-4 h-4 text-amber-400 mx-auto mb-1" />
                    <p className="text-lg sm:text-xl font-black text-white">
                      {result.environmentalImpact.landfillDivertedGrams} g
                    </p>
                    <p className="text-[10px] sm:text-xs text-slate-400">Diverted from Landfill</p>
                  </div>
                </div>

                {/* Action Reward Button */}
                <div className="mt-6 pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-xs text-slate-400 flex items-center gap-2">
                    <Coins className="w-4 h-4 text-amber-400" />
                    <span>
                      Earn <strong className="text-amber-300">+{result.coinsReward} EcoCoins</strong> by verifying correct bin placement
                    </span>
                  </div>
                  <button
                    onClick={handleClaimReward}
                    disabled={claimedReward}
                    className={`w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg ${
                      claimedReward
                        ? 'bg-emerald-600/40 text-emerald-300 border border-emerald-500/40 cursor-default'
                        : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white shadow-emerald-500/25 active:scale-95'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      {claimedReward ? 'EcoCoins Collected (+25)!' : 'I Sorted & Placed In Bin'}
                    </span>
                  </button>
                </div>
              </div>
            );
          })()}

          {/* User Requested: Neighborhood Material Sharing Option */}
          {result.isNeighbourhoodWanted && (
            <div className="rounded-3xl border border-teal-500/30 bg-gradient-to-br from-slate-900 via-teal-950/20 to-slate-900 p-6 sm:p-7 shadow-xl relative overflow-hidden">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-teal-500/15 border border-teal-500/30 text-teal-300 text-xs font-semibold">
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Neighborhood Circular Loop Match!</span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-black text-white">
                    Someone near you needs this material!
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
                    {result.neighbourhoodDemandReason}
                  </p>
                </div>

                <button
                  onClick={() => onNavigateToCommunityWithItem(result)}
                  className="px-5 py-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-teal-900/40 transition-all shrink-0 cursor-pointer"
                >
                  <span>Post to Donation Board</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* User Requested: Fast Home Upcycling Option (Few steps, short time) */}
          {result.fastHomeUpcycle && (
            <div className="rounded-3xl border border-amber-500/30 bg-gradient-to-br from-slate-900 via-amber-950/15 to-slate-900 p-6 sm:p-7 shadow-xl">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold mb-1">
                    <Wrench className="w-3.5 h-3.5" />
                    <span>Fast DIY Home Upcycle • {result.fastHomeUpcycle.timeEstimateMinutes} Mins</span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-black text-white">
                    {result.fastHomeUpcycle.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {result.fastHomeUpcycle.benefit}
                  </p>
                </div>

                <button
                  onClick={() => onNavigateToUpcycleWithItem(result.fastHomeUpcycle)}
                  className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md transition-all shrink-0"
                >
                  <span>View DIY Steps</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* Step Preview Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 pt-2">
                {result.fastHomeUpcycle.steps.map((step, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300">
                    <span className="font-bold text-amber-400 block mb-1">Step {idx + 1}</span>
                    <span className="leading-snug">{step}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* User Requested: Reverse Vending (RVM) & DIY Revending / Micro-Resale */}
          {result.reverseVending && (
            <div className="rounded-3xl border border-emerald-500/40 bg-gradient-to-br from-slate-900 via-emerald-950/25 to-slate-900 p-6 sm:p-7 shadow-xl space-y-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold mb-1">
                    <CircleDollarSign className="w-3.5 h-3.5" />
                    <span>Reverse Vending (RVM) & DIY Revending Available</span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-black text-white">
                    Cash-for-Trash Deposit & DIY Resale Value
                  </h3>
                </div>

                <div className="px-4 py-2 rounded-2xl bg-slate-950 border border-emerald-500/40 text-right">
                  <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">
                    Deposit Return Refund
                  </span>
                  <span className="text-base sm:text-lg font-black text-emerald-400">
                    {result.reverseVending.depositRefundValue}
                  </span>
                </div>
              </div>

              {/* Two Options Grid: Automated RVM Kiosk vs DIY Revending Resale */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. Automated Reverse Vending Machine (RVM) */}
                <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-300 text-[11px] font-bold">
                        Automated RVM Kiosk
                      </span>
                      <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
                        <Coins className="w-3.5 h-3.5" />
                        +{result.reverseVending.instantRevendReward.bonusCoins} Coins
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-white">
                      {result.reverseVending.rvmKioskType}
                    </h4>
                    <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <span>{result.reverseVending.nearestKiosk}</span>
                    </p>
                    <p className="text-[11px] text-slate-300 mt-2">
                      Drop into the automated reverse vending machine to instantly redeem your container deposit voucher receipt.
                    </p>
                  </div>

                  <button
                    onClick={handleStartRvmDeposit}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer active:scale-95 transition-all"
                  >
                    <Banknote className="w-3.5 h-3.5" />
                    <span>Simulate Reverse Vending Deposit (+{result.reverseVending.instantRevendReward.bonusCoins} Coins)</span>
                  </button>
                </div>

                {/* 2. DIY Revending & Local Resale */}
                <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] font-bold">
                        DIY Revending / Resale
                      </span>
                      <span className="text-xs font-extrabold text-emerald-400">
                        Resale Est: {result.reverseVending.diyRevendingOption.estimatedResaleValue}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-white">
                      {result.reverseVending.diyRevendingOption.title}
                    </h4>

                    <div className="mt-2 space-y-1">
                      {result.reverseVending.diyRevendingOption.revendSteps.map((step, idx) => (
                        <p key={idx} className="text-[11px] text-slate-400 flex items-start gap-1.5">
                          <span className="text-emerald-400 font-bold">•</span>
                          <span>{step}</span>
                        </p>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => onNavigateToCommunityWithItem(result)}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer active:scale-95 transition-all"
                  >
                    <Store className="w-3.5 h-3.5" />
                    <span>List on Community DIY Revending Market</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* REVERSE VENDING MACHINE (RVM) INTERACTIVE SIMULATION MODAL */}
      {isRvmModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl relative">
            <button
              onClick={() => setIsRvmModalOpen(false)}
              className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center absolute top-4 right-4"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-300 text-xs font-bold">
                <CircleDollarSign className="w-4 h-4" />
                <span>Smart Reverse Vending Machine (RVM-3000)</span>
              </div>

              {/* RVM Chamber Visual */}
              <div className="w-48 h-48 mx-auto my-3 rounded-full bg-slate-950 border-4 border-slate-800 flex items-center justify-center relative overflow-hidden shadow-inner">
                {/* Feeder aperture */}
                <div className="w-32 h-32 rounded-full border-2 border-dashed border-emerald-500/40 flex items-center justify-center relative">
                  {rvmDepositProgress === 'scanning' && (
                    <div className="flex flex-col items-center gap-2 animate-pulse">
                      <Sparkles className="w-10 h-10 text-cyan-400 animate-spin-slow" />
                      <span className="text-[10px] text-cyan-300 font-bold">
                        Optical Barcode Scan...
                      </span>
                    </div>
                  )}

                  {rvmDepositProgress === 'crushing' && (
                    <div className="flex flex-col items-center gap-2 animate-bounce">
                      <RefreshCw className="w-10 h-10 text-amber-400 animate-spin" />
                      <span className="text-[10px] text-amber-300 font-bold">
                        Compacting Material...
                      </span>
                    </div>
                  )}

                  {rvmDepositProgress === 'dispensed' && (
                    <div className="flex flex-col items-center gap-1 animate-in zoom-in">
                      <CheckCircle2 className="w-12 h-12 text-emerald-400" />
                      <span className="text-[10px] text-emerald-300 font-bold">
                        Voucher Dispensed!
                      </span>
                    </div>
                  )}
                </div>

                {/* Laser scan line effect */}
                {(rvmDepositProgress === 'scanning' || rvmDepositProgress === 'crushing') && (
                  <div className="absolute inset-x-0 h-1 bg-cyan-400 shadow-[0_0_12px_#22d3ee] animate-pulse top-1/2" />
                )}
              </div>

              {/* Live Status Messaging */}
              {rvmDepositProgress !== 'dispensed' ? (
                <div className="space-y-1">
                  <h4 className="text-base font-bold text-white">
                    {rvmDepositProgress === 'scanning'
                      ? 'Verifying Container Weight & Material...'
                      : 'Sorting & Compacting Container...'}
                  </h4>
                  <p className="text-xs text-slate-400">
                    Deposit slot: {result?.itemName || 'Household Waste'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-lg font-black text-white">
                      Deposit Return Successful!
                    </h4>
                    <p className="text-xs text-emerald-300 font-medium mt-0.5">
                      Earned {result?.reverseVending?.instantRevendReward.cashRefund || '$0.10'} Cash Voucher +{result?.reverseVending?.instantRevendReward.bonusCoins || 35} EcoCoins!
                    </p>
                  </div>

                  {/* Virtual Receipt */}
                  <div className="p-4 rounded-2xl bg-white text-slate-950 text-left space-y-2 shadow-lg font-mono">
                    <div className="flex justify-between items-center text-xs border-b border-slate-300 pb-1.5">
                      <span className="font-bold text-slate-900">RVM MUNICIPAL VOUCHER</span>
                      <span className="text-[10px] text-slate-500">REFUND RECEIPT</span>
                    </div>
                    <div className="text-[11px] space-y-0.5 text-slate-700">
                      <p>Item: {result?.itemName}</p>
                      <p>Kiosk: {result?.reverseVending?.nearestKiosk}</p>
                      <p className="font-bold text-emerald-700 text-sm">
                        Value: {result?.reverseVending?.instantRevendReward.cashRefund || '$0.10'}
                      </p>
                    </div>
                    <div className="pt-2 text-center border-t border-slate-200">
                      <p className="text-[10px] uppercase font-bold text-slate-400">Voucher Code</p>
                      <p className="text-sm font-black tracking-widest text-slate-900">
                        {rvmReceiptCode}
                      </p>
                      <p className="text-[9px] text-slate-500 mt-0.5">
                        Scan at supermarket register or apply to utility bill
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsRvmModalOpen(false)}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                  >
                    Done & Collect EcoCoins
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
