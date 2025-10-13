import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock, Eye, EyeOff } from 'lucide-react';
import auteonLogo from '../assets/auteon-logo.jpg';

const LoginPage = ({ onLogin }) => {
  const [password, setPassword] = useState('');
  const [user, setUser] = useState('zf');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Simulate loading delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const success = await onLogin(password.trim(), (user || '').trim().toLowerCase());
    if (!success) {
      setError('Falsches Passwort. Bitte versuchen Sie es erneut.');
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[var(--brand-50)] via-background to-[var(--brand-50)] p-4">
      <div className="w-full max-w-md">
        {/* Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 mb-4 rounded-full border-4 shadow-sm overflow-hidden bg-white" style={{ borderColor: 'color-mix(in oklab, var(--action-500) 20%, transparent)' }}>
            <img src={auteonLogo} alt="auteon" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Daten-Sample</h1>

        </div>

        <Card className="shadow-lg" style={{ borderColor: '#F2F2F8' }}>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Anmeldung</CardTitle>

          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* User field first */}
              <label htmlFor="user" className="text-sm font-medium block text-gray-300 mb-1">Benutzer</label>
              <Input id="user" value={user} onChange={(e) => setUser(e.target.value)} placeholder="Benutzer (z. B. zf oder auteon)" />

              {/* Password field */}
              <label htmlFor="password" className="text-sm font-medium block text-gray-300 mb-1">Passwort</label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Passwort eingeben"
                  className="pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {error && (
                <div className="text-sm text-red-700 bg-red-50 border border-red-200 p-3 rounded-md">
                  {error}
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full" 
                variant={isLoading || !password.trim() ? "outline" : "default"}
                disabled={isLoading || !password.trim()}
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white/80 border-t-transparent rounded-full animate-spin" />
                    <span>Anmelden...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Lock size={16} />
                    <span>Anmelden</span>
                  </div>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="mt-4 text-center">
          <Link to="/?scrollTo=kontakt" className="text-sm text-[color:var(--action-500)] hover:underline">Kein Account? Jetzt Zugang zu Sample anfragen</Link>
        </div>

        <div className="mt-8 text-center text-xs text-gray-500">
          <p>© 2025 auteon GmbH. Alle Rechte vorbehalten.</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
