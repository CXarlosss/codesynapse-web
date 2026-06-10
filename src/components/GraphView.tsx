import React, { useEffect, useState, useRef, useCallback } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { useChatStore } from '../store/useChatStore';
import { MonacoModal } from './MonacoModal';
import { ArrowLeft, X, ZoomIn } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Definir polyfill básico para path.basename si falla en navegador
const basename = (p: string) => p.split(/[\\/]/).pop() || p;

interface GraphNode {
  id: string;
  name: string;
  lines: number;
  complexity: number;
  functions: number;
  classes: number;
  val?: number;
  color?: string;
  x?: number;
  y?: number;
}

interface GraphEdge {
  source: string;
  target: string;
  value: number;
}

export const GraphView: React.FC = () => {
  const [graphData, setGraphData] = useState<{ nodes: GraphNode[], links: GraphEdge[] }>({ nodes: [], links: [] });
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [highlightedNode, setHighlightedNode] = useState<string | null>(null);
  const [modalFile, setModalFile] = useState<{ path: string, content: string } | null>(null);
  const fgRef = useRef<any>(null);
  
  const { selectedGraphNode, setSelectedGraphNode } = useChatStore();

  // Cargar grafo
  useEffect(() => {
    fetch(`${API_URL}/api/graph`)
      .then(r => r.json())
      .then(data => {
        const nodes = data.nodes.map((n: any) => ({
          ...n,
          val: Math.sqrt(n.lines || 10) * 2 + 5,
          color: getComplexityColor(n.complexity),
        }));
        setGraphData({ nodes, links: data.edges });
      });
  }, []);

  // Resaltar nodo desde chat
  useEffect(() => {
    if (selectedGraphNode && graphData.nodes.length > 0) {
      setHighlightedNode(selectedGraphNode);
      const node = graphData.nodes.find(n => n.id === selectedGraphNode);
      if (node && fgRef.current) {
        fgRef.current.centerAt(node.x || 0, node.y || 0, 1000);
        fgRef.current.zoom(2.5, 1000);
      }
    }
  }, [selectedGraphNode, graphData.nodes]);

  const getComplexityColor = (c: number) => {
    if (c > 15) return '#ef4444'; // Rojo
    if (c > 5) return '#f59e0b';  // Amarillo
    return '#10b981';             // Verde
  };

  const handleNodeClick = useCallback((node: GraphNode) => {
    setSelectedNode(node);
    setHighlightedNode(node.id);
  }, []);

  const handleNodeDoubleClick = async (node: GraphNode) => {
    try {
      const res = await fetch(`${API_URL}/api/file?path=${encodeURIComponent(node.id)}`);
      const data = await res.json();
      setModalFile({ path: node.id, content: data.content });
    } catch (err) {
      console.error('Failed to load file:', err);
    }
  };

  const paintRing = useCallback((node: GraphNode, ctx: CanvasRenderingContext2D) => {
    if (node.id === highlightedNode || node.id === selectedGraphNode) {
      ctx.beginPath();
      ctx.arc(node.x!, node.y!, (node.val || 5) + 3, 0, 2 * Math.PI);
      ctx.strokeStyle = '#6366f1'; // Azul indigo
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }, [highlightedNode, selectedGraphNode]);

  const linkOpacity = useCallback((link: any) => {
    if (!highlightedNode) return 0.3;
    const source = typeof link.source === 'object' ? link.source.id : link.source;
    const target = typeof link.target === 'object' ? link.target.id : link.target;
    const isConnected = source === highlightedNode || target === highlightedNode;
    return isConnected ? 0.8 : 0.05;
  }, [highlightedNode]);

  const nodeOpacity = useCallback((node: GraphNode) => {
    if (!highlightedNode) return 1;
    if (node.id === highlightedNode) return 1;
    const isConnected = graphData.links.some((l: any) => {
      const s = typeof l.source === 'object' ? l.source.id : l.source;
      const t = typeof l.target === 'object' ? l.target.id : l.target;
      return (s === highlightedNode && t === node.id) || (t === highlightedNode && s === node.id);
    });
    return isConnected ? 0.8 : 0.15;
  }, [highlightedNode, graphData.links]);

  return (
    <div className="w-full h-screen bg-slate-950 relative overflow-hidden">
      {/* Header / Banner */}
      <div className="absolute top-0 left-0 right-0 z-10 h-14 bg-slate-900/80 backdrop-blur border-b border-slate-800 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => window.location.href = '/'} 
            className="text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-white font-semibold">CodeSynapse Graph</h2>
        </div>
        
        <AnimatePresence>
          {selectedGraphNode && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-3 bg-indigo-900/50 border border-indigo-500/30 rounded-lg px-3 py-1.5"
            >
              <ZoomIn size={14} className="text-indigo-300" />
              <span className="text-sm text-indigo-200">Context: {selectedGraphNode}</span>
              <button 
                onClick={() => setSelectedGraphNode(null)}
                className="text-indigo-300 hover:text-white"
              >
                <X size={14} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Force Graph */}
      <ForceGraph2D
        ref={fgRef}
        graphData={graphData}
        nodeRelSize={1}
        nodeVal="val"
        nodeColor={(n: any) => n.color}
        nodeLabel={(n: any) => `${n.name}\nComplexity: ${n.complexity}\nLines: ${n.lines}\nFunctions: ${n.functions}`}
        nodeCanvasObjectMode={(n: any) => highlightedNode && n.id !== highlightedNode && !graphData.links.some((l: any) => {
          const s = typeof l.source === 'object' ? l.source.id : l.source;
          const t = typeof l.target === 'object' ? l.target.id : l.target;
          return (s === highlightedNode && t === n.id) || (t === highlightedNode && s === n.id);
        }) ? 'before' : undefined}
        nodeCanvasObject={(n: any, ctx: CanvasRenderingContext2D) => paintRing(n, ctx)}
        linkColor={(link: any) => `rgba(156, 163, 175, ${linkOpacity(link)})`}
        nodeVisibility={(n: any) => nodeOpacity(n) > 0.1}
        onNodeClick={handleNodeClick}
        // @ts-ignore
        onNodeDoubleClick={handleNodeDoubleClick}
        backgroundColor="#020617"
        linkDirectionalArrowLength={6}
        linkDirectionalArrowRelPos={1}
        warmupTicks={100}
        cooldownTicks={50}
      />

      {/* Tooltip / Info Panel */}
      <AnimatePresence>
        {selectedNode && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="absolute bottom-4 right-4 w-72 bg-slate-900/90 backdrop-blur border border-slate-700 rounded-xl p-4 shadow-2xl"
          >
            <h3 className="text-white font-semibold mb-2 font-mono text-sm">{selectedNode.id}</h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Complexity</span>
                <span className={`font-mono font-bold ${selectedNode.complexity > 15 ? 'text-red-400' : selectedNode.complexity > 5 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {selectedNode.complexity}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Lines</span>
                <span className="text-slate-200 font-mono">{selectedNode.lines}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Functions</span>
                <span className="text-slate-200 font-mono">{selectedNode.functions}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Classes</span>
                <span className="text-slate-200 font-mono">{selectedNode.classes}</span>
              </div>
            </div>
            <button
              onClick={() => handleNodeDoubleClick(selectedNode)}
              className="mt-3 w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md text-xs font-medium transition-colors"
            >
              View Source
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Monaco Modal */}
      {modalFile && (
        <MonacoModal
          refData={{ path: modalFile.path, name: basename(modalFile.path), type: 'file', line: 1 }}
          content={modalFile.content}
          onClose={() => setModalFile(null)}
        />
      )}
    </div>
  );
};
