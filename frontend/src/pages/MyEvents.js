import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '@/components/Navbar';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Users } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function MyEvents({ user, setUser }) {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyEvents();
  }, []);

  const fetchMyEvents = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/events/my-events/list`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEvents(response.data);
    } catch (error) {
      toast.error('Failed to load your events');
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
            My Events
          </h1>
          <p className="text-xl text-muted-foreground">
            Events you're registered for
          </p>
        </div>

        {loading ? (
          <div className="text-center py-20 text-muted-foreground">Loading your events...</div>
        ) : events.length === 0 ? (
          <div className="text-center py-20" data-testid="no-events-registered">
            <div className="glass-panel p-12 max-w-md mx-auto">
              <p className="text-xl text-muted-foreground mb-6">
                You haven't registered for any events yet.
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" data-testid="my-events-grid">
            {events.map((event) => (
              <div
                key={event.id}
                data-testid={`my-event-${event.id}`}
                onClick={() => navigate(`/events/${event.id}`)}
                className="glass-panel overflow-hidden card-hover cursor-pointer group"
              >
                {event.image_url && (
                  <div className="h-48 overflow-hidden">
                    <img
                      src={event.image_url}
                      alt={event.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                )}
                <div className="p-6">
                  <Badge className="mb-3 bg-emerald-600">Registered</Badge>
                  <Badge className="mb-3 ml-2 bg-violet-600">{event.category}</Badge>
                  <h3 className="text-xl font-syne font-bold text-foreground mb-3">
                    {event.title}
                  </h3>
                  <p className="text-muted-foreground mb-4 line-clamp-2">
                    {event.description}
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4 mr-2 text-violet-400" />
                      {event.date}
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4 mr-2 text-violet-400" />
                      {event.location}
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Users className="h-4 w-4 mr-2 text-violet-400" />
                      {event.attendees?.length || 0} people attending
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}