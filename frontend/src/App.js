import './App.css';
import { useEffect, useState } from 'react';

const navigation = [
  ['Home', '/'],
  ['Projects', '/projects'],
  ['Videos', '/videos'],
  ['Writings', '/writings'],
  ['Readings', '/readings'],
  ['Book Time With Me', 'https://calendar.app.google/UB9xZXa7gtQ32pz27'],
];

const wipPaths = new Set(['/projects', '/videos', '/writings', '/readings']);

const email = 'pjamesprobst@gmail.com';

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

function HomePage() {
  const [data, setData] = useState([]);
  const [emailCopied, setEmailCopied] = useState(false);
  const [emailWasCopied, setEmailWasCopied] = useState(false);

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

  const copyEmail = async () => {
    await navigator.clipboard.writeText(email);
    setEmailCopied(true);
    setEmailWasCopied(true);
    window.setTimeout(() => setEmailCopied(false), 1500);
  };

  return (
    <div className="site-shell" id="home">
      <nav className="site-nav">
        <div className="nav-links">
          {navigation.map(([label, href]) => {
            const isExternal = href.startsWith('http');

            return (
              <a
                href={href}
                key={label}
                target={isExternal ? '_blank' : undefined}
                rel={isExternal ? 'noopener noreferrer' : undefined}
              >
                {label}
              </a>
            );
          })}
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
                <a href="/preston_j_probst_resume.pdf" target="_blank" rel="noopener noreferrer">Resume</a>
                <button className={`email-button${emailWasCopied ? ' copied' : ''}`} type="button" onClick={copyEmail}>
                  {emailCopied ? 'Copied!' : 'Email'}
                </button>
                <a href="https://github.com/pjprobst" target="_blank" rel="noopener noreferrer">Github</a>
                <a href="https://www.linkedin.com/in/prestonpro" target="_blank" rel="noopener noreferrer">LinkedIn</a>
              </div>
            </div>
          </section>

          <section className="bio-sections">
            <p>
              <span className="section-lead">About me:</span> Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum <a href="#about">[Read More Here]</a>
            </p>

            <p>
              <span className="section-lead">What I’m Currently Up To:</span> Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum
            </p>

            <p>
              <span className="section-lead">Previously:</span> Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum
            </p>
          </section>
        </div>

        <aside className="activity-panel">
          <h2>My Weekly Activity</h2>
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
                          <span className="activity-meta">{activityTypes[activity.type].label} - {activity.time}</span>
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
    </div>
  );
}

function App() {
  const path = window.location.pathname.replace(/\/+$/, '') || '/';

  if (wipPaths.has(path)) {
    return <div>WIP</div>;
  }

  return <HomePage />;
}

export default App;
