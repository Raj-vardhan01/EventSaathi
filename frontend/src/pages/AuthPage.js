import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function AuthPage({ setUser }) {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    bio: '',
    interests: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/signup';
      const payload = isLogin 
        ? { email: formData.email, password: formData.password }
        : {
            email: formData.email,
            password: formData.password,
            name: formData.name,
            bio: formData.bio,
            interests: formData.interests.split(',').map(i => i.trim()).filter(i => i)
          };

      const response = await axios.post(`${API}${endpoint}`, payload);
      const { token, user } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);

      toast.success(isLogin ? 'Welcome back!' : 'Account created successfully!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Button
          data-testid="back-btn"
          onClick={() => navigate('/')}
          className="mb-6 bg-white/10 hover:bg-white/20 border border-white/10 text-white rounded-full"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>

        <div className="glass-panel p-8">
          <h1 className="text-4xl font-syne font-bold text-gradient mb-2">
            {isLogin ? 'Welcome Back' : 'Join EventConnect'}
          </h1>
          <p className="text-muted-foreground mb-8">
            {isLogin ? 'Login to continue your journey' : 'Create your account to get started'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-6" data-testid={isLogin ? 'login-form' : 'signup-form'}>
            {!isLogin && (
              <div>
                <Label htmlFor="name" className="text-foreground">Full Name</Label>
                <Input
                  data-testid="name-input"
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                  className="mt-2 bg-slate-900/50 border-white/10 focus:border-violet-500 rounded-xl h-12 text-foreground input-focus"
                  placeholder="John Doe"
                />
              </div>
            )}

            <div>
              <Label htmlFor="email" className="text-foreground">Email</Label>
              <Input
                data-testid="email-input"
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required
                className="mt-2 bg-slate-900/50 border-white/10 focus:border-violet-500 rounded-xl h-12 text-foreground input-focus"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <Label htmlFor="password" className="text-foreground">Password</Label>
              <Input
                data-testid="password-input"
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                required
                className="mt-2 bg-slate-900/50 border-white/10 focus:border-violet-500 rounded-xl h-12 text-foreground input-focus"
                placeholder="••••••••"
              />
            </div>

            {!isLogin && (
              <>
                <div>
                  <Label htmlFor="bio" className="text-foreground">Bio (Optional)</Label>
                  <Input
                    data-testid="bio-input"
                    id="bio"
                    type="text"
                    value={formData.bio}
                    onChange={(e) => setFormData({...formData, bio: e.target.value})}
                    className="mt-2 bg-slate-900/50 border-white/10 focus:border-violet-500 rounded-xl h-12 text-foreground input-focus"
                    placeholder="Tell us about yourself"
                  />
                </div>

                <div>
                  <Label htmlFor="interests" className="text-foreground">Interests (comma-separated)</Label>
                  <Input
                    data-testid="interests-input"
                    id="interests"
                    type="text"
                    value={formData.interests}
                    onChange={(e) => setFormData({...formData, interests: e.target.value})}
                    className="mt-2 bg-slate-900/50 border-white/10 focus:border-violet-500 rounded-xl h-12 text-foreground input-focus"
                    placeholder="AI, Blockchain, Startups"
                  />
                </div>
              </>
            )}

            <Button
              data-testid={isLogin ? 'login-submit-btn' : 'signup-submit-btn'}
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white py-6 rounded-full font-bold hover:scale-105 hover:shadow-[0_0_20px_rgba(139,92,246,0.4)] transition-all duration-300"
            >
              {loading ? 'Processing...' : (isLogin ? 'Login' : 'Sign Up')}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              data-testid="toggle-auth-mode-btn"
              onClick={() => setIsLogin(!isLogin)}
              className="text-violet-400 hover:text-violet-300 transition-colors"
            >
              {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Login'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}