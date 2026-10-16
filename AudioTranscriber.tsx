import React, { useState, useRef } from 'react';
import {
  Mic,
  Square,
  Sparkles,
  Upload,
  Copy,
  Check,
  ArrowRight,
  FileText,
  Volume2,
  RefreshCw,
  Search,
  MessageSquare,
} from 'lucide-react';

interface AudioTranscriberProps {
  onTranscriptionResult?: (text: string) => void;
  onSendToScanner?: (text: string) => void;
  onSendToChat?: (text: string) => void;
}

export const AudioTranscriber: React.FC<AudioTranscriberProps> = ({
  onTranscriptionResult,
  onSendToScanner,
  onSendToChat,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcription, setTranscription] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const sampleVoicePrompts = [
    'I have an empty clear glass spaghetti sauce jar with a red twist metal lid.',
    'Corrugated cardboard shipping box with heavy packaging tape on all edges.',
    'Greasy pepperoni pizza box with melted cheese stains and cardboard crumbs.',
    'Two AA alkaline household batteries and one dead lithium cell.',
  ];

  const startRecording = async () => {
    setError(null);
    setTranscription(null);
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: mediaRecorder.mimeType || 'audio/webm',
        });
        stream.getTracks().forEach((t) => t.stop());
        await processAndTranscribeBlob(audioBlob, mediaRecorder.mimeType || 'audio/webm');
      };

      mediaRecorder.start(200);
      setIsRecording(true);
      setRecordingSeconds(0);
      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error('Mic access error:', err);
      setError(`Microphone permission denied or unsupported: ${err.message}`);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerIntervalRef.current);
    }
  };

  const processAndTranscribeBlob = async (blob: Blob, mimeType: string) => {
    setIsTranscribing(true);
    setError(null);

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      try {
        const response = await fetch('/api/transcribe-audio', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            audioBase64: base64,
            mimeType: mimeType || 'audio/webm',
          }),
        });

        const data = await response.json();
        setIsTranscribing(false);
        if (data.success && data.transcription) {
          setTranscription(data.transcription);
          if (onTranscriptionResult) onTranscriptionResult(data.transcription);
        } else {
          setError(data.error || 'No speech detected or transcription failed.');
        }
      } catch (err: any) {
        setIsTranscribing(false);
        setError(`Transcription network error: ${err.message}`);
      }
    };
    reader.readAsDataURL(blob);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processAndTranscribeBlob(file, file.type);
  };

  const handleCopy = () => {
    if (!transcription) return;
    navigator.clipboard.writeText(transcription);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Helper to generate a client-side synthetic audio tone or send sample text
  const handleTestSample = (sampleText: string) => {
    setTranscription(sampleText);
    if (onTranscriptionResult) onTranscriptionResult(sampleText);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-2 pt-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/25 text-cyan-400 text-xs font-semibold">
          <FileText className="w-3.5 h-3.5" />
          <span>Speech-to-Text Powered by gemini-3.5-transcribe</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
          AI Voice Audio Transcription
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto">
          Record your voice using your microphone to transcribe tricky waste descriptions, notes, or upcycling ideas accurately into text with Gemini.
        </p>
      </div>

      {/* Main Recording Card */}
      <div className="rounded-3xl border border-cyan-500/30 bg-gradient-to-br from-slate-900 via-cyan-950/20 to-slate-900 p-6 sm:p-10 shadow-2xl text-center space-y-6">
        {/* Record Button & Wave Animation */}
        <div className="relative w-36 h-36 mx-auto flex items-center justify-center">
          {isRecording && (
            <div className="absolute inset-0 rounded-full bg-rose-500/20 border-2 border-rose-500 animate-ping duration-1000" />
          )}

          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`w-28 h-28 rounded-full flex flex-col items-center justify-center text-white font-bold transition-all shadow-xl active:scale-95 cursor-pointer border-2 ${
              isRecording
                ? 'bg-rose-600 hover:bg-rose-500 border-rose-400 shadow-rose-900/50'
                : 'bg-gradient-to-tr from-cyan-600 to-teal-500 hover:from-cyan-500 hover:to-teal-400 border-cyan-300 shadow-cyan-900/40'
            }`}
          >
            {isRecording ? (
              <>
                <Square className="w-8 h-8 fill-white mb-1" />
                <span className="text-[11px] uppercase tracking-wider font-extrabold">Stop</span>
              </>
            ) : (
              <>
                <Mic className="w-8 h-8 mb-1" />
                <span className="text-[11px] uppercase tracking-wider font-extrabold">Record</span>
              </>
            )}
          </button>
        </div>

        {/* Live Timer or Transcribing status */}
        <div className="space-y-1">
          {isRecording ? (
            <p className="text-lg font-mono font-bold text-rose-400 flex items-center justify-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
              <span>Recording: 00:{recordingSeconds < 10 ? `0${recordingSeconds}` : recordingSeconds}</span>
            </p>
          ) : isTranscribing ? (
            <div className="flex items-center justify-center gap-2 text-cyan-300 text-sm font-semibold">
              <Sparkles className="w-4 h-4 animate-spin-slow" />
              <span>Transcribing audio with gemini-3.5-transcribe...</span>
            </div>
          ) : (
            <p className="text-xs text-slate-400">
              Click &quot;Record&quot; to speak into your microphone, or upload an audio file below.
            </p>
          )}
        </div>

        {/* File Upload Option */}
        <div className="flex justify-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 rounded-xl bg-slate-950 border border-slate-700 hover:border-cyan-500 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-cyan-400" />
            <span>Upload Audio File (WAV, MP3, WebM)</span>
          </button>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs text-center max-w-md mx-auto">
            {error}
          </div>
        )}

        {/* Transcription Output Card */}
        {transcription && (
          <div className="p-6 rounded-2xl bg-slate-950/80 border border-cyan-500/40 text-left space-y-4 animate-in fade-in max-w-2xl mx-auto shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                <span>Verbatim Transcription Output</span>
              </span>
              <button
                onClick={handleCopy}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <p className="text-base sm:text-lg text-white font-medium leading-relaxed font-sans">
              &ldquo;{transcription}&rdquo;
            </p>

            {/* Quick Actions with Transcribed Text */}
            <div className="pt-2 flex flex-wrap gap-2">
              {onSendToScanner && (
                <button
                  onClick={() => onSendToScanner(transcription)}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Scan in AI Waste Sorter</span>
                </button>
              )}
              {onSendToChat && (
                <button
                  onClick={() => onSendToChat(transcription)}
                  className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Ask AI Eco Advisor</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Preset Sample Audio Testing */}
        <div className="pt-4 border-t border-slate-800/80">
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block mb-2.5">
            Quick 1-Click Test Audio Transcriptions:
          </span>
          <div className="flex flex-wrap justify-center gap-2">
            {sampleVoicePrompts.map((sample, idx) => (
              <button
                key={idx}
                onClick={() => handleTestSample(sample)}
                className="px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-cyan-950/40 border border-slate-800 hover:border-cyan-500/40 text-slate-300 hover:text-cyan-200 text-xs font-medium transition-all"
              >
                &ldquo;{sample.slice(0, 36)}...&rdquo;
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
