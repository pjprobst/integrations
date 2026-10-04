import './App.css';
import { useEffect, useState } from 'react';

const navigation = [
  ['Home', '#home'],
  ['Projects', '#projects'],
  ['Videos', '#videos'],
  ['Writings', '#writings'],
  ['Readings', '#readings'],
  ['Book Time With Me', '#book-time'],
];

const activityTypes = {
  github: { icon: '/github_icon.png', label: 'GitHub' },
  hardcover: { icon: '/hardcover_icon.png', label: 'Hardcover' },
  youtube: { icon: '/youtube_icon.png', label: 'YouTube' },
  leetcode: { icon: '/leetcode_logo.png', label: 'LeetCode' },
  substack: { icon: '/substack_icon.png', label: 'Substack' },
};

function getActivityDescription(activity) {
  switch (activity.type) {
    case 'github':
      return `${activity.event} ${activity.name}`;
    case 'hardcover':
      return activity.event === 'Read'
        ? `${activity.event} ${activity.pageDiff} pages of ${activity.title} by ${activity.author}`
        : `${activity.event} ${activity.title} by ${activity.author}`;
    case 'youtube':
    case 'substack':
      return `${activity.event} called ${activity.title}`;
    case 'leetcode':
      return `Solved ${activity.title}`;
    default:
      return null;
  }
}

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

  const activitiesByDate = data.reduce((groups, activity) => {
    const date = activity.date || 'Undated';

    if (!groups[date]) {
      groups[date] = [];
    }

    groups[date].push(activity);
    return groups;
  }, {});

  return (
    <div className="site-shell" id="home">
      <nav className="site-nav">
        <div className="nav-links">
          {navigation.map(([label, href]) => (
            <a href={href} key={label}>{label}</a>
          ))}
        </div>
      </nav>

      <main className="page-grid">
        <div className="main-column">
          <section className="intro">
            <div className="portrait-placeholder">
              Picture of me
            </div>

            <div className="intro-copy">
              <h1>Preston Probst</h1>
              <p className="role">Software Engineering Intern at Character.ai</p>
              <p>B.S. Computer Science - Philosophy Minor</p>
              <p>University of Pittsburgh - Class of 2028</p>
              <p>Previously at Iris (YC F25)</p>

              <div className="social-links">
                <a href="#resume">Resume</a>
                <a href="mailto:preston@example.com">Email</a>
                <a href="https://github.com" target="_blank" rel="noreferrer">Github</a>
                <a href="https://linkedin.com" target="_blank" rel="noreferrer">LinkedIn</a>
              </div>
            </div>
          </section>

          <section className="bio-sections">
            <p>
              <span className="section-lead">About me:</span> Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum <a href="#about">[Read More Here]</a>
            </p>

            <p>
              <span className="section-lead">Previously:</span> Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum
            </p>

            <p>
              <span className="section-lead">What I’m Currently Up To:</span> Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum
            </p>
          </section>

          <section className="directory">
            <p id="projects"><a href="#projects">Projects:</a> <span>Brief Summary</span></p>
            <p id="writings"><a href="#writings">Writings:</a> <span>Brief Summary</span></p>
            <p id="readings"><a href="#readings">Readings:</a> <span>Brief Summary</span></p>
          </section>
        </div>

        <aside className="activity-panel">
          <h2>Weekly Activity</h2>
          <div className="activity-groups">
            {Object.entries(activitiesByDate).map(([date, activities]) => (
              <section className="activity-date-group" key={date}>
                <h3>{date}</h3>
                <ul>
                  {activities.map((activity, index) => {
                    const description = getActivityDescription(activity);

                    if (!description) {
                      return null;
                    }

                    return (
                      <li className={`${activity.type}-activity`} key={`${activity.type}-${activity.time}-${index}`}>
                        <img className="activity-icon" src={activityTypes[activity.type].icon} alt="" />
                        <span className="activity-content">
                          <span className="activity-meta">{activityTypes[activity.type].label} · {activity.time}</span>
                          <span>{description}</span>
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>
        </aside>
      </main>

      <footer>Made with <span>❤️</span> by Preston Probst</footer>
    </div>
  );
}

export default App;