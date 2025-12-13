import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home, Calendar, Users, MessageCircle, User, LogOut } from 'lucide-react';
import { toast } from 'sonner';

export default function Navbar({ user, setUser }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    toast.success('Logged out successfully');
    navigate('/');
  };

  const navItems = [
    { path: '/dashboard', icon: Home, label: 'Discover' },
    { path: '/my-events', icon: Calendar, label: 'My Events' },
    { path: '/connections', icon: Users, label: 'Connections' },
    { path: '/messages', icon: MessageCircle, label: 'Messages' },
    { path: '/profile', icon: User, label: 'Profile' },
  ];

  return (
    <nav className="glass-panel mb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <h1 
              data-testid="nav-logo"
              onClick={() => navigate('/dashboard')} 
              className="text-2xl font-syne font-bold text-gradient cursor-pointer"
            >
              EventConnect
            </h1>
            
            <div className="hidden md:flex space-x-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Button
                    data-testid={`nav-${item.label.toLowerCase().replace(' ', '-')}`}
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className={`rounded-full transition-all duration-300 ${
                      isActive 
                        ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white' 
                        : 'bg-white/10 hover:bg-white/20 text-foreground'
                    }`}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {item.label}
                  </Button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="hidden sm:block text-foreground">
              Welcome, <span className="font-bold text-gradient">{user.name}</span>
            </div>
            <Button
              data-testid="logout-btn"
              onClick={handleLogout}
              className="bg-rose-600 hover:bg-rose-700 text-white rounded-full transition-all duration-300"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden flex overflow-x-auto space-x-2 pb-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Button
                data-testid={`nav-mobile-${item.label.toLowerCase().replace(' ', '-')}`}
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`rounded-full whitespace-nowrap transition-all duration-300 ${
                  isActive 
                    ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white' 
                    : 'bg-white/10 hover:bg-white/20 text-foreground'
                }`}
              >
                <Icon className="h-4 w-4 mr-2" />
                {item.label}
              </Button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}