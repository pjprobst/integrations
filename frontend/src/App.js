import logo from './logo.svg';
import './App.css';
import React, { useEffect, useState } from 'react';

function App() {
  const [data, setData] = useState('');

  useEffect(() => {
    fetch('http://localhost:8080/data')
    .then((res) => res.json())
    .then((data) => setData(JSON.stringify(data)))
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <p>
          {data}
        </p>
      </header>
    </div>
  );
}

export default App;
