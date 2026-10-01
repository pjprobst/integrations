import './App.css';
import { useEffect, useState } from 'react';

function App() {
  const [data, setData] = useState([]);
  const [videos, setVideos] = useState([]);

  useEffect(() => {
    const dataSource = new EventSource('http://localhost:8080/data');
    dataSource.addEventListener('youtubeActivity', (event) => {
      setData(JSON.parse(event.data));
    });

    dataSource.addEventListener('youtubeVideos', (event) => {
      setVideos(JSON.parse(event.data));
    });

    return () => {
      dataSource.close();
    }
  }, []);

  const videoList = videos.map((entry, index) => (
    <iframe
      key={entry[0]}
      src={`https://www.youtube.com/embed/${entry[0]}`}
      title={entry[0]}
    />
  ));

  return (
    <div className="App">
      <header className="App-header">
        <p>
          {JSON.stringify(data)}
        </p>
        <ul>
          {videoList}
        </ul>
      </header>
    </div>
  );
}

export default App;