# CodeSynapse Web

> Chat inteligente y grafo de dependencias para explorar código en tiempo real.

## ✨ Features

- **Chat RAG:** Pregunta en lenguaje natural sobre tu codebase
- **Streaming SSE:** Respuestas token a token, tipo ChatGPT
- **Referencias Clickeables:** Chips que abren código en Monaco Editor
- **Grafo Interactivo:** Visualización de dependencias con heatmap de complejidad
- **Modo Offline:** Funciona sin GPU ni internet tras indexar

## 🎨 Stack

React 18 · TypeScript · Vite · react-force-graph-2d · Zustand · Framer Motion · Monaco Editor · TailwindCSS

## 🚀 Deploy

```bash
npm install
npm run dev
```

## 🔗 API
Conecta a codesynapse-api via SSE en `/api/chat/stream` y REST en `/api`.

## 📸 Demo
Ver demo en vivo en Vercel.

## 📄 Licencia
MIT
