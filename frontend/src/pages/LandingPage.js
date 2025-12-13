import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sparkles, Users, MessageCircle, Zap } from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center space-y-8">
            <div className="inline-block" data-testid="logo">
              <h1 className="text-6xl sm:text-7xl lg:text-8xl font-syne font-bold text-gradient mb-4">
                SAATHI
              </h1>
            </div>
            
            <p className="text-xl sm:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Never attend an event alone again. Connect with like-minded people before you go.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
              <Button 
                data-testid="get-started-btn"
                onClick={() => navigate('/auth')} 
                className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-8 py-6 text-lg rounded-full font-bold hover:scale-105 hover:shadow-[0_0_20px_rgba(139,92,246,0.4)] transition-all duration-300"
              >
                Get Started <Sparkles className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                data-testid="learn-more-btn"
                onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}
                className="bg-white/10 backdrop-blur-md border border-white/10 hover:bg-white/20 text-white px-8 py-6 text-lg rounded-full font-bold transition-all duration-300"
              >
                Learn More
              </Button>
            </div>
          </div>

          {/* Hero Image */}
          <div className="mt-16 relative">
            <div className="glass-panel overflow-hidden">
              <img 
                src="https://images.unsplash.com/photo-1761063198886-f485556ed341?crop=entropy&cs=srgb&fm=jpg&q=85" 
                alt="Event networking" 
                className="w-full h-96 object-cover"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-4xl sm:text-5xl font-syne font-bold text-center mb-16 text-gradient">
          Why SAATHI?
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="glass-panel p-8 card-hover" data-testid="feature-discover">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 flex items-center justify-center mb-6">
              <Users className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-2xl font-syne font-bold mb-4 text-foreground">Discover Events</h3>
            <p className="text-muted-foreground leading-relaxed">
              Browse hackathons, conferences, meetups, and workshops. Filter by category and find events that match your interests.
            </p>
          </div>

          <div className="glass-panel p-8 card-hover" data-testid="feature-connect">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 flex items-center justify-center mb-6">
              <MessageCircle className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-2xl font-syne font-bold mb-4 text-foreground">Connect Before Events</h3>
            <p className="text-muted-foreground leading-relaxed">
              See who's attending and start conversations before the event. Break the ice and make meaningful connections.
            </p>
          </div>

          <div className="glass-panel p-8 card-hover" data-testid="feature-ai">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-rose-600 to-pink-600 flex items-center justify-center mb-6">
              <Zap className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-2xl font-syne font-bold mb-4 text-foreground">AI-Powered Matching</h3>
            <p className="text-muted-foreground leading-relaxed">
              Get smart recommendations for events and people based on your interests. AI-generated conversation starters help you connect easily.
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="glass-panel p-12 text-center">
          <h2 className="text-4xl sm:text-5xl font-syne font-bold mb-6 text-gradient">
            Ready to Connect?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join hundreds of people who are making meaningful connections at events.
          </p>
          <Button 
            data-testid="cta-get-started-btn"
            onClick={() => navigate('/auth')} 
            className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-10 py-6 text-lg rounded-full font-bold hover:scale-105 hover:shadow-[0_0_20px_rgba(139,92,246,0.4)] transition-all duration-300"
          >
            Get Started Now <Sparkles className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-white/10 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-muted-foreground">
          <p>&copy; 2025 EventConnect. Built for VibeHack Days 2025.</p>
        </div>
      </div>
    </div>
  );
}