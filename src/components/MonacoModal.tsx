import React from 'react';
import { motion } from 'framer-motion';
import Editor from '@monaco-editor/react';
import { X, FileCode } from 'lucide-react';
import { type Reference } from '../store/useChatStore';

interface Props {
  refData: Reference;
  content: string;
  onClose: () => void;
}

export const MonacoModal: React.FC<Props> = ({ refData, content, onClose }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-4xl h-[80vh] flex flex-col shadow-2xl"
      >
        {/* Header */}
        <div className="h-12 border-b border-slate-700 flex items-center justify-between px-4 bg-slate-800 rounded-t-xl">
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <FileCode size={16} className="text-indigo-400" />
            <span className="font-mono">{refData.path}</span>
            <span className="text-xs bg-indigo-900/50 text-indigo-300 px-2 py-0.5 rounded">
              {refData.name} ({refData.type})
            </span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={18} />
          </button>
        </div>

        {/* Editor */}
        <div className="flex-1 overflow-hidden">
          <Editor
            height="100%"
            defaultLanguage="typescript"
            value={content}
            theme="vs-dark"
            options={{
              readOnly: true,
              minimap: { enabled: false },
              fontSize: 13,
              lineNumbers: 'on',
              roundedSelection: false,
              scrollBeyondLastLine: false,
            }}
          />
        </div>
      </motion.div>
    </motion.div>
  );
};
