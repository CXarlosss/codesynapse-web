import { create } from 'zustand';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  references?: Reference[];
  isStreaming?: boolean;
}

export interface Reference {
  path: string;
  name: string;
  type: string;
  line: number;
}

interface ChatState {
  messages: Message[];
  addMessage: (msg: Message) => void;
  updateLastMessage: (content: string, references?: Reference[]) => void;
  setStreaming: (streaming: boolean) => void;
  clearChat: () => void;
  selectedGraphNode: string | null;
  setSelectedGraphNode: (path: string | null) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  selectedGraphNode: null,
  setSelectedGraphNode: (path) => set({ selectedGraphNode: path }),
  
  addMessage: (msg) => set((state) => ({ 
    messages: [...state.messages, msg] 
  })),
  
  updateLastMessage: (content, references) => set((state) => {
    const msgs = [...state.messages];
    const last = msgs[msgs.length - 1];
    if (last && last.role === 'assistant') {
      last.content = content;
      if (references) last.references = references;
    }
    return { messages: msgs };
  }),
  
  setStreaming: (streaming) => set((state) => {
    const msgs = [...state.messages];
    const last = msgs[msgs.length - 1];
    if (last) last.isStreaming = streaming;
    return { messages: msgs };
  }),
  
  clearChat: () => set({ messages: [] }),
}));
