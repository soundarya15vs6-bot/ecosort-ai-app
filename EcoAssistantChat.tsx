import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  Send,
  Sparkles,
  Bot,
  User,
  Recycle,
  Lightbulb,
  CheckCircle2,
  Mic,
  Square,
} from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export const EcoAssistantChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        "Hello! I'm your EcoSort AI Recycling Advisor. Ask me anything about tricky waste items (e.g., grease-stained pizza boxes, plastic film, electronics, blister packs), fast home upcycling methods, or how our B2B recycling logistics network works!",
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const handleVoiceInput = async () => {
    if (isRecordingVoice) {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        setIsRecordingVoice(false);
        setIsTranscribing(true);

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
            setIsTranscribing(false);
            if (data.success && data.transcription) {
              setInput(data.transcription);
              handleSend(data.transcription);
            }
          } catch (e) {
            setIsTranscribing(false);
          }
        };
        reader.readAsDataURL(blob);
      };

      setIsRecordingVoice(true);
      mediaRecorder.start();
    } catch (err) {
      console.warn('Voice recording error in chat:', err);
      setIsRecordingVoice(false);
    }
  };

  const suggestedQuestions = [
    'Can greasy pizza boxes go in the paper recycling bin?',
    'What do I do with swollen rechargeable lithium batteries?',
    'How do I compost citrus peels without harming soil balance?',
    'How does B2B waste pickup and recycling factory reprocessing work?',
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || isLoading) return;

    const newMessages: Message[] = [...messages, { role: 'user', content: query }];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat-eco-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      });

      const data = await response.json();
      setIsLoading(false);

      if (data.success && data.reply) {
        setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content:
              'For clean dry recyclables, always check local municipality guidelines. Cardboard should be flattened, plastics rinsed, and food contamination kept out of dry paper streams to preserve circular fiber value!',
          },
        ]);
      }
    } catch (err) {
      setIsLoading(false);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            'When in doubt, rinse clean and keep separate. Clean cardboard can be passed on to moving neighbors or recycled in Blue Bins!',
        },
      ]);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-2 pt-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
          <Bot className="w-3.5 h-3.5" />
          <span>Gemini 3.8 Flash Circular AI Advisor</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white">
          AI Waste & Circular Economy Consultant
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
          Have doubts about a particular packaging material, chemical hazard, or composting chemistry? Ask your zero-waste AI assistant below.
        </p>
      </div>

      {/* Chat Container */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl flex flex-col h-[560px] overflow-hidden">
        {/* Messages Stream */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {m.role === 'assistant' && (
                <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`p-4 rounded-2xl text-xs sm:text-sm max-w-[85%] leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-emerald-600 text-white rounded-tr-none'
                    : 'bg-slate-950/70 text-slate-200 border border-slate-800 rounded-tl-none whitespace-pre-line'
                }`}
              >
                {m.content}
              </div>

              {m.role === 'user' && (
                <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-slate-300 shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                <Sparkles className="w-4 h-4 animate-spin-slow" />
              </div>
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>Consulting circular waste database...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Quick Prompts */}
        <div className="px-5 py-2.5 bg-slate-950/50 border-t border-slate-800 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <Lightbulb className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          {suggestedQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(q)}
              className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-[11px] whitespace-nowrap transition-colors"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="p-4 bg-slate-950 border-t border-slate-800 flex gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about any recycling dilemma, material code, or municipal rule..."
            className="flex-1 px-4 py-3 rounded-2xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-emerald-500"
          />
          <button
            type="button"
            onClick={handleVoiceInput}
            disabled={isLoading || isTranscribing}
            className={`px-3.5 py-3 rounded-2xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              isRecordingVoice
                ? 'bg-rose-500/20 border-rose-500 text-rose-300 animate-pulse'
                : isTranscribing
                ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white hover:border-cyan-500/50'
            }`}
            title="Speak your question (gemini-3.5-transcribe)"
          >
            {isRecordingVoice ? (
              <Square className="w-4 h-4 text-rose-400 fill-rose-400" />
            ) : (
              <Mic className="w-4 h-4 text-cyan-400" />
            )}
            <span className="hidden sm:inline">
              {isRecordingVoice ? 'Stop' : isTranscribing ? 'Transcribing...' : 'Voice (3.5)'}
            </span>
          </button>

          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all disabled:opacity-50 cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>Ask</span>
          </button>
        </form>
      </div>
    </div>
  );
};
