from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthCredential
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'your-secret-key-change-in-production')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 168  # 7 days

# Security
security = HTTPBearer()

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# ==================== MODELS ====================

class UserBase(BaseModel):
    email: EmailStr
    name: str
    bio: Optional[str] = ""
    interests: List[str] = []
    profile_pic: Optional[str] = ""

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(UserBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    bio: str
    interests: List[str]
    profile_pic: str

class TokenResponse(BaseModel):
    token: str
    user: UserResponse

class Event(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    category: str
    date: str
    location: str
    image_url: str = ""
    attendees: List[str] = []  # List of user IDs
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class EventCreate(BaseModel):
    title: str
    description: str
    category: str
    date: str
    location: str
    image_url: str = ""

class Message(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    conversation_id: str
    sender_id: str
    receiver_id: str
    content: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class MessageCreate(BaseModel):
    receiver_id: str
    content: str

class Connection(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user1_id: str
    user2_id: str
    status: str = "connected"  # connected
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ConnectionRequest(BaseModel):
    user_id: str

class AIRecommendRequest(BaseModel):
    user_interests: List[str]
    context: Optional[str] = ""

class AIIcebreakerRequest(BaseModel):
    user1_name: str
    user1_interests: List[str]
    user2_name: str
    user2_interests: List[str]

# ==================== HELPER FUNCTIONS ====================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str) -> str:
    payload = {
        "user_id": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthCredential = Depends(security)) -> str:
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("user_id")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        return user_id
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ==================== AUTH ROUTES ====================

@api_router.post("/auth/signup", response_model=TokenResponse)
async def signup(user_data: UserCreate):
    # Check if user exists
    existing = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    user_dict = user_data.model_dump()
    password = user_dict.pop('password')
    user_obj = User(**user_dict)
    
    doc = user_obj.model_dump()
    doc['password_hash'] = hash_password(password)
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.users.insert_one(doc)
    
    token = create_token(user_obj.id)
    return TokenResponse(
        token=token,
        user=UserResponse(
            id=user_obj.id,
            email=user_obj.email,
            name=user_obj.name,
            bio=user_obj.bio,
            interests=user_obj.interests,
            profile_pic=user_obj.profile_pic
        )
    )

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user or not verify_password(credentials.password, user['password_hash']):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    token = create_token(user['id'])
    return TokenResponse(
        token=token,
        user=UserResponse(
            id=user['id'],
            email=user['email'],
            name=user['name'],
            bio=user.get('bio', ''),
            interests=user.get('interests', []),
            profile_pic=user.get('profile_pic', '')
        )
    )

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(user_id: str = Depends(get_current_user)):
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return UserResponse(
        id=user['id'],
        email=user['email'],
        name=user['name'],
        bio=user.get('bio', ''),
        interests=user.get('interests', []),
        profile_pic=user.get('profile_pic', '')
    )

# ==================== EVENTS ROUTES ====================

@api_router.get("/events", response_model=List[Event])
async def get_events(category: Optional[str] = None):
    query = {}
    if category and category != "all":
        query["category"] = category
    
    events = await db.events.find(query, {"_id": 0}).to_list(1000)
    for event in events:
        if isinstance(event.get('created_at'), str):
            event['created_at'] = datetime.fromisoformat(event['created_at'])
    return events

@api_router.get("/events/{event_id}", response_model=Event)
async def get_event(event_id: str):
    event = await db.events.find_one({"id": event_id}, {"_id": 0})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    if isinstance(event.get('created_at'), str):
        event['created_at'] = datetime.fromisoformat(event['created_at'])
    return event

@api_router.post("/events", response_model=Event)
async def create_event(event_data: EventCreate, user_id: str = Depends(get_current_user)):
    event_obj = Event(**event_data.model_dump())
    doc = event_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.events.insert_one(doc)
    return event_obj

@api_router.post("/events/{event_id}/register")
async def register_for_event(event_id: str, user_id: str = Depends(get_current_user)):
    event = await db.events.find_one({"id": event_id}, {"_id": 0})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    attendees = event.get('attendees', [])
    if user_id in attendees:
        raise HTTPException(status_code=400, detail="Already registered")
    
    attendees.append(user_id)
    await db.events.update_one({"id": event_id}, {"$set": {"attendees": attendees}})
    
    return {"message": "Registered successfully", "event_id": event_id}

@api_router.get("/events/my-events/list", response_model=List[Event])
async def get_my_events(user_id: str = Depends(get_current_user)):
    events = await db.events.find({"attendees": user_id}, {"_id": 0}).to_list(1000)
    for event in events:
        if isinstance(event.get('created_at'), str):
            event['created_at'] = datetime.fromisoformat(event['created_at'])
    return events

@api_router.get("/events/{event_id}/attendees", response_model=List[UserResponse])
async def get_event_attendees(event_id: str):
    event = await db.events.find_one({"id": event_id}, {"_id": 0})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    attendee_ids = event.get('attendees', [])
    if not attendee_ids:
        return []
    
    users = await db.users.find({"id": {"$in": attendee_ids}}, {"_id": 0, "password_hash": 0}).to_list(1000)
    return [UserResponse(
        id=u['id'],
        email=u['email'],
        name=u['name'],
        bio=u.get('bio', ''),
        interests=u.get('interests', []),
        profile_pic=u.get('profile_pic', '')
    ) for u in users]

# ==================== USERS ROUTES ====================

@api_router.get("/users/{user_id}", response_model=UserResponse)
async def get_user_profile(user_id: str):
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return UserResponse(
        id=user['id'],
        email=user['email'],
        name=user['name'],
        bio=user.get('bio', ''),
        interests=user.get('interests', []),
        profile_pic=user.get('profile_pic', '')
    )

@api_router.put("/users/profile", response_model=UserResponse)
async def update_profile(profile: UserBase, user_id: str = Depends(get_current_user)):
    update_data = profile.model_dump()
    await db.users.update_one({"id": user_id}, {"$set": update_data})
    
    updated_user = await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})
    return UserResponse(
        id=updated_user['id'],
        email=updated_user['email'],
        name=updated_user['name'],
        bio=updated_user.get('bio', ''),
        interests=updated_user.get('interests', []),
        profile_pic=updated_user.get('profile_pic', '')
    )

# ==================== CONNECTIONS ROUTES ====================

@api_router.post("/connections/request")
async def create_connection(request: ConnectionRequest, user_id: str = Depends(get_current_user)):
    # Check if connection already exists
    existing = await db.connections.find_one({
        "$or": [
            {"user1_id": user_id, "user2_id": request.user_id},
            {"user1_id": request.user_id, "user2_id": user_id}
        ]
    }, {"_id": 0})
    
    if existing:
        raise HTTPException(status_code=400, detail="Connection already exists")
    
    connection = Connection(user1_id=user_id, user2_id=request.user_id)
    doc = connection.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.connections.insert_one(doc)
    return {"message": "Connected successfully"}

@api_router.get("/connections", response_model=List[UserResponse])
async def get_connections(user_id: str = Depends(get_current_user)):
    connections = await db.connections.find({
        "$or": [{"user1_id": user_id}, {"user2_id": user_id}]
    }, {"_id": 0}).to_list(1000)
    
    connected_user_ids = []
    for conn in connections:
        if conn['user1_id'] == user_id:
            connected_user_ids.append(conn['user2_id'])
        else:
            connected_user_ids.append(conn['user1_id'])
    
    if not connected_user_ids:
        return []
    
    users = await db.users.find({"id": {"$in": connected_user_ids}}, {"_id": 0, "password_hash": 0}).to_list(1000)
    return [UserResponse(
        id=u['id'],
        email=u['email'],
        name=u['name'],
        bio=u.get('bio', ''),
        interests=u.get('interests', []),
        profile_pic=u.get('profile_pic', '')
    ) for u in users]

# ==================== MESSAGES ROUTES ====================

@api_router.get("/messages/conversations")
async def get_conversations(user_id: str = Depends(get_current_user)):
    messages = await db.messages.find({
        "$or": [{"sender_id": user_id}, {"receiver_id": user_id}]
    }, {"_id": 0}).to_list(1000)
    
    # Get unique conversation partners
    partners = set()
    for msg in messages:
        if msg['sender_id'] == user_id:
            partners.add(msg['receiver_id'])
        else:
            partners.add(msg['sender_id'])
    
    if not partners:
        return []
    
    users = await db.users.find({"id": {"$in": list(partners)}}, {"_id": 0, "password_hash": 0}).to_list(1000)
    return [UserResponse(
        id=u['id'],
        email=u['email'],
        name=u['name'],
        bio=u.get('bio', ''),
        interests=u.get('interests', []),
        profile_pic=u.get('profile_pic', '')
    ) for u in users]

@api_router.get("/messages/{other_user_id}", response_model=List[Message])
async def get_messages(other_user_id: str, user_id: str = Depends(get_current_user)):
    messages = await db.messages.find({
        "$or": [
            {"sender_id": user_id, "receiver_id": other_user_id},
            {"sender_id": other_user_id, "receiver_id": user_id}
        ]
    }, {"_id": 0}).sort("timestamp", 1).to_list(1000)
    
    for msg in messages:
        if isinstance(msg.get('timestamp'), str):
            msg['timestamp'] = datetime.fromisoformat(msg['timestamp'])
    
    return messages

@api_router.post("/messages/send", response_model=Message)
async def send_message(message_data: MessageCreate, user_id: str = Depends(get_current_user)):
    # Generate conversation_id (consistent for both users)
    users = sorted([user_id, message_data.receiver_id])
    conversation_id = f"{users[0]}_{users[1]}"
    
    message = Message(
        conversation_id=conversation_id,
        sender_id=user_id,
        receiver_id=message_data.receiver_id,
        content=message_data.content
    )
    
    doc = message.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    
    await db.messages.insert_one(doc)
    return message

# ==================== AI ROUTES ====================

@api_router.post("/ai/recommend-events")
async def recommend_events(request: AIRecommendRequest, user_id: str = Depends(get_current_user)):
    try:
        # Get all events
        events = await db.events.find({}, {"_id": 0}).to_list(1000)
        
        if not events:
            return {"recommendations": [], "explanation": "No events available"}
        
        # Format events for AI
        events_text = "\n".join([
            f"- {e['title']} (Category: {e['category']}, Date: {e['date']}, Location: {e['location']})"
            for e in events
        ])
        
        # Use GPT-5.1 to recommend
        chat = LlmChat(
            api_key=os.environ['EMERGENT_LLM_KEY'],
            session_id=f"recommend_{user_id}",
            system_message="You are an event recommendation assistant. Recommend top 3 events based on user interests."
        ).with_model("openai", "gpt-5.1")
        
        prompt = f"""User interests: {', '.join(request.user_interests)}

Available events:
{events_text}

Recommend the top 3 events for this user. Return ONLY a JSON array of event titles, like: ["Event 1", "Event 2", "Event 3"]"""
        
        response = await chat.send_message(UserMessage(text=prompt))
        
        # Try to parse JSON response
        import json
        try:
            recommended_titles = json.loads(response)
        except:
            # Fallback: return first 3 events
            recommended_titles = [e['title'] for e in events[:3]]
        
        recommended_events = [e for e in events if e['title'] in recommended_titles][:3]
        
        return {
            "recommendations": recommended_events,
            "explanation": f"Based on your interests in {', '.join(request.user_interests)}"
        }
    except Exception as e:
        logging.error(f"AI recommendation error: {str(e)}")
        # Fallback to simple matching
        events = await db.events.find({}, {"_id": 0}).limit(3).to_list(3)
        return {
            "recommendations": events,
            "explanation": "Here are some popular events"
        }

@api_router.post("/ai/recommend-people")
async def recommend_people(event_id: str, user_id: str = Depends(get_current_user)):
    try:
        # Get current user
        current_user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if not current_user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Get event attendees
        event = await db.events.find_one({"id": event_id}, {"_id": 0})
        if not event:
            raise HTTPException(status_code=404, detail="Event not found")
        
        attendee_ids = [uid for uid in event.get('attendees', []) if uid != user_id]
        if not attendee_ids:
            return {"recommendations": [], "explanation": "No other attendees yet"}
        
        attendees = await db.users.find({"id": {"$in": attendee_ids}}, {"_id": 0, "password_hash": 0}).to_list(100)
        
        # Format attendees for AI
        attendees_text = "\n".join([
            f"- {a['name']} (Interests: {', '.join(a.get('interests', []))})"
            for a in attendees
        ])
        
        chat = LlmChat(
            api_key=os.environ['EMERGENT_LLM_KEY'],
            session_id=f"match_{user_id}",
            system_message="You are a networking assistant helping people connect at events."
        ).with_model("openai", "gpt-5.1")
        
        prompt = f"""My interests: {', '.join(current_user.get('interests', []))}

Other attendees:
{attendees_text}

Recommend top 3 people I should connect with. Return ONLY a JSON array of names: ["Name 1", "Name 2", "Name 3"]"""
        
        response = await chat.send_message(UserMessage(text=prompt))
        
        import json
        try:
            recommended_names = json.loads(response)
        except:
            recommended_names = [a['name'] for a in attendees[:3]]
        
        recommended_users = [a for a in attendees if a['name'] in recommended_names][:3]
        
        return {
            "recommendations": [UserResponse(
                id=u['id'],
                email=u['email'],
                name=u['name'],
                bio=u.get('bio', ''),
                interests=u.get('interests', []),
                profile_pic=u.get('profile_pic', '')
            ) for u in recommended_users],
            "explanation": "People with similar interests"
        }
    except Exception as e:
        logging.error(f"AI people recommendation error: {str(e)}")
        attendees = await db.users.find({"id": {"$in": attendee_ids}}, {"_id": 0, "password_hash": 0}).limit(3).to_list(3)
        return {
            "recommendations": [UserResponse(
                id=u['id'],
                email=u['email'],
                name=u['name'],
                bio=u.get('bio', ''),
                interests=u.get('interests', []),
                profile_pic=u.get('profile_pic', '')
            ) for u in attendees],
            "explanation": "Attendees at this event"
        }

@api_router.post("/ai/icebreaker")
async def generate_icebreaker(request: AIIcebreakerRequest):
    try:
        chat = LlmChat(
            api_key=os.environ['EMERGENT_LLM_KEY'],
            session_id="icebreaker",
            system_message="You are a friendly conversation starter assistant."
        ).with_model("openai", "gpt-5.1")
        
        prompt = f"""Generate a fun, engaging icebreaker conversation starter for:

Person 1: {request.user1_name} (Interests: {', '.join(request.user1_interests)})
Person 2: {request.user2_name} (Interests: {', '.join(request.user2_interests)})

Provide ONE creative conversation starter (max 2 sentences) that relates to their shared or complementary interests."""
        
        response = await chat.send_message(UserMessage(text=prompt))
        
        return {"icebreaker": response}
    except Exception as e:
        logging.error(f"AI icebreaker error: {str(e)}")
        return {"icebreaker": "Hey! I noticed we're both attending this event. What brings you here?"}

# ==================== SEED DATA ROUTE ====================

@api_router.post("/seed/events")
async def seed_events():
    """Create sample events for demo"""
    sample_events = [
        {
            "title": "VibeHack Days 2025",
            "description": "48-hour hackathon with prizes worth ₹11 lakhs. Build innovative startups with support from OpenAI, Emergent, and top mentors.",
            "category": "Hackathon",
            "date": "2025-01-20",
            "location": "Polaris School of Technology, Bangalore",
            "image_url": "https://images.unsplash.com/photo-1565687981296-535f09db714e?crop=entropy&cs=srgb&fm=jpg&q=85"
        },
        {
            "title": "Tech Startup Networking Night",
            "description": "Connect with fellow entrepreneurs, investors, and tech enthusiasts. Share ideas and build meaningful connections.",
            "category": "Networking",
            "date": "2025-01-25",
            "location": "Koramangala, Bangalore",
            "image_url": "https://images.pexels.com/photos/3184294/pexels-photo-3184294.jpeg"
        },
        {
            "title": "AI & Machine Learning Conference",
            "description": "Explore the latest in AI/ML with workshops, talks from industry leaders, and networking opportunities.",
            "category": "Conference",
            "date": "2025-02-05",
            "location": "Whitefield, Bangalore",
            "image_url": "https://images.unsplash.com/photo-1693386556810-43d9451bdda5?crop=entropy&cs=srgb&fm=jpg&q=85"
        },
        {
            "title": "Product Design Workshop",
            "description": "Hands-on workshop on modern product design principles, UX/UI best practices, and design thinking.",
            "category": "Workshop",
            "date": "2025-02-10",
            "location": "Indiranagar, Bangalore",
            "image_url": "https://images.unsplash.com/photo-1761063198886-f485556ed341?crop=entropy&cs=srgb&fm=jpg&q=85"
        },
        {
            "title": "Blockchain Meetup",
            "description": "Discuss Web3, DeFi, and blockchain innovations. Great for developers and crypto enthusiasts.",
            "category": "Meetup",
            "date": "2025-02-15",
            "location": "HSR Layout, Bangalore",
            "image_url": "https://images.unsplash.com/photo-1761063198880-f3ff5c5f8f1f?crop=entropy&cs=srgb&fm=jpg&q=85"
        },
        {
            "title": "Startup Funding Bootcamp",
            "description": "Learn how to pitch to investors, raise funding, and scale your startup. Featuring successful founders.",
            "category": "Workshop",
            "date": "2025-02-20",
            "location": "MG Road, Bangalore",
            "image_url": "https://images.unsplash.com/photo-1693386556810-43d9451bdda5?crop=entropy&cs=srgb&fm=jpg&q=85"
        }
    ]
    
    for event_data in sample_events:
        event_obj = Event(**event_data)
        doc = event_obj.model_dump()
        doc['created_at'] = doc['created_at'].isoformat()
        await db.events.insert_one(doc)
    
    return {"message": f"Created {len(sample_events)} sample events"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()