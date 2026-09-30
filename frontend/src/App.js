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
      </header>
    </div>
  );
}

export default App;
