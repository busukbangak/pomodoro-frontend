import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login, register as registerApi } from "../lib/api";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";

const Authentication: React.FC = () => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      if (mode === 'login') {
        await login(email, password);
        navigate("/");
      } else {
        await registerApi(email, password);
        setSuccess(true);
        setTimeout(() => {
          setMode('login');
          setSuccess(false);
        }, 1200);
      }
    } catch (err: unknown) {
      if (err && typeof err === "object" && "message" in err && typeof (err as { message?: unknown }).message === "string") {
        setError((err as { message: string }).message);
      } else {
        setError(mode === 'login' ? "Login failed" : "Registration failed");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader>
            <div className="flex gap-2 mb-2">
              <Button
                type="button"
                variant={mode === 'login' ? 'default' : 'ghost'}
                className="flex-1"
                onClick={() => { setMode('login'); setError(null); setSuccess(false); }}
                disabled={loading}
              >
                Login
              </Button>
              <Button
                type="button"
                variant={mode === 'register' ? 'default' : 'ghost'}
                className="flex-1"
                onClick={() => { setMode('register'); setError(null); setSuccess(false); }}
                disabled={loading}
              >
                Register
              </Button>
            </div>
            <CardTitle>{mode === 'login' ? 'Login to your account' : 'Register'}</CardTitle>
            <CardDescription>
              {mode === 'login' ? 'Enter your email below to login to your account' : 'Create a new account'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              <div className="grid gap-3">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoComplete="email"
                  disabled={loading}
                />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  disabled={loading}
                />
              </div>
              {error && <div className="text-destructive text-sm mt-1">{error}</div>}
              {success && mode === 'register' && <div className="text-green-600 text-sm mt-1">Registration successful! You can now log in.</div>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (mode === 'login' ? 'Logging in...' : 'Registering...') : (mode === 'login' ? 'Login' : 'Register')}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Authentication; 