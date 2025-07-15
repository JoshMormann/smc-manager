import { Theme, Container } from './types';

// Get theme settings from environment variables or use defaults
const injectedTheme: string = import.meta.env.VITE_DEFAULT_THEME || 'light';
const injectedContainer: string = import.meta.env.VITE_DEFAULT_CONTAINER || 'none';

let theme: Theme = 'light';
let container: Container = 'none';

if (injectedTheme === 'light' || injectedTheme === 'dark') {
  theme = injectedTheme as Theme;
}
if (injectedContainer === 'centered' || injectedContainer === 'none') {
  container = injectedContainer as Container;
}

export default {
  theme,
  container,
};
