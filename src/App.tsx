import { useMemo, useEffect } from 'react';
import themeSettings from './settings/theme';
import { Theme } from './settings/types';
import SREFManagementDashboard from './components/generated/SREFManagementDashboard.tsx';
import { AuthProvider } from './contexts/AuthContext';
import { AuthGate } from './components/auth/AuthGate';
import { useSystemTheme } from './hooks/useSystemTheme';

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
    return <SREFManagementDashboard /> // %EXPORT_STATEMENT%
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
