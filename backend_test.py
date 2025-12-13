import requests
import sys
import json
from datetime import datetime

class EventConnectAPITester:
    def __init__(self, base_url="https://gathersync.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details
        })

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        
        if headers:
            test_headers.update(headers)

        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=10)

            success = response.status_code == expected_status
            details = f"Status: {response.status_code}"
            
            if not success:
                details += f" (Expected: {expected_status})"
                try:
                    error_data = response.json()
                    details += f" - {error_data.get('detail', 'Unknown error')}"
                except:
                    details += f" - {response.text[:100]}"

            self.log_test(name, success, details)
            
            if success:
                try:
                    return response.json()
                except:
                    return {}
            return None

        except Exception as e:
            self.log_test(name, False, f"Exception: {str(e)}")
            return None

    def test_auth_signup(self):
        """Test user signup"""
        timestamp = datetime.now().strftime('%H%M%S')
        signup_data = {
            "email": f"test_user_{timestamp}@test.com",
            "password": "TestPass123!",
            "name": f"Test User {timestamp}",
            "bio": "Test user for API testing",
            "interests": ["AI", "Blockchain", "Startups"]
        }
        
        result = self.run_test(
            "User Signup",
            "POST",
            "auth/signup",
            200,
            data=signup_data
        )
        
        if result and 'token' in result:
            self.token = result['token']
            self.user_id = result['user']['id']
            return True
        return False

    def test_auth_login(self):
        """Test user login with demo account"""
        login_data = {
            "email": "demo@test.com",
            "password": "demo123"
        }
        
        result = self.run_test(
            "User Login (Demo Account)",
            "POST",
            "auth/login",
            200,
            data=login_data
        )
        
        if result and 'token' in result:
            self.demo_token = result['token']
            self.demo_user_id = result['user']['id']
            return True
        return False

    def test_auth_me(self):
        """Test get current user"""
        result = self.run_test(
            "Get Current User",
            "GET",
            "auth/me",
            200
        )
        return result is not None

    def test_events_list(self):
        """Test get events list"""
        result = self.run_test(
            "Get Events List",
            "GET",
            "events",
            200
        )
        return result is not None

    def test_events_by_category(self):
        """Test get events by category"""
        categories = ["Hackathon", "Conference", "Meetup", "Workshop", "Networking"]
        
        for category in categories:
            result = self.run_test(
                f"Get Events - {category}",
                "GET",
                f"events?category={category}",
                200
            )
            if result is None:
                return False
        return True

    def test_seed_events(self):
        """Test seed events endpoint"""
        result = self.run_test(
            "Seed Events",
            "POST",
            "seed/events",
            200
        )
        return result is not None

    def test_event_registration(self):
        """Test event registration"""
        # First get an event
        events = self.run_test(
            "Get Events for Registration",
            "GET",
            "events",
            200
        )
        
        if not events or len(events) == 0:
            self.log_test("Event Registration", False, "No events available")
            return False
        
        event_id = events[0]['id']
        result = self.run_test(
            "Register for Event",
            "POST",
            f"events/{event_id}/register",
            200
        )
        
        if result:
            # Test getting my events
            my_events = self.run_test(
                "Get My Events",
                "GET",
                "events/my-events/list",
                200
            )
            return my_events is not None
        
        return False

    def test_event_attendees(self):
        """Test get event attendees"""
        # Get events first
        events = self.run_test(
            "Get Events for Attendees",
            "GET",
            "events",
            200
        )
        
        if not events or len(events) == 0:
            self.log_test("Get Event Attendees", False, "No events available")
            return False
        
        event_id = events[0]['id']
        result = self.run_test(
            "Get Event Attendees",
            "GET",
            f"events/{event_id}/attendees",
            200
        )
        return result is not None

    def test_user_profile_update(self):
        """Test update user profile"""
        update_data = {
            "email": f"updated_{self.user_id}@test.com",
            "name": "Updated Test User",
            "bio": "Updated bio for testing",
            "interests": ["AI", "Machine Learning", "Web3"]
        }
        
        result = self.run_test(
            "Update User Profile",
            "PUT",
            "users/profile",
            200,
            data=update_data
        )
        return result is not None

    def test_connections(self):
        """Test connections functionality"""
        # Try to connect with demo user if we have different user
        if hasattr(self, 'demo_user_id') and self.demo_user_id != self.user_id:
            connection_data = {"user_id": self.demo_user_id}
            
            result = self.run_test(
                "Create Connection",
                "POST",
                "connections/request",
                200,
                data=connection_data
            )
            
            if result:
                # Get connections
                connections = self.run_test(
                    "Get Connections",
                    "GET",
                    "connections",
                    200
                )
                return connections is not None
        
        # Just test getting connections
        result = self.run_test(
            "Get Connections",
            "GET",
            "connections",
            200
        )
        return result is not None

    def test_messages(self):
        """Test messaging functionality"""
        # Get conversations
        conversations = self.run_test(
            "Get Conversations",
            "GET",
            "messages/conversations",
            200
        )
        
        # Try to send a message if we have demo user
        if hasattr(self, 'demo_user_id') and self.demo_user_id != self.user_id:
            message_data = {
                "receiver_id": self.demo_user_id,
                "content": "Test message from API testing"
            }
            
            result = self.run_test(
                "Send Message",
                "POST",
                "messages/send",
                200,
                data=message_data
            )
            
            if result:
                # Get messages with demo user
                messages = self.run_test(
                    "Get Messages",
                    "GET",
                    f"messages/{self.demo_user_id}",
                    200
                )
                return messages is not None
        
        return conversations is not None

    def test_ai_features(self):
        """Test AI-powered features"""
        # Test event recommendations
        recommend_data = {
            "user_interests": ["AI", "Blockchain", "Startups"],
            "context": "Looking for networking events"
        }
        
        event_recommendations = self.run_test(
            "AI Event Recommendations",
            "POST",
            "ai/recommend-events",
            200,
            data=recommend_data
        )
        
        # Test icebreaker generation
        icebreaker_data = {
            "user1_name": "Alice",
            "user1_interests": ["AI", "Machine Learning"],
            "user2_name": "Bob",
            "user2_interests": ["Blockchain", "Web3"]
        }
        
        icebreaker = self.run_test(
            "AI Icebreaker Generation",
            "POST",
            "ai/icebreaker",
            200,
            data=icebreaker_data
        )
        
        # Test people recommendations (need event with attendees)
        events = self.run_test(
            "Get Events for People Recommendations",
            "GET",
            "events",
            200
        )
        
        if events and len(events) > 0:
            event_id = events[0]['id']
            people_recommendations = self.run_test(
                "AI People Recommendations",
                "POST",
                f"ai/recommend-people?event_id={event_id}",
                200
            )
            
            return all([event_recommendations, icebreaker, people_recommendations])
        
        return event_recommendations is not None and icebreaker is not None

    def run_all_tests(self):
        """Run comprehensive API tests"""
        print("🚀 Starting EventConnect API Testing...")
        print(f"Base URL: {self.base_url}")
        print("=" * 60)
        
        # Test authentication
        print("\n📝 Testing Authentication...")
        if not self.test_auth_signup():
            print("❌ Signup failed, stopping tests")
            return False
        
        self.test_auth_login()  # Test demo login separately
        self.test_auth_me()
        
        # Test events
        print("\n🎉 Testing Events...")
        self.test_seed_events()
        self.test_events_list()
        self.test_events_by_category()
        self.test_event_registration()
        self.test_event_attendees()
        
        # Test user profile
        print("\n👤 Testing User Profile...")
        self.test_user_profile_update()
        
        # Test connections
        print("\n🤝 Testing Connections...")
        self.test_connections()
        
        # Test messaging
        print("\n💬 Testing Messages...")
        self.test_messages()
        
        # Test AI features
        print("\n🤖 Testing AI Features...")
        self.test_ai_features()
        
        # Print summary
        print("\n" + "=" * 60)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        success_rate = (self.tests_passed / self.tests_run) * 100 if self.tests_run > 0 else 0
        print(f"Success Rate: {success_rate:.1f}%")
        
        if success_rate < 70:
            print("⚠️  Warning: Low success rate detected")
        elif success_rate >= 90:
            print("🎉 Excellent! Most tests passed")
        
        return success_rate >= 70

def main():
    tester = EventConnectAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())