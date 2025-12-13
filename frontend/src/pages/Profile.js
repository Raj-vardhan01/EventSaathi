import React, { useState } from 'react';
import axios from 'axios';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Save } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Profile({ user, setUser }) {
  const [formData, setFormData] = useState({
    name: user.name || '',
    email: user.email || '',
    bio: user.bio || '',
    interests: user.interests ? user.interests.join(', ') : ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const payload = {
        name: formData.name,
        email: formData.email,
        bio: formData.bio,
        interests: formData.interests.split(',').map(i => i.trim()).filter(i => i),
        profile_pic: user.profile_pic || ''
      };

      const response = await axios.put(
        `${API}/users/profile`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const updatedUser = response.data;
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Navbar user={user} setUser={setUser} />

        <div className="mb-12">
          <h1 className="text-5xl font-syne font-bold text-gradient mb-4">
            Your Profile
          </h1>
          <p className="text-xl text-muted-foreground">
            Update your information to help others connect with you
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Preview */}
          <div className="glass-panel p-8" data-testid="profile-preview">
            <div className="text-center">
              <Avatar className="h-32 w-32 mx-auto mb-6">
                <AvatarFallback className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-4xl">
                  {user.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <h2 className="text-2xl font-syne font-bold text-foreground mb-2">{user.name}</h2>
              <p className="text-muted-foreground mb-4">{user.email}</p>
              {user.bio && (
                <p className="text-foreground mb-6">{user.bio}</p>
              )}
              {user.interests && user.interests.length > 0 && (
                <div>
                  <div className="text-sm text-muted-foreground mb-3">Interests</div>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {user.interests.map((interest, idx) => (
                      <Badge key={idx} className="bg-violet-600/20 text-violet-300 border-violet-600/30">
                        {interest}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Edit Form */}
          <div className="lg:col-span-2 glass-panel p-8">
            <h2 className="text-2xl font-syne font-bold text-foreground mb-6">Edit Profile</h2>
            <form onSubmit={handleSubmit} className="space-y-6" data-testid="profile-form">
              <div>
                <Label htmlFor="name" className="text-foreground">Full Name</Label>
                <Input
                  data-testid="profile-name-input"
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                  className="mt-2 bg-slate-900/50 border-white/10 focus:border-violet-500 rounded-xl h-12 text-foreground"
                />
              </div>

              <div>
                <Label htmlFor="email" className="text-foreground">Email</Label>
                <Input
                  data-testid="profile-email-input"
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                  className="mt-2 bg-slate-900/50 border-white/10 focus:border-violet-500 rounded-xl h-12 text-foreground"
                />
              </div>

              <div>
                <Label htmlFor="bio" className="text-foreground">Bio</Label>
                <Textarea
                  data-testid="profile-bio-input"
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData({...formData, bio: e.target.value})}
                  rows={4}
                  className="mt-2 bg-slate-900/50 border-white/10 focus:border-violet-500 rounded-xl text-foreground"
                  placeholder="Tell people about yourself..."
                />
              </div>

              <div>
                <Label htmlFor="interests" className="text-foreground">Interests (comma-separated)</Label>
                <Input
                  data-testid="profile-interests-input"
                  id="interests"
                  type="text"
                  value={formData.interests}
                  onChange={(e) => setFormData({...formData, interests: e.target.value})}
                  className="mt-2 bg-slate-900/50 border-white/10 focus:border-violet-500 rounded-xl h-12 text-foreground"
                  placeholder="AI, Blockchain, Startups, Design"
                />
              </div>

              <Button
                data-testid="save-profile-btn"
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white py-6 rounded-full font-bold hover:scale-105 hover:shadow-[0_0_20px_rgba(139,92,246,0.4)] transition-all duration-300"
              >
                <Save className="mr-2 h-5 w-5" />
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}