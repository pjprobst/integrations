import { useEffect, useRef, useState } from 'react';
import API_URL from '../config';
import useTheme from '../hooks/useTheme';

const navigation = [
  ['Home', '/'],
  ['Projects', '/projects'],
  ['Videos', '/videos'],
  ['Writings', '/writings'],
  ['Readings', '/readings'],
  ['Book Time With Me', 'https://cal.com/prestonpro/chat'],
];

const email = 'pjamesprobst@gmail.com';

const activityTypes = {
  github: { icon: '/github_icon.png', darkIcon: '/github_white_icon.png', label: 'GitHub' },
  hardcover: { icon: '/hardcover_icon.png', label: 'Hardcover' },
  youtube: { icon: '/youtube_icon.png', label: 'YouTube' },
  leetcode: { icon: '/leetcode_logo.png', darkIcon: '/leetcode_white_icon.png', label: 'LeetCode' },
  substack: { icon: '/substack_icon.png', label: 'Substack' },
};

function getGithubDescription(activity) {
  const repositoryNames = {
    'work - private repo': 'a private work repository',
    'school - private repo': 'a private school repository',
    'private repo': 'a private repository',
  };
  const repository = repositoryNames[activity.name]
    || activity.name?.replace(/^pjprobst\//, '')
    || 'a repository';
  const actions = {
    'Created a new branch': 'Created a branch',
    'Created a new tag': 'Created a tag',
    'Created a new repo': 'Created repository',
    'Commented on an issue / pull request': 'Commented on an issue or pull request',
  };
  const action = actions[activity.event] || activity.event;

  if (activity.event === 'Pushed commits') {
    return `Pushed to ${repository}`;
  }

  if (activity.event === 'Forked a repository') {
    return `Forked ${repository}`;
  }

  if (activity.event === 'Starred a repository') {
    return `Starred ${repository}`;
  }

  if (activity.event === 'Made a repository public') {
    return `Made ${repository} public`;
  }

  if (activity.event === 'Accepted an invitation to') {
    return `${action} ${repository}`;
  }

  if (activity.event === 'Created a new repo') {
    return `${action} ${repository}`;
  }

  return `${action} in ${repository}`;
}

function getActivityDescription(activity) {
  switch (activity.type) {
    case 'github':
      return getGithubDescription(activity);
    case 'hardcover':
      if (activity.event === 'Read with diff') {
        return activity.pageDiff === 1 ? `Read ${activity.pageDiff} page of ${activity.title}` :  `Read ${activity.pageDiff} pages of ${activity.title}`;
      }
      else if (activity.event === 'Read no diff') {
        return `Read to page ${activity.currPage} of ${activity.title}`;
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
  const [activityError, setActivityError] = useState('');
  const hasReceivedActivities = useRef(false);
  const { darkMode, themeWasToggled, toggleTheme } = useTheme();
  const [emailCopied, setEmailCopied] = useState(false);
  const [emailWasCopied, setEmailWasCopied] = useState(
    () => window.localStorage.getItem('emailWasCopied') === 'true'
  );

  useEffect(() => {
    const dataSource = new EventSource(`${API_URL}/activities`);
    dataSource.addEventListener('activities', (event) => {
      hasReceivedActivities.current = true;
      setData(JSON.parse(event.data));
      setActivityError('');
    });
    dataSource.addEventListener('error', () => {
      if (!hasReceivedActivities.current) {
        setActivityError('Unable to load activities.');
      }
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

  return (
    <div className="site-shell" id="home">
      <nav className="site-nav">
        <div className="nav-links">
          {navigation.map(([label, href]) => {
            const isExternal = href.startsWith('http');
            const isCurrent = href === (window.location.pathname.replace(/\/+$/, '') || '/');

            return (
              <a
                href={href}
                key={label}
                className={isCurrent ? 'current-page' : undefined}
                target={isExternal ? '_blank' : undefined}
                rel={isExternal ? 'noopener noreferrer' : undefined}
              >
                {label}
              </a>
            );
          })}
          <button
            className={`theme-toggle${themeWasToggled ? ' toggled' : ''}`}
            type="button"
            onClick={toggleTheme}
          >
            {darkMode ? 'Light Mode' : 'Dark Mode'}
          </button>
        </div>
      </nav>

      <main className="page-grid">
        <div className="main-column">
          <section className="intro">
            <img className="portrait" src="/me.jpeg" alt="Preston Probst" />

            <div className="intro-copy">
              <h1>Preston Probst</h1>
              <p className="role">Software Engineering Intern at Character.ai</p>
              <p>B.S. in Computer Science - Minor in Philosophy</p>
              <p>University of Pittsburgh - Class of 2028</p>
              <p>Previously at Iris (YC F25), DME, and Ruddervirt</p>

              <div className="social-links">
                <a href="/preston_j_probst_resume.pdf" target="_blank" rel="noopener noreferrer">Resume</a>
                <button className={`email-button${emailWasCopied ? ' copied' : ''}`} type="button" onClick={copyEmail}>
                  {emailCopied ? 'Copied!' : 'Email'}
                </button>
                <a href="https://github.com/pjprobst" target="_blank" rel="noopener noreferrer">GitHub</a>
                <a href="https://www.linkedin.com/in/prestonpro" target="_blank" rel="noopener noreferrer">LinkedIn</a>
              </div>
            </div>
          </section>

          <section className="bio-sections">
            <p>
              <span className="section-lead">About:</span> I started programming in 2020, learning Python from YouTube during the pandemic. Since then, I have focused on improving each day, and I look forward to seeing where it takes me.
            </p>
            <p>
              <span className="section-lead">Currently:</span> I work as a software engineering intern on <a href="https://character.ai/" target="_blank" rel="noopener noreferrer">Character.ai</a>'s monetization team. At Pitt, I study computer science and philosophy and serve as the events coordinator for <a href="https://pittcsc.org/" target="_blank" rel="noopener noreferrer">PittCSC</a> and Pitt's <a href="https://www.meetup.com/aws-cloud-club-at-university-of-pittsburgh/" target="_blank" rel="noopener noreferrer">AWS Student Builder Group</a>. In my free time, I read, write, play strategy games, bike, and learn new programming concepts.
            </p>
            <p className="previous-section">
              <span className="section-lead">Previously:</span>
              <span className="previous-entry">
                <span className="previous-role"><a href="https://textiris.com/" target="_blank" rel="noopener noreferrer">Iris (YC F25)</a> - Software Engineering Intern</span>
                <span className="previous-description">Built an AI assistant mobile app, tool-calling agent evals, and custom MCP integrations.</span>
              </span>
              <span className="previous-entry">
                <span className="previous-role"><a href="https://www.dmelift.com/" target="_blank" rel="noopener noreferrer">DME Elevators & Lifts</a> - Software Engineering Intern</span>
                <span className="previous-description">Cold-emailed a local business and was hired to refactor their website.</span>
              </span>
              <span className="previous-entry">
                <span className="previous-role"><a href="https://ruddervirt.com/" target="_blank" rel="noopener noreferrer">Ruddervirt</a> - Software Engineering Intern</span>
                <span className="previous-description">Developed virtual machine software used in classrooms and cybersecurity competitions.</span>
              </span>
            </p>
          </section>
        </div>

        <aside className="activity-panel">
          <h2>My Weekly Activity</h2>
          <div className="activity-groups">
            {activityError && <p className="page-message">{activityError}</p>}
            {Object.entries(activitiesByDate).map(([date, activities]) => (
              <section className="activity-date-group" key={date}>
                <h3>{date}</h3>
                <ul>
                  {activities.map((activity, index) => {
                    const description = getActivityDescription(activity);
                    const url = activity.type === 'leetcode' ? activity.solutionlink : activity.url;

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
                          {url ? (
                            <a href={url} target="_blank" rel="noopener noreferrer">{description}</a>
                          ) : (
                            <span>{description}</span>
                          )}
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

export default HomePage;
