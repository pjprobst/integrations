import './App.css';
import { useEffect, useState } from 'react';

function App() {
  const [data, setData] = useState([]);
  //const [videos, setVideos] = useState([]);
  //const [posts, setPosts] = useState([]);

  useEffect(() => {
    const dataSource = new EventSource('http://localhost:8080/data');
    dataSource.addEventListener('activities', (event) => {
      setData(JSON.parse(event.data, null, 3));
    });


    /*
    dataSource.addEventListener('substackPosts', (event) => {
      setPosts(JSON.parse(event.data));
    });
    */

    /*
    dataSource.addEventListener('youtubeVideos', (event) => {
      setVideos(JSON.parse(event.data));
    });
    */

    return () => {
      dataSource.close();
    }
  }, []);

  /*

  useEffect(() => {
    const script = document.createElement('script');

    script.src = 'https://substack.com/embedjs/embed.js';
    script.async = true;
    script.charset = 'utf-8';

    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, [posts]);

  const postList = posts.map((entry, index) => (
    <div key={entry[0]} className="substack-post-embed">
      <p lang="en">{entry[1][0]} by Preston</p>
      <p>{entry[1][0]}</p>
      <a 
		    data-post-link href={entry[0]}>Read on Substack
	    </a>
    </div>
  ));

  */

  /*
  const videoList = videos.map((entry, index) => (
    <iframe
      key={entry[0]}
      src={`https://www.youtube.com/embed/${entry[0]}`}
      title={entry[0]}
    />
  ));
  */

  return (
    <div className="App">
      <header className="App-header">
        <p>
          {JSON.stringify(data)}
        </p>
      </header>
    </div>
  );
}

export default App;