import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Calendar, MapPin, Users, Sparkles, MessageCircle, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function EventDetail({ user, setUser }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [attendees, setAttendees] = useState([]);
  const [recommendedPeople, setRecommendedPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRegistered, setIsRegistered] = useState(false);
  const [icebreakers, setIcebreakers] = useState({});

  useEffect(() => {
    fetchEventDetails();
  }, [id]);

  const fetchEventDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const [eventRes, attendeesRes] = await Promise.all([
        axios.get(`${API}/events/${id}`),
        axios.get(`${API}/events/${id}/attendees`)
      ]);
      
      setEvent(eventRes.data);
      setAttendees(attendeesRes.data);
      setIsRegistered(eventRes.data.attendees.includes(user.id));
      
      if (eventRes.data.attendees.includes(user.id)) {
        fetchRecommendedPeople();
      }
    } catch (error) {
      toast.error('Failed to load event details');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommendedPeople = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API}/ai/recommend-people?event_id=${id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRecommendedPeople(response.data.recommendations || []);
    } catch (error) {
      console.error('Failed to load recommendations:', error);
    }
  };

  const handleRegister = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API}/events/${id}/register`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Registered successfully!');
      fetchEventDetails();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Registration failed');
    }
  };

  const handleConnect = async (otherUserId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API}/connections/request`,
        { user_id: otherUserId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Connected successfully!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Connection failed');
    }
  };

  const getIcebreaker = async (otherUser) => {
    if (icebreakers[otherUser.id]) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API}/ai/icebreaker`,
        {
          user1_name: user.name,
          user1_interests: user.interests,
          user2_name: otherUser.name,
          user2_interests: otherUser.interests
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setIcebreakers(prev => ({
        ...prev,
        [otherUser.id]: response.data.icebreaker
      }));
    } catch (error) {
      toast.error('Failed to generate icebreaker');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Navbar user={user} setUser={setUser} />
          <div className="text-center py-20 text-muted-foreground">Loading event...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Navbar user={user} setUser={setUser} />

        <Button
          data-testid="back-to-events-btn"
          onClick={() => navigate('/dashboard')}
          className="mb-6 bg-white/10 hover:bg-white/20 border border-white/10 text-white rounded-full"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Events
        </Button>

        {/* Event Header */}
        <div className="glass-panel overflow-hidden mb-8" data-testid="event-detail">
          {event.image_url && (
            <div className="h-96 overflow-hidden">
              <img
                src={event.image_url}
                alt={event.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="p-8">
            <Badge className="mb-4 bg-violet-600 text-lg px-4 py-1">{event.category}</Badge>
            <h1 className="text-4xl sm:text-5xl font-syne font-bold text-gradient mb-4">
              {event.title}
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              {event.description}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="flex items-center text-foreground">
                <Calendar className="h-6 w-6 mr-3 text-violet-400" />
                <div>
                  <div className="text-sm text-muted-foreground">Date</div>
                  <div className="font-bold">{event.date}</div>
                </div>
              </div>
              <div className="flex items-center text-foreground">
                <MapPin className="h-6 w-6 mr-3 text-violet-400" />
                <div>
                  <div className="text-sm text-muted-foreground">Location</div>
                  <div className="font-bold">{event.location}</div>
                </div>
              </div>
              <div className="flex items-center text-foreground">
                <Users className="h-6 w-6 mr-3 text-violet-400" />
                <div>
                  <div className="text-sm text-muted-foreground">Attendees</div>
                  <div className="font-bold">{attendees.length} people</div>
                </div>
              </div>
            </div>

            {!isRegistered && (
              <Button
                data-testid="register-event-btn"
                onClick={handleRegister}
                className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-8 py-6 text-lg rounded-full font-bold hover:scale-105 hover:shadow-[0_0_20px_rgba(139,92,246,0.4)] transition-all duration-300"
              >
                Register for Event
              </Button>
            )}
            {isRegistered && (
              <Badge className="bg-emerald-600 text-lg px-6 py-3">You're Registered!</Badge>
            )}
          </div>
        </div>

        {/* AI Recommended People */}
        {isRegistered && recommendedPeople.length > 0 && (
          <div className="glass-panel p-8 mb-8" data-testid="recommended-people-section">
            <div className="flex items-center mb-6">
              <Sparkles className="h-6 w-6 text-violet-400 mr-3" />
              <h2 className="text-2xl font-syne font-bold text-foreground">
                People You Should Meet
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {recommendedPeople.map((person) => (
                <div key={person.id} data-testid={`recommended-person-${person.id}`} className="glass-panel p-6">
                  <div className="flex items-center mb-4">
                    <Avatar className="h-12 w-12 mr-3">
                      <AvatarFallback className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white">
                        {person.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-bold text-foreground">{person.name}</div>
                      <div className="text-sm text-muted-foreground">{person.email}</div>
                    </div>
                  </div>
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
                  <div className="flex gap-2">
                    <Button
                      data-testid={`connect-${person.id}-btn`}
                      onClick={() => handleConnect(person.id)}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full"
                    >
                      Connect
                    </Button>
                    <Button
                      data-testid={`message-${person.id}-btn`}
                      onClick={() => navigate(`/messages/${person.id}`)}
                      className="flex-1 bg-violet-600 hover:bg-violet-700 text-white rounded-full"
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Message
                    </Button>
                  </div>
                  <Button
                    data-testid={`icebreaker-${person.id}-btn`}
                    onClick={() => getIcebreaker(person)}
                    className="w-full mt-2 bg-white/10 hover:bg-white/20 text-white rounded-full text-sm"
                  >
                    <Sparkles className="h-3 w-3 mr-2" />
                    Get Conversation Starter
                  </Button>
                  {icebreakers[person.id] && (
                    <div className="mt-3 p-3 bg-violet-600/20 rounded-lg text-sm text-foreground border border-violet-600/30">
                      {icebreakers[person.id]}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All Attendees */}
        {isRegistered && attendees.length > 0 && (
          <div className="glass-panel p-8" data-testid="attendees-section">
            <h2 className="text-2xl font-syne font-bold text-foreground mb-6">
              All Attendees ({attendees.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {attendees.map((person) => (
                <div key={person.id} data-testid={`attendee-${person.id}`} className="glass-panel p-4 flex items-center justify-between">
                  <div className="flex items-center">
                    <Avatar className="h-10 w-10 mr-3">
                      <AvatarFallback className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white">
                        {person.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-bold text-foreground">{person.name}</div>
                      <div className="text-sm text-muted-foreground">{person.email}</div>
                    </div>
                  </div>
                  {person.id !== user.id && (
                    <Button
                      data-testid={`message-attendee-${person.id}-btn`}
                      onClick={() => navigate(`/messages/${person.id}`)}
                      size="sm"
                      className="bg-violet-600 hover:bg-violet-700 text-white rounded-full"
                    >
                      <MessageCircle className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}