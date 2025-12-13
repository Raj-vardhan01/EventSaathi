import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Messages({ user, setUser }) {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (userId && conversations.length > 0) {
      const user = conversations.find(c => c.id === userId);
      if (user) {
        selectUser(user);
      }
    }
  }, [userId, conversations]);

  const fetchConversations = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/messages/conversations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConversations(response.data);
    } catch (error) {
      toast.error('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const selectUser = async (user) => {
    setSelectedUser(user);
    fetchMessages(user.id);
  };

  const fetchMessages = async (otherUserId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/messages/${otherUserId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(response.data);
    } catch (error) {
      toast.error('Failed to load messages');
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser) return;

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API}/messages/send`,
        {
          receiver_id: selectedUser.id,
          content: newMessage
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setNewMessage('');
      fetchMessages(selectedUser.id);
    } catch (error) {
      toast.error('Failed to send message');
    }
  };

  const refreshMessages = () => {
    if (selectedUser) {
      fetchMessages(selectedUser.id);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Navbar user={user} setUser={setUser} />

        {selectedUser && (
          <Button
            data-testid="back-to-conversations-btn"
            onClick={() => {
              setSelectedUser(null);
              setMessages([]);
              navigate('/messages');
            }}
            className="mb-6 bg-white/10 hover:bg-white/20 border border-white/10 text-white rounded-full"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Conversations
          </Button>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Conversations List */}
          <div className={`glass-panel p-6 ${selectedUser ? 'hidden lg:block' : ''}`} data-testid="conversations-list">
            <h2 className="text-2xl font-syne font-bold text-foreground mb-6">
              Messages
            </h2>
            {loading ? (
              <div className="text-muted-foreground">Loading...</div>
            ) : conversations.length === 0 ? (
              <div className="text-muted-foreground" data-testid="no-conversations">
                <p className="mb-4">No conversations yet. Start connecting with people at events!</p>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="text-violet-400 hover:text-violet-300 transition-colors"
                >
                  Browse Events
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {conversations.map((person) => (
                  <div
                    key={person.id}
                    data-testid={`conversation-${person.id}`}
                    onClick={() => selectUser(person)}
                    className={`p-4 rounded-xl cursor-pointer transition-all duration-200 ${
                      selectedUser?.id === person.id
                        ? 'bg-violet-600/20 border border-violet-600/50'
                        : 'bg-white/5 hover:bg-white/10 border border-white/10'
                    }`}
                  >
                    <div className="flex items-center">
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
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Messages Panel */}
          <div className={`lg:col-span-2 glass-panel flex flex-col ${!selectedUser ? 'hidden lg:flex' : ''}`} data-testid="messages-panel">
            {!selectedUser ? (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                Select a conversation to start messaging
              </div>
            ) : (
              <>
                {/* Chat Header */}
                <div className="p-6 border-b border-white/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Avatar className="h-12 w-12 mr-3">
                        <AvatarFallback className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white">
                          {selectedUser.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-bold text-foreground text-lg">{selectedUser.name}</div>
                        <div className="text-sm text-muted-foreground">{selectedUser.email}</div>
                      </div>
                    </div>
                    <Button
                      data-testid="refresh-messages-btn"
                      onClick={refreshMessages}
                      className="bg-white/10 hover:bg-white/20 text-white rounded-full"
                    >
                      Refresh
                    </Button>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4" data-testid="messages-container">
                  {messages.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      No messages yet. Start the conversation!
                    </div>
                  ) : (
                    messages.map((msg) => (
                      <div
                        key={msg.id}
                        data-testid={`message-${msg.id}`}
                        className={`flex ${msg.sender_id === user.id ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                            msg.sender_id === user.id
                              ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white'
                              : 'bg-white/10 text-foreground'
                          }`}
                        >
                          <p>{msg.content}</p>
                          <p className="text-xs mt-1 opacity-70">
                            {new Date(msg.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Message Input */}
                <form onSubmit={sendMessage} className="p-6 border-t border-white/10">
                  <div className="flex gap-3">
                    <Input
                      data-testid="message-input"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 bg-slate-900/50 border-white/10 focus:border-violet-500 rounded-xl h-12 text-foreground"
                    />
                    <Button
                      data-testid="send-message-btn"
                      type="submit"
                      disabled={!newMessage.trim()}
                      className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-full px-6 hover:scale-105 transition-all duration-300"
                    >
                      <Send className="h-5 w-5" />
                    </Button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}