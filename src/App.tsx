import { Chat } from './components/Chat';
import { GraphView } from './components/GraphView';
import { useEffect, useState } from 'react';

function App() {
  const [path, setPath] = useState(window.location.pathname);

  useEffect(() => {
    const onPopState = () => setPath(window.location.pathname);
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950">
      {path === '/graph' ? <GraphView /> : <Chat />}
    </div>
  );
}

export default App;
