import { useEffect, useState } from 'react';

function getInitialDarkMode() {
    const wasToggled = window.localStorage.getItem('themeWasToggled') === 'true';

    if (wasToggled) {
        return window.localStorage.getItem('theme') === 'dark';
    }

    return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function useTheme() {
    const [darkMode, setDarkMode] = useState(getInitialDarkMode);
    const [themeWasToggled, setThemeWasToggled] = useState(
        () => window.localStorage.getItem('themeWasToggled') === 'true'
    );

    useEffect(() => {
        document.body.classList.toggle('dark-mode', darkMode);
        window.localStorage.setItem('theme', darkMode ? 'dark' : 'light');

        return () => {
            document.body.classList.remove('dark-mode');
        };
    }, [darkMode]);

    const toggleTheme = () => {
        setDarkMode((currentMode) => !currentMode);
        setThemeWasToggled(true);
        window.localStorage.setItem('themeWasToggled', 'true');
    };

    return { darkMode, themeWasToggled, toggleTheme };
}

export default useTheme;
