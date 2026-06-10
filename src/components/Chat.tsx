import React, { useState, useRef, useEffect } from 'react';
import { useChatStore, type Message, type Reference } from '../store/useChatStore';
import { Send, Bot, User, FileCode } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MonacoModal } from './MonacoModal';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const Chat: React.FC = () => {
  const [input, setInput] = useState('');
  const [selectedRef, setSelectedRef] = useState<Reference | null>(null);
  const [fileContent, setFileContent] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { messages, addMessage, updateLastMessage, setStreaming } = useChatStore();

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(() => scrollToBottom(), [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    // 1. Añadir mensaje usuario
    addMessage({ id: Date.now().toString(), role: 'user', content: input });
    
    // 2. Añadir mensaje asistente vacío (streaming)
    addMessage({ id: (Date.now() + 1).toString(), role: 'assistant', content: '', isStreaming: true });
    
    const question = input;
    setInput('');

    // 3. Conectar SSE
    const eventSource = new EventSource(`${API_URL}/api/chat/stream?question=${encodeURIComponent(question)}`);
    
    let fullContent = '';
    let finalReferences: Reference[] | undefined;

    eventSource.onmessage = (event) => {
      if (event.data === '[DONE]') {
        eventSource.close();
        setStreaming(false);
        return;
      }

      try {
        const data = JSON.parse(event.data);
        
        if (data.token) {
          fullContent += data.token;
          updateLastMessage(fullContent);
        }
        
        if (data.references) {
          finalReferences = data.references;
        }
      } catch {
        // Si no es JSON, tratar como texto plano
        fullContent += event.data;
        updateLastMessage(fullContent);
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
      setStreaming(false);
      if (finalReferences) {
        updateLastMessage(fullContent, finalReferences);
      }
    };
  };

  const handleReferenceClick = async (ref: Reference) => {
    try {
      const res = await fetch(`${API_URL}/api/file?path=${encodeURIComponent(ref.path)}`);
      const data = await res.json();
      setFileContent(data.content);
      setSelectedRef(ref);
    } catch (err) {
      console.error('Failed to load file:', err);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-200">
      {/* Header */}
      <div className="h-14 border-b border-slate-800 flex items-center px-6 bg-slate-900">
        <Bot className="text-indigo-400 mr-3" size={22} />
        <h1 className="font-semibold text-lg flex-1">CodeSynapse</h1>
        <span className="ml-3 text-xs bg-slate-800 px-2 py-1 rounded text-slate-400 mr-4">100% Local</span>
        <button onClick={() => window.location.href = '/graph'} className="text-sm text-slate-300 hover:text-white px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-md transition-colors">
          Graph
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-slate-500">
            <Bot size={48} className="mb-4 opacity-50" />
            <p className="text-lg">¿Qué quieres saber sobre tu código?</p>
            <p className="text-sm mt-2">Ejemplo: "¿Dónde se maneja la autenticación?"</p>
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble 
            key={msg.id} 
            message={msg} 
            onRefClick={handleReferenceClick} 
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-slate-800 p-4 bg-slate-900">
        <div className="max-w-3xl mx-auto flex gap-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Pregunta sobre tu código..."
            className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 resize-none max-h-32"
            rows={1}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg px-4 py-2 transition-colors"
          >
            <Send size={18} />
          </button>
        </div>
      </div>

      {/* Monaco Modal */}
      <AnimatePresence>
        {selectedRef && (
          <MonacoModal
            refData={selectedRef}
            content={fileContent}
            onClose={() => setSelectedRef(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// --- Subcomponente: Message Bubble ---
const MessageBubble: React.FC<{ 
  message: Message; 
  onRefClick: (ref: Reference) => void 
}> = ({ message, onRefClick }) => {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div className={`max-w-3xl flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
          isUser ? 'bg-indigo-600' : 'bg-slate-700'
        }`}>
          {isUser ? <User size={16} /> : <Bot size={16} className="text-indigo-300" />}
        </div>
        
        <div className={`rounded-2xl px-5 py-3 text-sm leading-relaxed ${
          isUser 
            ? 'bg-indigo-600 text-white rounded-br-none' 
            : 'bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700'
        }`}>
          {message.isStreaming && !message.content ? (
            <div className="flex items-center gap-2 text-slate-400">
              <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-100" />
              <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-200" />
              <span className="text-xs ml-2">Buscando en el codebase...</span>
            </div>
          ) : (
            <div className="whitespace-pre-wrap">{message.content}</div>
          )}

          {/* Referencias clickeables */}
          {!isUser && message.references && message.references.length > 0 && (
            <div className="mt-3 pt-3 border-t border-slate-700 flex flex-wrap gap-2">
              {message.references.map((ref, i) => (
                <div key={i} className="flex items-center">
                  <button
                    onClick={() => onRefClick(ref)}
                    className="flex items-center gap-1.5 text-xs bg-slate-900 hover:bg-slate-700 border border-slate-600 rounded-md px-2 py-1 transition-colors text-indigo-300"
                  >
                    <FileCode size={12} />
                    {ref.path}:{ref.line}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      useChatStore.getState().setSelectedGraphNode(ref.path);
                      window.location.href = '/graph';
                    }}
                    className="ml-1 text-slate-500 hover:text-indigo-400 transition-colors"
                    title="Show in graph"
                  >
                    🕸️
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
