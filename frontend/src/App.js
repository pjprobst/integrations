import './App.css';
import { useEffect, useState } from 'react';

function App() {
  const [data, setData] = useState([]);

  useEffect(() => {
    const dataSource = new EventSource('http://localhost:8080/data');
    dataSource.addEventListener('activities', (event) => {
      setData(JSON.parse(event.data));
    });

    return () => {
      dataSource.close();
    }
  }, []);

  const activityList = data.map((activity) => {
    switch(activity.type) {
      case "github":
        return (
          <div className='github-activity'>
            {activity.event} {activity.name} at {activity.date}, {activity.time}
          </div>
        );
      case "hardcover":
        if (activity.event === 'Read') {
          return (
            <div className='hardcover-activity'>
              {activity.event} {activity.pageDiff} pages of {activity.title} by {activity.author} at {activity.date}, {activity.time}
            </div>
          );
        }
        else {
          return (
            <div className='hardcover-activity'>
              {activity.event} {activity.title} by {activity.author} at {activity.date}, {activity.time}
            </div>
          );
        }
      case "youtube":
        return (
          <div className='youtube-activity'>
            {activity.event} called {activity.title} at {activity.date}, {activity.time}
          </div>
        );
      case "leetcode":
        return (
          <div className='leetcode-activity'>
            Solved {activity.title} at {activity.date}, {activity.time}
          </div>
        );
      case "substack":
        return (
          <div className='substack-activity'>
            {activity.event} called {activity.title} at {activity.date}, {activity.time}
          </div>
        );
      default:
        return (
          <div></div>
        );
    }
  });

  return (
    <div className="App">
      <header className="App-header">
        <div className="App-activity-list">
          Recent Activities: 
          {`\n\n`}
          
          {activityList}
        </div>
      </header>
    </div>
  );
}

export default App;