import { useEffect, useState } from 'react';
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

const statusOrder = [
    'Currently Reading',
    'Want to Read',
    'Read',
    'Paused',
    'Did Not Finish',
];

const dateFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
});

function formatDate(date) {
    return dateFormatter.format(new Date(date)).replaceAll('/', '.');
}

function ReadingsPage() {
    const [books, setBooks] = useState([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const { darkMode, themeWasToggled, toggleTheme } = useTheme();

    useEffect(() => {
        fetch(`${API_URL}/readings`)
            .then((response) => {
                if (!response.ok) {
                    throw new Error('Failed to load readings');
                }

                return response.json();
            })
            .then(setBooks)
            .catch((fetchError) => {
                console.error(fetchError);
                setError('Unable to load readings.');
            })
            .finally(() => setLoading(false));
    }, []);

    const booksByStatus = books.reduce((groups, book) => {
        const status = book.status || 'Other';

        if (!groups[status]) {
            groups[status] = [];
        }

        groups[status].push(book);
        return groups;
    }, {});

    const statuses = [
        ...statusOrder.filter((status) => booksByStatus[status]),
        ...Object.keys(booksByStatus).filter((status) => !statusOrder.includes(status)),
    ];

    return (
        <div className="site-shell" id="readings">
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

            <main className="readings-page">
                <h1>Readings</h1>

                {loading && <p className="readings-message">Loading readings...</p>}
                {!loading && error && <p className="readings-message">{error}</p>}
                {!loading && !error && books.length === 0 && <p className="readings-message">No books to display.</p>}

                {statuses.map((status) => (
                    <section className="reading-section" key={status}>
                        <h2>{status}</h2>
                        <div className="book-grid">
                            {booksByStatus[status].map((book) => (
                                <article className="book-card" key={book.id}>
                                    <a href={book.url} target="_blank" rel="noopener noreferrer">
                                        {book.image ? (
                                            <img className="book-cover" src={book.image} alt="" />
                                        ) : (
                                            <span className="book-cover book-cover-placeholder">No cover</span>
                                        )}
                                    </a>

                                    <div className="book-details">
                                        <h3>
                                            <a href={book.url} target="_blank" rel="noopener noreferrer">
                                                {book.title}
                                            </a>
                                        </h3>
                                        <p>{book.author}</p>
                                        {book.startedAt && <p>Started {formatDate(book.startedAt)}</p>}
                                        {book.pages && <p>{book.pages} pages</p>}
                                        {book.progressPages !== null && book.progressPages !== undefined && (
                                            <p>{book.progressPages} pages read</p>
                                        )}
                                        {book.finishedAt && <p>Finished {formatDate(book.finishedAt)}</p>}
                                        {book.progressPages !== null && book.progressPages !== undefined && book.pages > 0 && (
                                            <div className="book-progress">
                                                <span
                                                    style={{
                                                        width: `${Math.min(100, Math.max(0, (book.progressPages / book.pages) * 100))}%`
                                                    }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </article>
                            ))}
                        </div>
                    </section>
                ))}
            </main>
        </div>
    );
}

export default ReadingsPage;
