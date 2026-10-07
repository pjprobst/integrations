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

function WritingsPage() {
    const [writings, setWritings] = useState([]);
    const [error, setError] = useState('');
    const { darkMode, themeWasToggled, toggleTheme } = useTheme();
    
    useEffect(() => {
        fetch('http://localhost:8080/writings')
            .then((response) => {
                if (!response.ok) {
                    throw new Error('Failed to load writings');
                }

                return response.json();
            })
            .then(setWritings)
            .catch((fetchError) => {
                console.error(fetchError);
                setError('Unable to load writings.');
            });
    }, []);

    useEffect(() => {
        if (writings.length === 0) {
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://substack.com/embedjs/embed.js';
        script.async = true;
        document.body.appendChild(script);

        return () => {
            script.remove();
        };
    }, [writings]);

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
            <main className="writings-page">
                <h1>Writings</h1>
                {error && <p className="page-message">{error}</p>}
                {writings.map((writing) => (
                    <article className="writing-entry" key={writing.url}>
                        <p className="entry-date">{formatPostedAt(writing.postedAt)}</p>
                        <div className="substack-post-embed">
                            <a data-post-link="" href={writing.url}>{writing.title}</a>
                        </div>
                    </article>
                ))}
            </main>
        </div>
    );
}

export default WritingsPage;
