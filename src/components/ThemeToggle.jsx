import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext.jsx';
import { cx } from '../lib/ui.js';

/**
 * Compact light/dark switch used in the site header and admin console.
 * `showLabel` renders the current mode next to the icon (admin header).
 */
export function ThemeToggle({ showLabel = false, className }) {
  const { isDark, toggleTheme } = useTheme();
  const next = isDark ? 'light' : 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${next} mode`}
      title={`Switch to ${next} mode`}
      aria-pressed={!isDark}
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-md border border-ink-700 bg-ink-900 text-stone transition hover:border-champagne-400/50 hover:text-champagne-200',
        showLabel ? 'h-9 px-3 text-xs' : 'h-[30px] w-[30px]',
        className
      )}
    >
      {isDark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
      {showLabel && <span>{isDark ? 'Light mode' : 'Dark mode'}</span>}
    </button>
  );
}
