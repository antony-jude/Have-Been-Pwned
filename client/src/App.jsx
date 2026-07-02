import { useEffect, useState } from 'react';
import Analyzer from './components/Analyzer';

function App() {
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('hibp-theme');
    if (savedTheme) return savedTheme;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('hibp-theme', theme);
  }, [theme]);

  return (
    <div className="app-shell min-h-screen flex flex-col justify-between">
      <nav className="topbar" aria-label="Main navigation">
        <a className="brand" href="#top" aria-label="Have I Been Pwned home">
          <span className="brand-mark" aria-hidden="true"><i></i><i></i><i></i></span>
          <span>HavePwned</span>
        </a>
        <div className="nav-links">
          <a href="#password-scan">Password check</a>
          <a href="#email-scan">Email scan</a>
          <a href="#security-insights">Security insights</a>
        </div>
        <button
          className="theme-toggle"
          type="button"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
        >
          <span className="theme-icon" aria-hidden="true">{theme === 'dark' ? '☀' : '☾'}</span>
          <span className="theme-label">{theme === 'dark' ? 'Light' : 'Dark'}</span>
        </button>
      </nav>
      <main className="flex-grow">
        <Analyzer />
      </main>
      <footer className="site-footer text-center text-xs text-slate-500">
        &copy; {new Date().getFullYear()} Have I Been Pwned? &middot; Privacy-first security analysis.
      </footer>
    </div>
  );
}

export default App;
