import './App.css';
import { useEffect, useState } from 'react';

function App() {
  const [data, setData] = useState([]);
  useEffect(() => {
    const dataSource = new EventSource('http://localhost:8080/data');
    dataSource.addEventListener('message', (event) => {
      setData(JSON.parse(event.data));
    });

    return () => {
      dataSource.close();
    }
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <p>
          {JSON.stringify(data)}
        </p>
        <iframe width="1710" height="735" src="https://www.youtube.com/embed/yO078N405-I" title="Test" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
      </header>
    </div>
  );
}

export default App;