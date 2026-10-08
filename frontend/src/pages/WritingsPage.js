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

function SubstackEmbed({ title, url }) {
    const iframeRef = useRef(null);
    const [height, setHeight] = useState(470);
    const embedUrl = new URL(url);
    const publicationOrigin = embedUrl.origin;

    embedUrl.pathname = embedUrl.pathname.replace('/p/', '/embed/p/');
    embedUrl.searchParams.set('origin', window.location.origin);
    embedUrl.searchParams.set('fullURL', window.location.href);

    useEffect(() => {
        const updateHeight = (event) => {
            if (
                event.origin === publicationOrigin
                && event.source === iframeRef.current?.contentWindow
                && event.data.iframeHeight
            ) {
                setHeight(event.data.iframeHeight);
            }
        };

        window.addEventListener('message', updateHeight);
        return () => window.removeEventListener('message', updateHeight);
    }, [publicationOrigin]);

    return (
        <iframe
            ref={iframeRef}
            title={title}
            src={embedUrl.toString()}
            height={height}
            scrolling="no"
            sandbox="allow-scripts allow-same-origin allow-top-navigation allow-popups"
            allow="clipboard-read; clipboard-write"
        />
    );
}

function WritingsPage() {
    const [writings, setWritings] = useState([]);
    const [error, setError] = useState('');
    const { darkMode, themeWasToggled, toggleTheme } = useTheme();
    
    useEffect(() => {
        fetch(`${API_URL}/writings`)
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
            <main className="writings-page">
                <h1>Writings</h1>
                {error && <p className="page-message">{error}</p>}
                {writings.map((writing) => (
                    <article className="writing-entry" key={writing.url}>
                        <p className="entry-date">{formatPostedAt(writing.postedAt)}</p>
                        <div className="substack-post-embed">
                            <SubstackEmbed title={writing.title} url={writing.url} />
                        </div>
                    </article>
                ))}
            </main>
        </div>
    );
}

export default WritingsPage;
