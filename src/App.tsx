import { useMemo, useEffect, lazy, Suspense } from 'react';
import themeSettings from './settings/theme';
import { Theme } from './settings/types';
import { AuthProvider } from './contexts/AuthContext';
import { AuthGate } from './components/auth/AuthGate';
import { useSystemTheme } from './hooks/useSystemTheme';

// Lazy load the main dashboard for better initial load performance
const SREFManagementDashboard = lazy(() => import('./components/generated/SREFManagementDashboard.tsx'));

function App() {
  const systemTheme = useSystemTheme();
  
  function setTheme(theme: Theme) {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  // Use system theme instead of static theme
  useEffect(() => {
    setTheme(systemTheme);
  }, [systemTheme]);

  const generatedComponent = useMemo(() => {
    // THIS IS WHERE THE TOP LEVEL GENRATED COMPONENT WILL BE RETURNED!
    return (
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      }>
        <SREFManagementDashboard /> {/* %EXPORT_STATEMENT% */}
      </Suspense>
    );
  }, []);

  const appContent = themeSettings.container === 'centered' ? (
    <div className="h-full w-full flex flex-col items-center justify-center">
      {generatedComponent}
    </div>
  ) : (
    generatedComponent
  );

  return (
    <AuthProvider>
      <AuthGate>
        {appContent}
      </AuthGate>
    </AuthProvider>
  );
}

export default App;
