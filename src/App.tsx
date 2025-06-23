import { Routes, Route, Link, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import Stats from './pages/Stats';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Register from './pages/Register';
import { Card } from './components/ui/card';
import { Button } from './components/ui/button';
import { ThemeProvider } from './components/theme-provider';
import { ModeToggle } from './components/mode-toggle';

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/stats', label: 'Stats' },
  { to: '/settings', label: 'Settings' },
  { to: '/login', label: 'Login' },
  { to: '/register', label: 'Register' },
];

function App() {
  const location = useLocation();
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
          <ModeToggle />
        </nav>
        <main className="flex-1 flex flex-col items-center justify-center p-4">
          <Card className="max-w-xl p-8 shadow-lg">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/stats" element={<Stats />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
            </Routes>
          </Card>
        </main>
      </div>
    </ThemeProvider>
  );
}

export default App;