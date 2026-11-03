import { useEffect, useState } from 'react';
import projects from '../data/projects';
import useTheme from '../hooks/useTheme';

const navigation = [
    ['Home', '/'],
    ['Projects', '/projects'],
    ['Videos', '/videos'],
    ['Writings', '/writings'],
    ['Readings', '/readings'],
    ['Book Time With Me', 'https://cal.com/prestonpro/chat'],
];

function ProjectsPage() {
    const { darkMode, themeWasToggled, toggleTheme } = useTheme();
    const [selectedImage, setSelectedImage] = useState(null);

    useEffect(() => {
        if (!selectedImage) {
            return undefined;
        }

        const closeOnEscape = (event) => {
            if (event.key === 'Escape') {
                setSelectedImage(null);
            }
        };

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        window.addEventListener('keydown', closeOnEscape);

        return () => {
            document.body.style.overflow = previousOverflow;
            window.removeEventListener('keydown', closeOnEscape);
        };
    }, [selectedImage]);

    return (
        <div className="site-shell" id="projects">
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

            <main className="projects-page">
                <h1>Projects</h1>

                {projects.length === 0 ? (
                    <p className="projects-message">No projects to display.</p>
                ) : (
                    <div className="projects-grid">
                        {projects.map((project) => (
                            <article
                                className={`project-card${project.image ? '' : ' project-card-no-image'}`}
                                key={project.title}
                            >
                                {project.image && (
                                    <button
                                        className="project-image-button"
                                        type="button"
                                        onClick={() => setSelectedImage(project.image)}
                                    >
                                        <img className="project-image" src={project.image} alt="" />
                                    </button>
                                )}

                                <div className="project-details">
                                    <div className="project-card-header">
                                        <div className="project-title-links">
                                            <h2>{project.title}</h2>

                                            {project.links?.length > 0 && (
                                                <div className="project-links">
                                                    {project.links.map(({ label, href }) => {
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
                                            )}
                                        </div>
                                        <span className="project-status">{project.status}</span>
                                    </div>

                                    <p className="project-description">{project.description}</p>

                                    {project.technologies?.length > 0 && (
                                        <p className="project-technologies">
                                            {project.technologies.join(', ')}
                                        </p>
                                    )}
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </main>

            {selectedImage && (
                <div className="project-image-overlay" onClick={() => setSelectedImage(null)}>
                    <div className="project-image-dialog" onClick={(event) => event.stopPropagation()}>
                        <button type="button" onClick={() => setSelectedImage(null)}>Close</button>
                        <img className="project-image-expanded" src={selectedImage} alt="" />
                    </div>
                </div>
            )}
        </div>
    );
}

export default ProjectsPage;
