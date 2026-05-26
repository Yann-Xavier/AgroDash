import React, { useState, useEffect } from "react";
import { Sparkles, Send, Brain, RefreshCw, MessageSquare } from "lucide-react";

interface AiConsultantProps {
  triggerUpdateCount: number;
}

export default function AiConsultant({ triggerUpdateCount }: AiConsultantProps) {
  const [analysis, setAnalysis] = useState("");
  const [loading, setLoading] = useState(false);
  const [userQuestion, setUserQuestion] = useState("");
  const [chatHistory, setChatHistory] = useState<Array<{ sender: "user" | "ai"; text: string }>>([]);
  const [customLoading, setCustomLoading] = useState(false);

  // Fetch initial strategic advice based on financial/stock state
  const fetchAdvice = async (question?: string) => {
    if (question) {
      setCustomLoading(true);
    } else {
      setLoading(true);
    }

    try {
      const response = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(question ? { customQuestion: question } : {}),
      });

      const data = await response.json();
      if (data.analysis) {
        if (question) {
          setChatHistory(prev => [
            ...prev,
            { sender: "ai", text: data.analysis }
          ]);
        } else {
          setAnalysis(data.analysis);
        }
      }
    } catch (err) {
      console.error("Erro consultoria IA:", err);
      if (!question) {
        setAnalysis("Erro ao se conectar com a Consultoria Inteligente. Verifique se o servidor está ativo.");
      } else {
        setChatHistory(prev => [
          ...prev,
          { sender: "ai", text: "Desculpe, ocorreu um erro ao se comunicar com o analista agrícola." }
        ]);
      }
    } finally {
      setLoading(false);
      setCustomLoading(false);
    }
  };

  useEffect(() => {
    fetchAdvice();
  }, [triggerUpdateCount]);

  const handleSendQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userQuestion.trim() || customLoading) return;

    const q = userQuestion;
    setUserQuestion("");
    setChatHistory(prev => [...prev, { sender: "user", text: q }]);

    await fetchAdvice(q);
  };

  // Safe and clean simple markdown parser for bold, lists and headers
  const renderMarkdownText = (text: string) => {
    if (!text) return null;
    return text.split("\n").map((line, idx) => {
      let trimmed = line.trim();
      
      // Headers ### or **
      if (trimmed.startsWith("###")) {
        return (
          <h4 key={idx} className="text-sm font-bold text-stone-900 mt-4 mb-2 font-display">
            {trimmed.replace("###", "").trim()}
          </h4>
        );
      }
      if (trimmed.startsWith("##")) {
        return (
          <h3 key={idx} className="text-base font-bold text-emerald-950 mt-5 mb-2.5 font-display border-b border-stone-200/50 pb-1">
            {trimmed.replace("##", "").trim()}
          </h3>
        );
      }
      if (trimmed.startsWith("#")) {
        return (
          <h2 key={idx} className="text-lg font-bold text-emerald-900 mt-6 mb-3 font-display">
            {trimmed.replace("#", "").trim()}
          </h2>
        );
      }

      // Bullets * or -
      if (trimmed.startsWith("*") || trimmed.startsWith("-")) {
        const content = trimmed.substring(1).trim();
        return (
          <li key={idx} className="ml-4 list-disc text-xs text-stone-600 my-1 leading-relaxed">
            {parseBoldPhrases(content)}
          </li>
        );
      }

      // Regular paragraph wrapping
      if (trimmed === "") return <div key={idx} className="h-2" />;
      return (
        <p key={idx} className="text-xs text-stone-600 leading-relaxed my-1.5">
          {parseBoldPhrases(trimmed)}
        </p>
      );
    });
  };

  const parseBoldPhrases = (text: string) => {
    // Splits text by general markdown double asterisks ** to stylize bold segments
    const parts = text.split(/\*\*(.*?)\*\*/g);
    return parts.map((part, i) => {
      if (i % 2 === 1) {
        return <strong key={i} className="font-semibold text-stone-800">{part}</strong>;
      }
      return part;
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
      {/* LEFT: Strategic Advisory Panel based on active data state */}
      <div id="ai-strategic-advisor" className="md:col-span-7 lg:col-span-7 bg-white border border-stone-200/80 rounded-2xl p-4 sm:p-6 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-stone-100">
            <div className="flex items-center gap-2">
              <Sparkles className="text-emerald-700 animate-pulse" size={18} />
              <h3 className="text-sm font-bold text-stone-800 font-display">
                Diagnóstico Gerencial & Advisory
              </h3>
            </div>
            
            <button
              onClick={() => fetchAdvice()}
              disabled={loading}
              className="text-stone-400 hover:text-stone-700 disabled:opacity-50 transition-colors"
              title="Atualizar diagnóstico"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            </button>
          </div>

          <div className="mt-4 overflow-y-auto max-h-[420px] pr-1">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <Brain className="text-stone-300 animate-bounce" size={40} />
                <span className="text-xs text-stone-400 font-mono">Processando analítico de safras...</span>
              </div>
            ) : (
              <div className="space-y-1">
                {renderMarkdownText(analysis)}
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-stone-100 text-[10px] text-stone-400 leading-relaxed">
          💡 A consultoria de inteligência analisa as categorias e sinaliza preços baixos históricos para reposição preventiva de fungicidas e adubos.
        </div>
      </div>

      {/* RIGHT: Active Question Chatbot */}
      <div id="ai-chatbox" className="md:col-span-5 lg:col-span-5 bg-stone-900 border border-stone-800 rounded-2xl p-4 sm:p-6 shadow-md flex flex-col justify-between text-white">
        <div>
          <div className="flex items-center gap-2 pb-4 border-b border-stone-800">
            <MessageSquare className="text-emerald-400" size={18} />
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-300 font-display">
              Perguntas ao Consultor Agrícola
            </h3>
          </div>

          {/* Messages block */}
          <div className="mt-4 space-y-4 overflow-y-auto h-[320px] pr-1.5 scrollbar-thin">
            <div className="bg-stone-800 p-3 rounded-xl text-xs text-stone-300 leading-relaxed">
              Olá! Pergunte-me qualquer questão técnica sobre o manejo das suas culturas, decisões de compra de insumos, ou reestruturação de suas margens financeiras.
            </div>

            {chatHistory.map((msg, index) => (
              <div
                key={index}
                className={`p-3 rounded-xl text-xs leading-relaxed max-w-[90%] ${
                  msg.sender === "user"
                    ? "bg-emerald-800 text-white ml-auto"
                    : "bg-stone-800 text-stone-300"
                }`}
              >
                {msg.sender === "user" ? (
                  msg.text
                ) : (
                  <div className="space-y-1">
                    {renderMarkdownText(msg.text)}
                  </div>
                )}
              </div>
            ))}

            {/* Submitting Loading placeholder */}
            {customLoading && (
              <div className="bg-stone-800 p-3 rounded-xl text-xs text-emerald-400 font-mono animate-pulse">
                Consultor pensando técnico rural...
              </div>
            )}
          </div>
        </div>

        {/* Form submit input */}
        <form onSubmit={handleSendQuestion} className="mt-5 pt-4 border-t border-stone-800 flex gap-2">
          <input
            type="text"
            required
            value={userQuestion}
            onChange={(e) => setUserQuestion(e.target.value)}
            placeholder="Ex: Devo comprar adubo agora?"
            className="flex-1 bg-stone-800 border border-stone-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-emerald-500 placeholder:text-stone-500"
          />
          <button
            type="submit"
            disabled={customLoading}
            className="p-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center cursor-pointer"
          >
            <Send size={14} />
          </button>
        </form>
      </div>
    </div>
  );
}
