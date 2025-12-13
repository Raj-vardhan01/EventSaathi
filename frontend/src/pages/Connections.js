import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MessageCircle } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Connections({ user, setUser }) {
  const navigate = useNavigate();
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConnections();
  }, []);

  const fetchConnections = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/connections`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConnections(response.data);
    } catch (error) {
      toast.error('Failed to load connections');
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
            Your Connections
          </h1>
          <p className="text-xl text-muted-foreground">
            People you've connected with at events
          </p>
        </div>

        {loading ? (
          <div className="text-center py-20 text-muted-foreground">Loading connections...</div>
        ) : connections.length === 0 ? (
          <div className="text-center py-20" data-testid="no-connections">
            <div className="glass-panel p-12 max-w-md mx-auto">
              <p className="text-xl text-muted-foreground mb-6">
                You haven't made any connections yet. Attend events and connect with people!
              </p>
              <button
                data-testid="browse-events-btn"
                onClick={() => navigate('/dashboard')}
                className="text-violet-400 hover:text-violet-300 transition-colors font-bold"
              >
                Browse Events
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="connections-grid">
            {connections.map((person) => (
              <div key={person.id} data-testid={`connection-${person.id}`} className="glass-panel p-6">
                <div className="flex items-center mb-4">
                  <Avatar className="h-16 w-16 mr-4">
                    <AvatarFallback className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xl">
                      {person.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="font-bold text-lg text-foreground">{person.name}</div>
                    <div className="text-sm text-muted-foreground">{person.email}</div>
                  </div>
                </div>

                {person.bio && (
                  <p className="text-muted-foreground mb-4 text-sm">{person.bio}</p>
                )}

                {person.interests && person.interests.length > 0 && (
                  <div className="mb-4">
                    <div className="text-sm text-muted-foreground mb-2">Interests:</div>
                    <div className="flex flex-wrap gap-2">
                      {person.interests.map((interest, idx) => (
                        <Badge key={idx} className="bg-violet-600/20 text-violet-300 border-violet-600/30">
                          {interest}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <Button
                  data-testid={`message-connection-${person.id}-btn`}
                  onClick={() => navigate(`/messages/${person.id}`)}
                  className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-full font-bold hover:scale-105 transition-all duration-300"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Send Message
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}