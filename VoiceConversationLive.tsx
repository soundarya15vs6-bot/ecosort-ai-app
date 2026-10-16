import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Radio,
  Sparkles,
  PhoneCall,
  PhoneOff,
  Bot,
  AlertCircle,
  MessageSquare,
  HelpCircle,
} from 'lucide-react';

interface VoiceConversationLiveProps {
  onTranscriptReceived?: (text: string) => void;
}

export const VoiceConversationLive: React.FC<VoiceConversationLiveProps> = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [statusText, setStatusText] = useState('Ready to connect to Gemini 3.8 Live');
  const [liveCaptions, setLiveCaptions] = useState<string[]>([]);
  const [audioLevel, setAudioLevel] = useState(0);

  const wsRef = useRef<WebSocket | null>(null);
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const audioQueueRef = useRef<Float32Array[]>([]);
  const isPlayingRef = useRef(false);
  const nextPlayTimeRef = useRef(0);

  // Suggested conversational prompts
  const suggestedVoiceTopics = [
    'How do I sort pizza boxes with grease?',
    'Can I reverse vend clean plastic bottles for cash?',
    'Give me a 5-minute cardboard DIY home craft',
    'How do municipal B2B trucks track smart bins?',
  ];

  useEffect(() => {
    return () => {
      disconnectLive();
    };
  }, []);

  const pcmToBase64 = (float32Array: Float32Array): string => {
    const int16Array = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    const bytes = new Uint8Array(int16Array.buffer);
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  const playPcmChunk = (base64Data: string) => {
    if (!outputAudioCtxRef.current) return;
    const ctx = outputAudioCtxRef.current;
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    try {
      const binaryString = atob(base64Data);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const int16Data = new Int16Array(bytes.buffer);
      const float32Data = new Float32Array(int16Data.length);
      for (let i = 0; i < int16Data.length; i++) {
        float32Data[i] = int16Data[i] / 32768.0;
      }

      // Schedule seamless audio playback at 24kHz
      const audioBuffer = ctx.createBuffer(1, float32Data.length, 24000);
      audioBuffer.getChannelData(0).set(float32Data);

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);

      const currentTime = ctx.currentTime;
      if (nextPlayTimeRef.current < currentTime) {
        nextPlayTimeRef.current = currentTime;
      }

      source.start(nextPlayTimeRef.current);
      nextPlayTimeRef.current += audioBuffer.duration;
    } catch (e) {
      console.warn('Error playing PCM audio chunk:', e);
    }
  };

  const connectLive = async () => {
    setIsConnecting(true);
    setStatusText('Connecting to Gemini 3.8 Live API...');

    try {
      // 1. Get microphone stream (16kHz)
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      mediaStreamRef.current = stream;

      // 2. Setup AudioContexts
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 16000,
      });
      inputAudioCtxRef.current = inputCtx;

      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 24000,
      });
      outputAudioCtxRef.current = outputCtx;
      nextPlayTimeRef.current = outputCtx.currentTime;

      // 3. Connect WebSocket to /live
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/live`;
      console.log('Connecting to WebSocket Live URL:', wsUrl);

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setIsConnecting(false);
        setStatusText('Connected to Gemini 3.8 Live • Listening & Speaking');
        setLiveCaptions((prev) => [
          ...prev,
          'EcoSort Voice Assistant online. Say "Hello" or ask any recycling question!',
        ]);

        // Start streaming mic audio
        const source = inputCtx.createMediaStreamSource(stream);
        const processor = inputCtx.createScriptProcessor(4096, 1, 1);
        scriptProcessorRef.current = processor;

        source.connect(processor);
        processor.connect(inputCtx.destination);

        processor.onaudioprocess = (e) => {
          if (isMuted) return;
          const inputData = e.inputBuffer.getChannelData(0);

          // Calculate visual audio level
          let sum = 0;
          for (let i = 0; i < inputData.length; i++) {
            sum += inputData[i] * inputData[i];
          }
          const rms = Math.sqrt(sum / inputData.length);
          setAudioLevel(Math.min(100, Math.round(rms * 400)));

          if (ws.readyState === WebSocket.OPEN) {
            const base64Audio = pcmToBase64(inputData);
            ws.send(JSON.stringify({ audio: base64Audio }));
          }
        };
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'audio' && msg.audio) {
            playPcmChunk(msg.audio);
          }
          if (msg.type === 'text' && msg.text) {
            setLiveCaptions((prev) => [...prev.slice(-4), msg.text]);
          }
          if (msg.type === 'interrupted') {
            // Stop playback on interruption
            if (outputAudioCtxRef.current) {
              nextPlayTimeRef.current = outputAudioCtxRef.current.currentTime;
            }
          }
        } catch (e) {
          console.warn('Error reading WS message:', e);
        }
      };

      ws.onerror = (e) => {
        console.error('WebSocket error:', e);
        setStatusText('Connection error with Live API WebSocket.');
        setIsConnecting(false);
      };

      ws.onclose = () => {
        setIsConnected(false);
        setIsConnecting(false);
        setStatusText('Disconnected from Gemini 3.8 Live.');
      };
    } catch (err: any) {
      console.error('Live connect error:', err);
      setIsConnecting(false);
      setStatusText(`Microphone or Live API error: ${err.message}`);
    }
  };

  const disconnectLive = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect();
      scriptProcessorRef.current = null;
    }
    if (inputAudioCtxRef.current) {
      inputAudioCtxRef.current.close().catch(() => {});
      inputAudioCtxRef.current = null;
    }
    if (outputAudioCtxRef.current) {
      outputAudioCtxRef.current.close().catch(() => {});
      outputAudioCtxRef.current = null;
    }
    setIsConnected(false);
    setIsConnecting(false);
    setAudioLevel(0);
    setStatusText('Live voice session ended.');
  };

  const sendTextPromptOverLive = (text: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ text }));
      setLiveCaptions((prev) => [...prev.slice(-4), `You: "${text}"`]);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-2 pt-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/25 text-violet-400 text-xs font-semibold">
          <Radio className="w-3.5 h-3.5 animate-pulse text-violet-400" />
          <span>Real-Time Bi-Directional Audio • Gemini 3.8 Live</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
          Real-Time Voice Recycling Assistant
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto">
          Talk directly to EcoSort AI with sub-second latency! Ask which bin to use, how to upcycle trash into home crafts in 5 minutes, or how Reverse Vending Machine (RVM) deposit refunds work.
        </p>
      </div>

      {/* Main Interactive Live Card */}
      <div className="rounded-3xl border border-violet-500/30 bg-gradient-to-br from-slate-900 via-violet-950/20 to-slate-900 p-6 sm:p-10 shadow-2xl text-center relative overflow-hidden">
        {/* Pulsating Audio Sphere / Visualizer */}
        <div className="relative w-44 h-44 sm:w-52 sm:h-52 mx-auto my-6 flex items-center justify-center">
          {isConnected && (
            <>
              {/* Outer wave rings */}
              <div
                className="absolute inset-0 rounded-full bg-violet-500/10 border border-violet-500/30 animate-ping duration-1000"
                style={{ transform: `scale(${1 + audioLevel / 100})` }}
              />
              <div
                className="absolute inset-4 rounded-full bg-cyan-500/15 border border-cyan-500/40 animate-pulse duration-700"
                style={{ transform: `scale(${1 + audioLevel / 150})` }}
              />
            </>
          )}

          <div
            className={`w-32 h-32 sm:w-36 sm:h-36 rounded-full flex flex-col items-center justify-center shadow-2xl transition-all duration-300 border-2 ${
              isConnected
                ? 'bg-gradient-to-tr from-violet-600 via-indigo-600 to-cyan-500 border-cyan-300 shadow-violet-500/40 scale-105'
                : 'bg-slate-950 border-slate-800'
            }`}
          >
            {isConnected ? (
              <Radio className="w-12 h-12 text-white animate-pulse" />
            ) : (
              <Mic className="w-12 h-12 text-slate-500" />
            )}
            <span className="text-[10px] font-bold text-white/90 mt-1 uppercase tracking-wider">
              {isConnected ? 'Live Audio' : 'Standby'}
            </span>
          </div>
        </div>

        {/* Status indicator */}
        <div className="space-y-1 mb-6">
          <p className="text-sm sm:text-base font-bold text-white flex items-center justify-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isConnected ? 'bg-emerald-400 animate-ping' : 'bg-slate-600'
              }`}
            />
            <span>{statusText}</span>
          </p>
          <p className="text-xs text-slate-400">
            {isConnected
              ? 'Speak naturally into your microphone. Gemini responds verbally in real-time!'
              : 'Click "Start Voice Conversation" to begin streaming.'}
          </p>
        </div>

        {/* Live Captions Feed */}
        {liveCaptions.length > 0 && (
          <div className="max-w-xl mx-auto my-4 p-4 rounded-2xl bg-slate-950/70 border border-slate-800 text-xs text-slate-300 space-y-1.5 text-left font-sans">
            <span className="text-[10px] uppercase font-bold text-violet-400 block tracking-wider">
              Live Transcript & Captions:
            </span>
            {liveCaptions.map((cap, idx) => (
              <p key={idx} className="leading-relaxed">
                {cap}
              </p>
            ))}
          </div>
        )}

        {/* Controls */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          {!isConnected ? (
            <button
              onClick={connectLive}
              disabled={isConnecting}
              className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white font-bold text-sm shadow-xl shadow-violet-900/40 flex items-center gap-2 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              <PhoneCall className="w-4 h-4" />
              <span>{isConnecting ? 'Connecting Live...' : 'Start Voice Conversation'}</span>
            </button>
          ) : (
            <>
              <button
                onClick={() => setIsMuted((prev) => !prev)}
                className={`px-5 py-3 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                  isMuted
                    ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                }`}
              >
                {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                <span>{isMuted ? 'Unmute Mic' : 'Mute Mic'}</span>
              </button>

              <button
                onClick={disconnectLive}
                className="px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-rose-900/40 cursor-pointer active:scale-95 transition-all"
              >
                <PhoneOff className="w-4 h-4" />
                <span>End Voice Call</span>
              </button>
            </>
          )}
        </div>

        {/* Quick Conversation Starters */}
        <div className="mt-8 pt-6 border-t border-slate-800/80">
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block mb-3">
            Suggested Things to Ask Verbally:
          </span>
          <div className="flex flex-wrap justify-center gap-2">
            {suggestedVoiceTopics.map((topic, idx) => (
              <button
                key={idx}
                onClick={() => {
                  if (isConnected) {
                    sendTextPromptOverLive(topic);
                  } else {
                    connectLive();
                  }
                }}
                className="px-3.5 py-1.5 rounded-xl bg-slate-950 hover:bg-violet-950/40 border border-slate-800 hover:border-violet-500/40 text-slate-300 hover:text-violet-200 text-xs font-medium transition-all"
              >
                &ldquo;{topic}&rdquo;
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
