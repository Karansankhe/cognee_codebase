import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Send, Loader2, Sparkles, User, Brain, Plus, Mic, Image, PenTool, Globe, DatabaseZap, Network } from "lucide-react";
import { AppShell } from "../../components/layout/AppShell";
import { Card, CardBody, CardHeader } from "../../components/ui/Card";

interface Message {
  sender: "user" | "ai";
  text: string;
}

const suggestions = [
  "What are my main symptoms?",
  "What triggers my symptom episodes?",
  "What lifestyle factors positively impact my health?",
  "Are my medications effective?",
];

export function GraphPage() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: "ai",
      text: "Hello! I am your Pulse Memory Assistant. I can query your personal knowledge graph to retrieve historical symptoms, triggers, medications, and outcomes. Ask me anything!",
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isQuerying, setIsQuerying] = useState(false);

  const handleNavigate = (page: string) => {
    if (page === "Dashboard") {
      navigate("/dashboard");
    } else if (page === "Graph") {
      navigate("/graph");
    } else if (page === "Trends") {
      navigate("/trends");
    } else if (page === "Summary") {
      navigate("/summary");
    }
  };

  const handleSend = async (text: string) => {
    if (!text.trim()) return;

    // Add user message
    setMessages((prev) => [...prev, { sender: "user", text }]);
    setInputValue("");
    setIsQuerying(true);

    try {
      const response = await fetch("/api/v1/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: text }),
      });

      if (!response.ok) throw new Error("Query failed");
      const result = await response.json();

      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: result.graph_answer || "No response received from your memory graph.",
        },
      ]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: "Sorry, I encountered an error while querying your memory graph.",
        },
      ]);
    } finally {
      setIsQuerying(false);
    }
  };

  const isLandingState = messages.length <= 1 && !isQuerying;

  return (
    <AppShell activePage="Graph" onNavigate={handleNavigate}>
      <main className="px-4 pb-5 pt-3 sm:px-6 h-[calc(100vh-2rem)] flex flex-col">
        {/* Header */}
        <div className="mb-4">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-pulse-muted">
            Knowledge Base
          </p>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-3xl font-semibold tracking-normal">
                Cognee Memory Graph Assistant
              </h1>
              <p className="mt-1 text-sm font-medium text-pulse-muted">
                Ask patient-history questions with recall, graph context, and cited memory.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-pulse-green/50 bg-pulse-green/25 px-3 py-1.5 text-xs font-bold text-pulse-ink shadow-sm">
                <DatabaseZap className="h-3.5 w-3.5" />
                Cognee recall
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1.5 text-xs font-bold text-cyan-900 shadow-sm">
                <Network className="h-3.5 w-3.5" />
                Graph RAG
              </span>
            </div>
          </div>
        </div>

        {/* Chat UI Card */}
        <Card className="flex-1 flex flex-col bg-white/70 overflow-hidden min-h-0">
          <CardHeader 
            title="Natural Language Query" 
            eyebrow="Interactive Memory" 
            action={
              <div className="flex items-center gap-1.5 rounded-full bg-pulse-mint/20 px-3 py-1 text-xs font-semibold text-pulse-ink">
                <Brain className="h-3.5 w-3.5" />
                Active Dataset
              </div>
            }
          />
          <CardBody className="flex-1 flex flex-col justify-between overflow-hidden p-5 gap-4">
            
            {isLandingState ? (
              /* Gemini style landing view */
              <div className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto w-full gap-6 select-none">
                <h2 className="text-3xl font-light text-pulse-ink/90 text-center font-sans tracking-tight">
                  Ready when you are.
                </h2>
                
                {/* Search Bar Input Pill */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSend(inputValue);
                  }}
                  className="flex items-center gap-3.5 rounded-full border border-pulse-line bg-white w-full max-w-xl px-5 py-3 shadow-[0_12px_35px_rgba(0,0,0,0.04)] focus-within:border-pulse-ink focus-within:shadow-[0_14px_40px_rgba(216,251,100,0.22)] transition-all duration-300"
                >
                  <button type="button" className="text-pulse-muted hover:text-pulse-ink transition cursor-pointer">
                    <Plus className="h-5 w-5" />
                  </button>
                  
                  <input
                    type="text"
                    placeholder="Ask anything"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    className="flex-1 bg-transparent text-sm text-pulse-ink outline-none placeholder:text-pulse-muted/80"
                  />
                  
                  <button type="button" className="text-pulse-muted hover:text-pulse-ink transition cursor-pointer">
                    <Mic className="h-5 w-5" />
                  </button>
                  
                  <button
                    type="submit"
                    className="grid h-9 w-9 place-items-center rounded-full bg-black text-white hover:bg-pulse-ink transition shadow-sm cursor-pointer"
                  >
                    <svg viewBox="0 0 24 24" className="h-4.5 w-4.5 stroke-white" fill="none" strokeWidth="2.5" strokeLinecap="round" xmlns="http://www.w3.org/2000/svg">
                      <path d="M4 10v4M8 6v12M12 4v16M16 6v12M20 10v4" />
                    </svg>
                  </button>
                </form>

                {/* Gemini style horizontal action chips */}
                <div className="flex flex-wrap items-center justify-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleSend("Generate a visual health timeline representation from my symptom history")}
                    className="flex items-center gap-2 rounded-full border border-pulse-line bg-white px-4 py-2 text-xs font-semibold text-pulse-muted/80 transition hover:bg-pulse-mint/20 hover:border-pulse-green shadow-sm cursor-pointer"
                  >
                    <Image className="h-3.5 w-3.5 text-pulse-ink" />
                    Create an image
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSend("Draft a concise patient diary log summary")}
                    className="flex items-center gap-2 rounded-full border border-pulse-line bg-white px-4 py-2 text-xs font-semibold text-pulse-muted/80 transition hover:bg-pulse-mint/20 hover:border-pulse-green shadow-sm cursor-pointer"
                  >
                    <PenTool className="h-3.5 w-3.5 text-pulse-ink" />
                    Write or edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSend("Identify other recorded correlation triggers in clinical data")}
                    className="flex items-center gap-2 rounded-full border border-pulse-line bg-white px-4 py-2 text-xs font-semibold text-pulse-muted/80 transition hover:bg-pulse-mint/20 hover:border-pulse-green shadow-sm cursor-pointer"
                  >
                    <Globe className="h-3.5 w-3.5 text-pulse-ink" />
                    Look something up
                  </button>
                </div>

                {/* Suggestion Queries */}
                <div className="w-full mt-5 max-w-xl">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-pulse-muted text-center mb-3">
                    Suggested Queries
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 w-full">
                    {suggestions.map((sug, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSend(sug)}
                        className="rounded-2xl border border-pulse-line bg-white/50 p-4 text-center text-xs text-pulse-ink shadow-sm transition hover:border-pulse-green hover:bg-pulse-mint/25 cursor-pointer"
                      >
                        {sug}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* Active Chat View (message log scrollable area + input bar at bottom) */
              <>
                {/* Scrollable messages container */}
                <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                  {messages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex items-start gap-3 max-w-[85%] ${
                        msg.sender === "user" ? "ml-auto flex-row-reverse" : ""
                      }`}
                    >
                      <div
                        className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-white ${
                          msg.sender === "user" ? "bg-pulse-ink" : "bg-pulse-muted"
                        }`}
                      >
                        {msg.sender === "user" ? <User className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                      </div>
                      <div
                        className={`rounded-[20px] px-4 py-2.5 text-sm leading-6 shadow-sm ${
                          msg.sender === "user"
                            ? "bg-pulse-ink text-white"
                            : "bg-pulse-mint/20 border border-pulse-green/20 text-pulse-ink"
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{msg.text}</p>
                      </div>
                    </div>
                  ))}
                  
                  {isQuerying && (
                    <div className="flex items-start gap-3 max-w-[85%]">
                      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-pulse-muted text-white">
                        <Sparkles className="h-4 w-4" />
                      </div>
                      <div className="rounded-[20px] px-4 py-2.5 text-sm leading-6 bg-pulse-mint/10 border border-pulse-green/10 text-pulse-muted flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-pulse-ink" />
                        Searching knowledge graph...
                      </div>
                    </div>
                  )}
                </div>

                {/* Input elements at bottom */}
                <div className="space-y-4 pt-2">
                  {/* Form Input */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSend(inputValue);
                    }}
                    className="flex items-center gap-3.5 rounded-full border border-pulse-line bg-white px-5 py-2.5 shadow-sm focus-within:border-pulse-ink"
                  >
                    <button type="button" className="text-pulse-muted hover:text-pulse-ink transition cursor-pointer">
                      <Plus className="h-5 w-5" />
                    </button>
                    
                    <input
                      type="text"
                      placeholder="Ask anything..."
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      disabled={isQuerying}
                      className="flex-1 bg-transparent text-sm text-pulse-ink outline-none placeholder:text-pulse-muted"
                    />
                    
                    <button type="button" className="text-pulse-muted hover:text-pulse-ink transition cursor-pointer">
                      <Mic className="h-5 w-5" />
                    </button>
                    
                    <button
                      type="submit"
                      disabled={isQuerying || !inputValue.trim()}
                      className="grid h-9 w-9 place-items-center rounded-full bg-black text-white hover:bg-pulse-ink transition shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send className="h-4.5 w-4.5" />
                    </button>
                  </form>

                  {/* Suggestion cards (small horizontal chips below input during chat) */}
                  <div>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {suggestions.slice(0, 3).map((sug, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSend(sug)}
                          disabled={isQuerying}
                          className="rounded-full border border-pulse-line bg-white/40 px-3.5 py-1.5 text-left text-[11px] text-pulse-ink shadow-sm transition hover:border-pulse-green hover:bg-pulse-mint/20 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {sug}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}

          </CardBody>
        </Card>
      </main>
    </AppShell>
  );
}
