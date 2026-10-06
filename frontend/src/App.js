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
  github: { icon: '/github_icon.png', darkIcon: '/github_white_icon.png', label: 'GitHub' },
  hardcover: { icon: '/hardcover_icon.png', label: 'Hardcover' },
  youtube: { icon: '/youtube_icon.png', label: 'YouTube' },
  leetcode: { icon: '/leetcode_logo.png', darkIcon: '/leetcode_white_icon.png', label: 'LeetCode' },
  substack: { icon: '/substack_icon.png', label: 'Substack' },
};

function getActivityDescription(activity) {
  switch (activity.type) {
    case 'github':
      return `${activity.event} ${activity.name}`;
    case 'hardcover':
      if (activity.event === 'Read with diff') {
        return activity.pageDiff === 1 ? `Read ${activity.pageDiff} page of ${activity.title} by ${activity.author}` :  `Read ${activity.pageDiff} pages of ${activity.title} by ${activity.author}`;
      }
      else if (activity.event === 'Read no diff') {
        return `Read to page ${activity.currPage} of ${activity.title} by ${activity.author}`;
      }
      else {
        return `${activity.event} ${activity.title} by ${activity.author}`;
      }
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
  const [darkMode, setDarkMode] = useState(
    () => window.localStorage.getItem('theme') === 'dark'
  );
  const [themeWasToggled, setThemeWasToggled] = useState(
    () => window.localStorage.getItem('themeWasToggled') === 'true'
  );
  const [emailCopied, setEmailCopied] = useState(false);
  const [emailWasCopied, setEmailWasCopied] = useState(
    () => window.localStorage.getItem('emailWasCopied') === 'true'
  );

  useEffect(() => {
    document.body.classList.toggle('dark-mode', darkMode);
    window.localStorage.setItem('theme', darkMode ? 'dark' : 'light');

    return () => {
      document.body.classList.remove('dark-mode');
    };
  }, [darkMode]);

  useEffect(() => {
    const dataSource = new EventSource('http://localhost:8080/activities');
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
    window.localStorage.setItem('emailWasCopied', 'true');
    window.setTimeout(() => setEmailCopied(false), 1500);
  };

  const toggleTheme = () => {
    setDarkMode((currentMode) => !currentMode);
    setThemeWasToggled(true);
    window.localStorage.setItem('themeWasToggled', 'true');
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
        <button
          className={`theme-toggle${themeWasToggled ? ' toggled' : ''}`}
          type="button"
          onClick={toggleTheme}
        >
          {darkMode ? 'Light Mode' : 'Dark Mode'}
        </button>
      </nav>

      <main className="page-grid">
        <div className="main-column">
          <section className="intro">
            <img className="portrait" src="/me.jpeg" alt="Preston Probst" />

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
                        <img
                          className="activity-icon"
                          src={darkMode && activityTypes[activity.type].darkIcon
                            ? activityTypes[activity.type].darkIcon
                            : activityTypes[activity.type].icon}
                          alt=""
                        />
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
