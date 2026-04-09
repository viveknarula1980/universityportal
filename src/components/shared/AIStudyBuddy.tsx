import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, X, MessageSquare, Send, Loader2, Minimize2, Maximize2, GraduationCap, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { apiService } from '@/services/api';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function AIStudyBuddy() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: `Hi ${user?.name || 'there'}! I'm your AI Study Buddy. I know you're in the **${user?.department || 'University'}** department. How can I help you today?` }
  ]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      // Inject context into the system prompt
      const systemPrompt = `You are a helpful AI Study Buddy for a university student named ${user?.name}.
        The student is in the department: ${user?.department || 'General Studies'}.
        Provide academic assistance, explain concepts, and help with assignments related to their field.
        Be encouraging, academic yet accessible, and concise.`;

      const response = await apiService.generateAIContent(userMessage, {
        systemPrompt,
        maxTokens: 1000
      });

      if (response.success) {
        setMessages(prev => [...prev, { role: 'assistant', content: response.data.content }]);
      } else {
        throw new Error(response.error || 'Failed to get response');
      }
    } catch (error: any) {
      setMessages(prev => [...prev, { role: 'assistant', content: `Sorry, I encountered an error: ${error.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.role !== 'student') return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Chat Window */}
      {isOpen && !isMinimized && (
        <div className="mb-4 w-[350px] sm:w-[400px] h-[500px] glass-card rounded-2xl border border-primary/20 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-6 fade-in duration-300">
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-primary/10 to-violet-500/10 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h3 className="font-display font-bold text-sm">AI Study Buddy</h3>
                <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <Building2 className="w-2.5 h-2.5" /> {user.department || 'General'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsMinimized(true)}>
                <Minimize2 className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setIsOpen(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-secondary/5">
            {messages.map((m, i) => (
              <div key={i} className={cn("flex flex-col max-w-[85%]", m.role === 'user' ? "ml-auto items-end" : "mr-auto items-start")}>
                <div className={cn(
                  "p-3 rounded-2xl text-sm leading-relaxed",
                  m.role === 'user' ? "bg-primary text-primary-foreground rounded-tr-none" : "bg-card border border-border rounded-tl-none shadow-sm"
                )}>
                  <ReactMarkdown className="markdown-content">{m.content}</ReactMarkdown>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2 text-muted-foreground animate-pulse">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-xs">Processing...</span>
              </div>
            )}
          </div>

          {/* Input */}
          <form onSubmit={handleSendMessage} className="p-4 border-t border-border bg-card flex gap-2">
            <Input
              placeholder="Ask anything..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 bg-secondary/20 border-none focus-visible:ring-1 focus-visible:ring-primary"
            />
            <Button type="submit" size="icon" disabled={loading} className="shrink-0 bg-primary hover:bg-primary/90">
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      )}

      {/* Minimized Bar */}
      {isOpen && isMinimized && (
        <div 
          className="mb-4 w-64 p-3 glass-card rounded-xl border border-primary/30 flex items-center justify-between cursor-pointer hover:bg-secondary/10 transition-colors shadow-lg animate-in slide-in-from-right-6 duration-300"
          onClick={() => setIsMinimized(false)}
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary animate-pulse" />
            <span className="text-sm font-semibold">AI Study Buddy</span>
          </div>
          <Maximize2 className="w-3 h-3 text-muted-foreground" />
        </div>
      )}

      {/* FAB Bubble */}
      <Button
        onClick={() => {
          setIsOpen(!isOpen);
          setIsMinimized(false);
        }}
        size="icon"
        className={cn(
          "w-14 h-14 rounded-full shadow-2xl transition-all duration-500 group relative",
          isOpen ? "bg-destructive hover:bg-destructive/90 rotate-90" : "bg-gradient-to-br from-primary to-violet-600 hover:scale-110"
        )}
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <>
            <MessageSquare className="w-6 h-6" />
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-background animate-bounce" />
            <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping group-hover:hidden" />
          </>
        )}
      </Button>
    </div>
  );
}
