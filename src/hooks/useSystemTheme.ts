import { useState, useEffect } from 'react';

export type Theme = 'light' | 'dark';

export const useSystemTheme = () => {
  const [theme, setTheme] = useState<Theme>(() => {
    // Check if we're in the browser
    if (typeof window === 'undefined') return 'light';
    
    // Check system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    // Only run in browser
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      setTheme(e.matches ? 'dark' : 'light');
    };

    // Listen for changes
    mediaQuery.addEventListener('change', handleChange);
    
    // Cleanup
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return theme;
};