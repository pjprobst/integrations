import './App.css';
import HomePage from './pages/HomePage';
import ReadingsPage from './pages/ReadingsPage';
import VideosPage from './pages/VideosPage';
import WritingsPage from './pages/WritingsPage';

const wipPaths = new Set(['/projects']);

function App() {
  const path = window.location.pathname.replace(/\/+$/, '') || '/';

  if (wipPaths.has(path)) {
    return <div>WIP</div>;
  }

  else if (path === '/videos'){
    return <VideosPage />;
  }

  else if (path === '/writings'){
    return <WritingsPage />;
  }

  else if (path === '/readings'){
    return <ReadingsPage />;
  }

  else {
    return <HomePage />;
  }
}

export default App;
