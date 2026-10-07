import { useEffect, useState } from 'react';
import useTheme from '../hooks/useTheme';

const navigation = [
    ['Home', '/'],
    ['Projects', '/projects'],
    ['Videos', '/videos'],
    ['Writings', '/writings'],
    ['Readings', '/readings'],
    ['Book Time With Me', 'https://cal.com/prestonpro/chat'],
];

const dateFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    month: '2-digit',
    day: '2-digit',
    year: 'numeric'
});

const timeFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
});

function formatPostedAt(postedAt) {
    const datetime = new Date(postedAt);
    const date = dateFormatter.format(datetime).replaceAll('/', '.');
    const time = timeFormatter.format(datetime).replaceAll(' ', '').toLowerCase();

    return `${date}, ${time} ET`;
}

function VideosPage() {
    const [videos, setVideos] = useState([]);
    const [error, setError] = useState('');
    const { darkMode, themeWasToggled, toggleTheme } = useTheme();
    
    useEffect(() => {
      fetch('http://localhost:8080/videos')
          .then((response) => {
              if (!response.ok) {
                  throw new Error('Failed to load videos');
              }

              return response.json();
          })
          .then(setVideos)
          .catch((fetchError) => {
              console.error(fetchError);
              setError('Unable to load videos.');
          });
    }, []);

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
                    <button
                        className={`theme-toggle${themeWasToggled ? ' toggled' : ''}`}
                        type="button"
                        onClick={toggleTheme}
                    >
                        {darkMode ? 'Light Mode' : 'Dark Mode'}
                    </button>
                </div>
            </nav>
            <main className="videos-page">
                <h1>Videos</h1>
                {error && <p className="page-message">{error}</p>}
                {videos.map((video) => (
                    <article className="video-entry" key={video.id}>
                        <p className="entry-date">{formatPostedAt(video.postedAt)}</p>
                        <iframe
                            title={video.title}
                            src={`https://www.youtube.com/embed/${video.id}`}
                            allowFullScreen
                        />
                    </article>
                ))}
            </main>
        </div>
    );
}

export default VideosPage;
