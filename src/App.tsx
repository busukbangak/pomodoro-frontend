import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import Pomodoro from './pages/Home';
import Stats from './pages/Stats';
import Settings from './pages/Settings';
import Authentication from './pages/Authentication';
import { Button } from './components/ui/button';
import { ThemeProvider } from './components/theme-provider';
import { ModeToggle } from './components/mode-toggle';
import { getToken, clearToken } from './lib/api';
import React from 'react';
import { Dialog, DialogContent } from './components/ui/dialog';
import { LogIn, LogOut } from 'lucide-react';

const navLinks = [
  { to: '/', label: 'Pomodoro' },
  { to: '/stats', label: 'Stats' },
  { to: '/settings', label: 'Settings' },
];

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = React.useState(Boolean(getToken()));
  const [authOpen, setAuthOpen] = React.useState(false);

  React.useEffect(() => {
    setIsLoggedIn(Boolean(getToken()));
  }, [location]);

  const handleSignOut = () => {
    clearToken();
    setIsLoggedIn(false);
    setAuthOpen(false);
    navigate('/');
  };

  const handleAuthSuccess = () => {
    setIsLoggedIn(true);
    setAuthOpen(false);
  };

  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <div className="min-h-svh flex flex-col bg-background">
        <nav className="flex gap-2 p-4 border-b bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/60 items-center">
          {navLinks.map((link) => (
            <Button
              key={link.to}
              asChild
              variant={location.pathname === link.to ? 'default' : 'ghost'}
              className="capitalize"
            >
              <Link to={link.to}>{link.label}</Link>
            </Button>
          ))}
          <div className="flex-1" />
          {!isLoggedIn && (
            <Button variant="outline" className="ml-2" onClick={() => setAuthOpen(true)} aria-label="Login or Register">
              <LogIn className="w-5 h-5" />
            </Button>
          )}
          {isLoggedIn && (
            <Button variant="outline" onClick={handleSignOut} className="ml-2" aria-label="Sign Out">
              <LogOut className="w-5 h-5" />
            </Button>
          )}
          <ModeToggle />
        </nav>
        <main className="flex-1 flex flex-col items-center justify-center p-4">
          <Routes>
            <Route path="/" element={<Pomodoro />} />
            <Route path="/stats" element={<Stats />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
        <Dialog open={authOpen} onOpenChange={setAuthOpen}>
          <DialogContent className="max-w-sm p-0">
            <Authentication setIsLoggedIn={setIsLoggedIn} onAuthSuccess={handleAuthSuccess} />
          </DialogContent>
        </Dialog>
      </div>
    </ThemeProvider>
  );
}

export default App;