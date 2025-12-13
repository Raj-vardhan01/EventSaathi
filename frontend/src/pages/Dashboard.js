import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Users, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Dashboard({ user, setUser }) {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState([]);

  const categories = ['all', 'Hackathon', 'Conference', 'Meetup', 'Workshop', 'Networking'];

  useEffect(() => {
    fetchEvents();
    if (user.interests && user.interests.length > 0) {
      fetchRecommendations();
    }
  }, []);

  useEffect(() => {
    if (selectedCategory === 'all') {
      setFilteredEvents(events);
    } else {
      setFilteredEvents(events.filter(e => e.category === selectedCategory));
    }
  }, [selectedCategory, events]);

  const fetchEvents = async () => {
    try {
      const response = await axios.get(`${API}/events`);
      setEvents(response.data);
      setFilteredEvents(response.data);
    } catch (error) {
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommendations = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API}/ai/recommend-events`,
        { user_interests: user.interests },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRecommendations(response.data.recommendations || []);
    } catch (error) {
      console.error('Failed to load recommendations:', error);
    }
  };

  const seedEvents = async () => {
    try {
      await axios.post(`${API}/seed/events`);
      toast.success('Sample events created!');
      fetchEvents();
    } catch (error) {
      toast.error('Failed to seed events');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Navbar user={user} setUser={setUser} />

        {/* Header */}
        <div className="mb-12">
          <h1 className="text-5xl font-syne font-bold text-gradient mb-4">
            Discover Events
          </h1>
          <p className="text-xl text-muted-foreground">
            Find your next adventure and connect with amazing people
          </p>
        </div>

        {/* AI Recommendations */}
        {recommendations.length > 0 && (
          <div className="glass-panel p-8 mb-12" data-testid="ai-recommendations-section">
            <div className="flex items-center mb-6">
              <Sparkles className="h-6 w-6 text-violet-400 mr-3" />
              <h2 className="text-2xl font-syne font-bold text-foreground">
                AI Recommendations for You
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {recommendations.map((event) => (
                <div
                  key={event.id}
                  data-testid={`recommended-event-${event.id}`}
                  onClick={() => navigate(`/events/${event.id}`)}
                  className="glass-panel p-6 card-hover cursor-pointer"
                >
                  <Badge className="mb-3 bg-violet-600">{event.category}</Badge>
                  <h3 className="text-lg font-bold text-foreground mb-2">{event.title}</h3>
                  <div className="flex items-center text-sm text-muted-foreground mb-2">
                    <Calendar className="h-4 w-4 mr-2" />
                    {event.date}
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Users className="h-4 w-4 mr-2" />
                    {event.attendees?.length || 0} attending
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Category Filter */}
        <div className="flex flex-wrap gap-3 mb-8" data-testid="category-filter">
          {categories.map((category) => (
            <Button
              key={category}
              data-testid={`category-${category.toLowerCase()}`}
              onClick={() => setSelectedCategory(category)}
              className={`rounded-full transition-all duration-300 ${
                selectedCategory === category
                  ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white'
                  : 'bg-white/10 hover:bg-white/20 text-foreground'
              }`}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </Button>
          ))}
        </div>

        {/* Events Grid */}
        {loading ? (
          <div className="text-center py-20">
            <div className="text-xl text-muted-foreground">Loading events...</div>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-20" data-testid="no-events-message">
            <div className="glass-panel p-12 max-w-md mx-auto">
              <p className="text-xl text-muted-foreground mb-6">
                No events found. Create some sample events to get started!
              </p>
              <Button
                data-testid="seed-events-btn"
                onClick={seedEvents}
                className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-8 py-6 rounded-full font-bold hover:scale-105 transition-all duration-300"
              >
                Create Sample Events
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" data-testid="events-grid">
            {filteredEvents.map((event) => (
              <div
                key={event.id}
                data-testid={`event-card-${event.id}`}
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
                  <Badge className="mb-3 bg-violet-600">{event.category}</Badge>
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
