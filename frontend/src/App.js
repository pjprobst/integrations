import './App.css';
import HomePage from './pages/HomePage';
import ProjectsPage from './pages/ProjectsPage';
import ReadingsPage from './pages/ReadingsPage';
import VideosPage from './pages/VideosPage';
import WritingsPage from './pages/WritingsPage';

function App() {
  const path = window.location.pathname.replace(/\/+$/, '') || '/';

  if (path === '/projects') {
    return <ProjectsPage />;
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
