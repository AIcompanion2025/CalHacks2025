
# Backend Development Plan - AI City Companion

## 1️⃣ Executive Summary

**What Will Be Built:**
- FastAPI backend for AI City Companion - a personalized city exploration app for Berkeley, CA
- Features: User onboarding, place recommendations, custom route building, expense tracking, and gamification (Street Cred system)
- MongoDB Atlas database for persistent storage
- RESTful API with JWT authentication

**Constraints:**
- FastAPI (Python 3.13, async)
- MongoDB Atlas using Motor and Pydantic v2
- No Docker
- Manual testing after every task via frontend UI
- Single branch Git workflow (`main`)
- API base path: `/api/v1/*`
- Background tasks: synchronous by default

**Sprint Structure:**
- S0: Environment Setup & Frontend Connection
- S1: Basic Auth (Signup/Login/Logout)
- S2: User Profile & Preferences Management
- S3: Places & Recommendations
- S4: Routes Management
- S5: Expenses Tracking

---

## 2️⃣ In-Scope & Success Criteria

**In-Scope Features:**
- User registration and authentication with JWT
- User profile with preferences (mood, interests, pace, budget, atmosphere)
- Street Cred gamification system with levels
- Place browsing and filtering
- AI-powered personalized recommendations based on mood/preferences
- Custom route creation with multiple places
- Route management (create, list, view, delete)
- Expense tracking with categories
- Expense analytics (totals, category breakdown)

**Success Criteria:**
- All frontend features functional end-to-end
- User can complete onboarding flow
- Recommendations display based on preferences
- Routes can be created, saved, and viewed
- Expenses can be tracked and analyzed
- Street Cred updates correctly
- All task-level tests pass via UI
- Each sprint's code pushed to `main` after verification

---

## 3️⃣ API Design

**Base Path:** `/api/v1`

**Error Envelope:** `{ "error": "message" }`

### Health Check
- **GET** `/healthz`
- Purpose: Health check with DB connection status
- Response: `{ "status": "ok", "database": "connected" }`

### Authentication
- **POST** `/api/v1/auth/signup`
- Purpose: Register new user
- Request: `{ "name": "string", "email": "string", "password": "string" }`
- Response: `{ "user": {...}, "token": "jwt_token" }`
- Validation: Email format, password min 8 chars

- **POST** `/api/v1/auth/login`
- Purpose: Login existing user
- Request: `{ "email": "string", "password": "string" }`
- Response: `{ "user": {...}, "token": "jwt_token" }`

- **POST** `/api/v1/auth/logout`
- Purpose: Logout (client-side token removal)
- Response: `{ "message": "Logged out successfully" }`

- **GET** `/api/v1/auth/me`
- Purpose: Get current user profile
- Headers: `Authorization: Bearer <token>`
- Response: `{ "user": {...} }`

### Users
- **GET** `/api/v1/users/profile`
- Purpose: Get user profile with stats
- Response: `{ "user": {...}, "stats": { "visitedPlaces": 0, "routesCreated": 0 } }`

- **PUT** `/api/v1/users/profile`
- Purpose: Update user profile
- Request: `{ "name": "string", "preferences": {...} }`
- Response: `{ "user": {...} }`

- **PUT** `/api/v1/users/preferences`
- Purpose: Update user preferences
- Request: `{ "mood": [], "interests": [], "pace": "string", "budget": "string", "atmosphere": [] }`
- Response: `{ "preferences": {...} }`

- **POST** `/api/v1/users/visit-place`
- Purpose: Mark place as visited, update Street Cred
- Request: `{ "placeId": "string" }`
- Response: `{ "streetCred": 0, "level": 0, "visitedPlaces": [] }`

### Places
- **GET** `/api/v1/places`
- Purpose: List all places with optional filtering
- Query: `?category=string&priceLevel=number&tags=string`
- Response: `{ "places": [...] }`

- **GET** `/api/v1/places/{id}`
- Purpose: Get single place details
- Response: `{ "place": {...} }`

- **POST** `/api/v1/places/recommendations`
- Purpose: Get personalized recommendations
- Request: `{ "mood": "string", "timeAvailable": 60, "priceLevel": 2, "interests": [] }`
- Response: `{ "recommendations": [...] }`

### Routes
- **POST** `/api/v1/routes`
- Purpose: Create new route
- Request: `{ "name": "string", "placeIds": ["id1", "id2"] }`
- Response: `{ "route": {...} }`
- Validation: Min 2 places, name required

- **GET** `/api/v1/routes`
- Purpose: List user's routes
- Response: `{ "routes": [...] }`

- **GET** `/api/v1/routes/{id}`
- Purpose: Get single route with places
- Response: `{ "route": {...} }`

- **DELETE** `/api/v1/routes/{id}`
- Purpose: Delete route
- Response: `{ "message": "Route deleted" }`

### Expenses
- **POST** `/api/v1/expenses`
- Purpose: Create expense
- Request: `{ "amount": 0.00, "category": "food", "description": "string", "notes": "string" }`
- Response: `{ "expense": {...} }`

- **GET** `/api/v1/expenses`
- Purpose: List user's expenses
- Response: `{ "expenses": [...], "summary": { "total": 0, "byCategory": {} } }`

- **DELETE** `/api/v1/expenses/{id}`
- Purpose: Delete expense
- Response: `{ "message": "Expense deleted" }`

---

## 4️⃣ Data Model (MongoDB Atlas)

### Collection: `users`
**Fields:**
- `_id`: ObjectId (auto)
- `name`: string (required)
- `email`: string (required, unique, indexed)
- `password_hash`: string (required, Argon2)
- `street_cred`: int (default: 0)
- `visited_places`: array of strings (default: [])
- `preferences`: embedded document
  - `mood`: array of strings
  - `interests`: array of strings
  - `pace`: string (slow/moderate/fast)
  - `budget`: string (budget/moderate/luxury)
  - `atmosphere`: array of strings
- `created_at`: datetime (auto)
- `updated_at`: datetime (auto)

**Example:**
```json
{
  "_id": "ObjectId",
  "name": "John Doe",
  "email": "john@example.com",
  "password_hash": "$argon2...",
  "street_cred": 50,
  "visited_places": ["place1", "place2"],
  "preferences": {
    "mood": ["adventurous", "curious"],
    "interests": ["food", "art"],
    "pace": "moderate",
    "budget": "moderate",
    "atmosphere": ["cozy", "vintage"]
  },
  "created_at": "2025-01-01T00:00:00Z",
  "updated_at": "2025-01-01T00:00:00Z"
}
```

### Collection: `places`
**Fields:**
- `_id`: ObjectId (auto)
- `name`: string (required)
- `category`: string (required)
- `description`: string
- `ai_summary`: string
- `rating`: float
- `review_count`: int
- `price_level`: int (0-3)
- `walking_time`: int (minutes)
- `driving_time`: int (minutes)
- `coordinates`: embedded document
  - `lat`: float
  - `lng`: float
- `image_url`: string
- `tags`: array of strings
- `vibe`: array of strings
- `created_at`: datetime (auto)

**Example:**
```json
{
  "_id": "ObjectId",
  "name": "Hidden Gem Coffee Roasters",
  "category": "Café",
  "description": "Artisan coffee shop...",
  "ai_summary": "This intimate café...",
  "rating": 4.9,
  "review_count": 567,
  "price_level": 2,
  "walking_time": 8,
  "driving_time": 3,
  "coordinates": { "lat": 37.8695, "lng": -122.2710 },
  "image_url": "/placeholder.svg",
  "tags": ["coffee", "cozy", "artisan"],
  "vibe": ["warm", "intimate", "creative"],
  "created_at": "2025-01-01T00:00:00Z"
}
```

### Collection: `routes`
**Fields:**
- `_id`: ObjectId (auto)
- `user_id`: ObjectId (required, ref users)
- `name`: string (required)
- `place_ids`: array of ObjectId (required, min 2)
- `total_walking_time`: int (calculated)
- `total_driving_time`: int (calculated)
- `narrative`: string (generated)
- `created_at`: datetime (auto)

**Example:**
```json
{
  "_id": "ObjectId",
  "user_id": "ObjectId",
  "name": "Morning Coffee Walk",
  "place_ids": ["ObjectId1", "ObjectId2", "ObjectId3"],
  "total_walking_time": 25,
  "total_driving_time": 10,
  "narrative": "Begin your journey at...",
  "created_at": "2025-01-01T00:00:00Z"
}
```

### Collection: `expenses`
**Fields:**
- `_id`: ObjectId (auto)
- `user_id`: ObjectId (required, ref users)
- `amount`: float (required)
- `category`: string (required: food/transport/shopping/entertainment/accommodation/other)
- `description`: string (required)
- `place_id`: ObjectId (optional, ref places)
- `place_name`: string (optional)
- `notes`: string (optional)
- `date`: datetime (required)
- `created_at`: datetime (auto)

**Example:**
```json
{
  "_id": "ObjectId",
  "user_id": "ObjectId",
  "amount": 15.50,
  "category": "food",
  "description": "Lunch at Cheese Board",
  "place_id": "ObjectId",
  "place_name": "Cheese Board Collective",
  "notes": "Amazing vegetarian pizza",
  "date": "2025-01-01T12:00:00Z",
  "created_at": "2025-01-01T12:00:00Z"
}
```

---

## 5️⃣ Frontend Audit & Feature Map

### `/onboarding` - Onboarding Flow
- **Purpose:** Collect user info and preferences
- **Data Needed:** Name, email, password, preferences
- **Backend Endpoints:** `POST /api/v1/auth/signup`
- **Models:** User
- **Auth:** None (public)

### `/` - Home Dashboard
- **Purpose:** Main dashboard with recommendations, stats, weather
- **Data Needed:** User profile, personalized recommendations, visited places count, routes count
- **Backend Endpoints:** `GET /api/v1/auth/me`, `POST /api/v1/places/recommendations`
- **Models:** User, Place
- **Auth:** Required

### `/place/{id}` - Place Detail
- **Purpose:** View single place details
- **Data Needed:** Place info, ability to mark as visited
- **Backend Endpoints:** `GET /api/v1/places/{id}`, `POST /api/v1/users/visit-place`
- **Models:** Place, User
- **Auth:** Required

### `/profile` - User Profile
- **Purpose:** View/edit profile, preferences, stats, Street Cred level
- **Data Needed:** User profile, preferences, visited places, routes count, Street Cred
- **Backend Endpoints:** `GET /api/v1/users/profile`, `PUT /api/v1/users/profile`, `PUT /api/v1/users/preferences`
- **Models:** User
- **Auth:** Required

### `/routes` - Routes List
- **Purpose:** View all saved routes
- **Data Needed:** User's routes with places
- **Backend Endpoints:** `GET /api/v1/routes`, `DELETE /api/v1/routes/{id}`
- **Models:** Route, Place
- **Auth:** Required

### `/route-builder` - Route Builder
- **Purpose:** Create custom routes by selecting places
- **Data Needed:** All places (with filtering), save route
- **Backend Endpoints:** `GET /api/v1/places`, `POST /api/v1/routes`
- **Models:** Place, Route
- **Auth:** Required

### `/expenses` - Expenses Tracker
- **Purpose:** Track and analyze travel expenses
- **Data Needed:** User's expenses, category breakdown, totals
- **Backend Endpoints:** `POST /api/v1/expenses`, `GET /api/v1/expenses`, `DELETE /api/v1/expenses/{id}`
- **Models:** Expense
- **Auth:** Required

---

## 6️⃣ Configuration & ENV Vars

**Required Environment Variables:**
- `APP_ENV` - Environment (development, production)
- `PORT` - HTTP port (default: 8000)
- `MONGODB_URI` - MongoDB Atlas connection string
- `JWT_SECRET` - Token signing key (min 32 chars)
- `JWT_EXPIRES_IN` - Seconds before JWT expiry (default: 86400 = 24h)
- `CORS_ORIGINS` - Allowed frontend URL(s) (comma-separated)

**Example `.env`:**
```
APP_ENV=development
PORT=8000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/ai_city_companion?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-key-min-32-characters-long
JWT_EXPIRES_IN=86400
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

---

## 7️⃣ Background Work

**Not Required** - All operations are synchronous and complete within request lifecycle.

---

## 8️⃣ Integrations

**Not Required** - No external integrations needed for MVP.

---

## 9️⃣ Testing Strategy (Manual via Frontend)

**Validation Method:** Manual testing through frontend UI only

**Per-Task Testing:**
- Every task includes Manual Test Step (exact UI action + expected result)
- Every task includes User Test Prompt (copy-paste friendly instruction)
- Test must pass before proceeding to next task

**Per-Sprint Testing:**
- After all tasks in sprint pass individual tests
- Verify sprint objectives met
- Commit and push to `main`
- If any test fails → fix and retest before pushing

---

## 🔟 Dynamic Sprint Plan & Backlog

---

## 🧱 S0 – Environment Setup & Frontend Connection

**Objectives:**
- Create FastAPI skeleton with `/api/v1` base path and `/healthz`
- Connect to MongoDB Atlas using `MONGODB_URI`
- `/healthz` performs DB ping and returns JSON status
- Enable CORS for frontend
- Initialize Git at root, set default branch to `main`, push to GitHub
- Create single `.gitignore` at root

**User Stories:**
- As a developer, I need a working backend skeleton so I can build features
- As a developer, I need DB connectivity verified so data persistence works
- As a frontend, I need CORS enabled so API calls succeed

**Tasks:**

### Task 1: Initialize FastAPI Project Structure
- Create `backend/` directory at project root
- Create `backend/main.py` with FastAPI app
- Create `backend/requirements.txt` with dependencies:
  - `fastapi==0.115.0`
  - `uvicorn[standard]==0.32.0`
  - `motor==3.6.0`
  - `pydantic==2.9.2`
  - `pydantic-settings==2.6.0`
  - `python-jose[cryptography]==3.3.0`
  - `passlib[argon2]==1.7.4`
  - `python-multipart==0.0.12`
- Create `backend/.env.example` with all required env vars
- Create `backend/config.py` for settings using Pydantic Settings

**Manual Test Step:** Run `pip install -r requirements.txt` → no errors

**User Test Prompt:**
> "Navigate to backend/ and run: pip install -r requirements.txt. Confirm all packages install successfully."

### Task 2: Setup MongoDB Atlas Connection
- Create `backend/database.py` with Motor async client
- Implement connection function with ping test
- Add connection on startup, close on shutdown
- Handle connection errors gracefully

**Manual Test Step:** Start backend → logs show "Connected to MongoDB Atlas"

**User Test Prompt:**
> "Start the backend with: uvicorn main:app --reload. Check console logs for successful MongoDB connection message."

### Task 3: Implement Health Check Endpoint
- Create `/healthz` endpoint (not under `/api/v1`)
- Perform DB ping and return status
- Response: `{ "status": "ok", "database": "connected" }` or error

**Manual Test Step:** GET `/healthz` → 200 OK with DB status

**User Test Prompt:**
> "Open browser to http://localhost:8000/healthz. Confirm JSON response shows database connected."

### Task 4: Configure CORS for Frontend
- Add CORS middleware to FastAPI app
- Allow origins from `CORS_ORIGINS` env var
- Allow credentials, all methods, all headers

**Manual Test Step:** Frontend can call `/healthz` without CORS errors

**User Test Prompt:**
> "From frontend, make a fetch request to http://localhost:8000/healthz. Confirm no CORS errors in browser console."

### Task 5: Initialize Git Repository
- Run `git init` at project root (if not already initialized)
- Create `.gitignore` at root with:
  - `__pycache__/`
  - `*.pyc`
  - `.env`
  - `*.pyo`
  - `*.pyd`
  - `.Python`
  - `venv/`
  - `env/`
- Set default branch to `main`: `git branch -M main`
- Create initial commit
- Push to GitHub remote

**Manual Test Step:** Repository exists on GitHub with `main` branch

**User Test Prompt:**
> "Check GitHub repository. Confirm main branch exists with initial backend code and .gitignore file."

**Definition of Done:**
- Backend runs locally on port 8000
- MongoDB Atlas connection successful
- `/healthz` returns 200 with DB status
- CORS enabled for frontend
- Git repository initialized with `main` branch
- Code pushed to GitHub

**Post-Sprint:** Commit and push to `main`

---

## 🧩 S1 – Basic Auth (Signup / Login / Logout)

**Objectives:**
- Implement JWT-based signup, login, and logout
- Password hashing with Argon2
- Protect one backend route + one frontend page

**User Stories:**
- As a user, I can create an account so I can save my data
- As a user, I can login to access my personalized experience
- As a user, I can logout to secure my account

**Tasks:**

### Task 1: Create User Model and Auth Utilities
- Create `backend/models/user.py` with Pydantic User model
- Create `backend/auth/utils.py` with:
  - `hash_password()` using Argon2
  - `verify_password()`
  - `create_access_token()` using JWT
  - `decode_access_token()`
- Create `backend/auth/dependencies.py` with `get_current_user()` dependency

**Manual Test Step:** Import functions → no errors

**User Test Prompt:**
> "Run Python REPL and import auth utilities. Confirm no import errors."

### Task 2: Implement Signup Endpoint
- Create `backend/routers/auth.py`
- Implement `POST /api/v1/auth/signup`
- Validate email format, password min 8 chars
- Check email uniqueness
- Hash password with Argon2
- Create user in MongoDB
- Return user object and JWT token
- Initialize user with 0 Street Cred, empty preferences

**Manual Test Step:** Sign up via frontend onboarding → success message, redirected to home

**User Test Prompt:**
> "Complete the onboarding flow with name, email, and password. Confirm successful account creation and redirect to home page."

### Task 3: Implement Login Endpoint
- Implement `POST /api/v1/auth/login`
- Validate credentials
- Verify password hash
- Generate JWT token
- Return user object and token

**Manual Test Step:** Login via frontend → token saved, redirected to dashboard

**User Test Prompt:**
> "After signup, logout and login again with your credentials. Confirm successful login and redirect to dashboard."

### Task 4: Implement Logout Endpoint
- Implement `POST /api/v1/auth/logout`
- Return success message (client handles token removal)

**Manual Test Step:** Click logout → token cleared, protected pages blocked

**User Test Prompt:**
> "Click logout button. Try accessing /profile. Confirm redirect to onboarding/login."

### Task 5: Implement Get Current User Endpoint
- Implement `GET /api/v1/auth/me`
- Require JWT authentication
- Return current user profile

**Manual Test Step:** GET `/api/v1/auth/me` with token → user data returned

**User Test Prompt:**
> "After login, check browser DevTools Network tab. Confirm /api/v1/auth/me returns your user data."

**Definition of Done:**
- Users can signup with email/password
- Users can login and receive JWT
- Users can logout (client-side)
- Protected endpoint requires valid JWT
- Frontend auth flow works end-to-end

**Post-Sprint:** Commit and push to `main`

---

## 🧱 S2 – User Profile & Preferences Management

**Objectives:**
- Implement user profile viewing and editing
- Preferences management (mood, interests, pace, budget, atmosphere)
- Street Cred system with level calculation
- Visit place tracking

**User Stories:**
- As a user, I can view my profile and stats
- As a user, I can update my preferences
- As a user, I can track places I've visited
- As a user, I can see my Street Cred level progress

**Tasks:**

### Task 1: Implement Get Profile Endpoint
- Create `backend/routers/users.py`
- Implement `GET /api/v1/users/profile`
- Return user with stats: visited places count, routes count
- Calculate current level and Street Cred

**Manual Test Step:** Navigate to /profile → see user info, Street Cred, level

**User Test Prompt:**
> "Click Profile in navigation. Confirm your name, email, Street Cred score, and level are displayed."

### Task 2: Implement Update Profile Endpoint
- Implement `PUT /api/v1/users/profile`
- Allow updating name only (email immutable)
- Validate input
- Update user in MongoDB

**Manual Test Step:** Edit name in profile → saved successfully

**User Test Prompt:**
> "In Profile page, click 'Edit Preferences' and change your name. Confirm changes are saved and displayed."

### Task 3: Implement Update Preferences Endpoint
- Implement `PUT /api/v1/users/preferences`
- Accept mood, interests, pace, budget, atmosphere
- Validate preference values
- Update user preferences in MongoDB

**Manual Test Step:** Update preferences → recommendations change on home page

**User Test Prompt:**
> "Update your preferences (mood, interests, etc.). Return to home page and confirm recommendations reflect your new preferences."

### Task 4: Implement Visit Place Tracking
- Implement `POST /api/v1/users/visit-place`
- Add place ID to user's visited_places array (if not already present)
- Calculate new Street Cred: +10 per place
- Update user's street_cred field
- Return updated Street Cred, level, and visited places

**Manual Test Step:** Click place → mark as visited → Street Cred increases by 10

**User Test Prompt:**
> "View a place detail page and mark it as visited. Check your profile - Street Cred should increase by 10 points."

### Task 5: Implement Street Cred Calculation Logic
- Create `backend/utils/gamification.py`
- Implement `calculate_street_cred(visited_places, routes_completed)`:
  - Places: 10 points each
  - Routes: 25 points each
- Implement `calculate_level(street_cred)`: level = floor(cred / 100) + 1
- Implement `get_level_title(level)` with titles:
  - Level 1: Novice Explorer
  - Level 2-3: Local Wanderer
  - Level 4-6: City Connoisseur
  - Level 7-10: Urban Legend
  - Level 11-15: Master Navigator
  - Level 16-20: City Sage
  - Level 21+: Legendary Explorer

**Manual Test Step:** Visit places and create routes → Street Cred and level update correctly

**User Test Prompt:**
> "Visit 10 places (100 cred) and create 4 routes (100 cred). Confirm you reach Level 3 (200 total cred)."

**Definition of Done:**
- Profile page displays user info and stats
- Preferences can be updated
- Places can be marked as visited
- Street Cred increases correctly
- Level calculation works
- Level titles display properly

**Post-Sprint:** Commit and push to `main`

---

## 🧱 S3 – Places & Recommendations

**Objectives:**
- Seed MongoDB with places from frontend mock data
- Implement place listing with filtering
- Implement personalized recommendations based on mood/preferences
- Implement single place detail view

**User Stories:**
- As a user, I can browse all places
- As a user, I can filter places by category, price, tags
- As a user, I can get personalized recommendations based on my mood
- As a user, I can view detailed information about a place

**Tasks:**

### Task 1: Create Place Model and Seed Data
- Create `backend/models/place.py` with Pydantic Place model
- Create `backend/scripts/seed_places.py`
- Convert frontend `mockPlaces.ts` data to Python
- Insert all 24 places into MongoDB `places` collection
- Run seed script once

**Manual Test Step:** Check MongoDB Atlas → 24 places exist

**User Test Prompt:**
> "Run the seed script: python -m backend.scripts.seed_places. Check MongoDB Atlas dashboard - confirm 24 places in the places collection."

### Task 2: Implement List Places Endpoint
- Create `backend/routers/places.py`
- Implement `GET /api/v1/places`
- Support optional query params:
  - `category`: filter by category
  - `priceLevel`: filter by max price level
  - `tags`: filter by tags (comma-separated)
- Return all matching places

**Manual Test Step:** Navigate to /route-builder → all places display

**User Test Prompt:**
> "Go to Route Builder page. Confirm all 24 places are displayed. Try filtering by category - confirm only matching places show."

### Task 3: Implement Get Place Detail Endpoint
- Implement `GET /api/v1/places/{id}`
- Return single place by ID
- Return 404 if not found

**Manual Test Step:** Click a place card → detail page shows full info

**User Test Prompt:**
> "Click any place card from home page. Confirm place detail page shows name, description, rating, tags, and all other info."

### Task 4: Implement Recommendations Algorithm
- Create `backend/utils/recommendations.py`
- Implement `generate_recommendations(mood, time_available, price_level, interests)`:
  - Filter places by mood matching vibe
  - Filter by interests matching tags/category
  - Filter by walking_time <= time_available
  - Filter by price_level <= max price
  - Return top 6 matches
- Use simple scoring: +1 for mood match, +1 for interest match

**Manual Test Step:** Enter mood on home page → relevant places appear

**User Test Prompt:**
> "On home page, enter mood 'relaxed' and click Find Places. Confirm recommendations show places with relaxed/peaceful vibes."

### Task 5: Implement Recommendations Endpoint
- Implement `POST /api/v1/places/recommendations`
- Accept: mood, timeAvailable, priceLevel, interests
- Call recommendations algorithm
- Return recommended places

**Manual Test Step:** Change mood/filters → recommendations update

**User Test Prompt:**
> "Try different moods (adventurous, curious, energetic) and price filters. Confirm recommendations change appropriately each time."

**Definition of Done:**
- All 24 places seeded in MongoDB
- Places list endpoint works with filtering
- Place detail endpoint returns single place
- Recommendations algorithm generates relevant results
- Home page shows personalized recommendations
- Route builder shows all places with filters

**Post-Sprint:** Commit and push to `main`

---

## 🧱 S4 – Routes Management

**Objectives:**
- Implement route creation with multiple places
- Generate route narrative
- List user's routes
- View single route with places
- Delete routes
- Update Street Cred when route created

**User Stories:**
- As a user, I can create custom routes with multiple places
- As a user, I can view all my saved routes
- As a user, I can view route details with all places
- As a user, I can delete routes I no longer need
- As a user, I earn Street Cred when creating routes

**Tasks:**

### Task 1: Create Route Model
- Create `backend/models/route.py` with Pydantic Route model
- Fields: user_id, name, place_ids, total_walking_time, total_driving_time, narrative, created_at

**Manual Test Step:** Import model → no errors

**User Test Prompt:**
> "Run Python REPL and import Route model. Confirm no import errors."

### Task 2: Implement Create Route Endpoint
- Create `backend/routers/routes.py`
- Implement `POST /api/v1/routes`
- Validate: min 2 places, name required
- Fetch place details for each place_id
- Calculate total_walking_time and total_driving_time
- Generate narrative using places
- Save route to MongoDB
- Update user's Street Cred (+25 points)
- Return created route with populated places

**Manual Test Step:** Create route in route builder → saved successfully, Street Cred +25

**User Test Prompt:**
> "In Route Builder, select 3+ places, name your route, and save. Confirm success message, redirect to routes list, and Street Cred increased by 25."

### Task 3: Implement Generate Route Narrative
- Create `backend/utils/narrative.py`
- Implement `generate_route_narrative(places)`:
  - Create engaging narrative from place names and descriptions
  - Format: "Begin your journey at {place1}, where {summary}. From there, let the path guide you to {place2}..."
  - Return narrative string

**Manual Test Step:** View created route → narrative displays

**User Test Prompt:**
> "View a saved route. Confirm a descriptive narrative is displayed describing the journey through your selected places."

### Task 4: Implement List Routes Endpoint
- Implement `GET /api/v1/routes`
- Filter by current user
- Populate place details for each route
- Sort by created_at descending
- Return user's routes with places

**Manual Test Step:** Navigate to /routes → all saved routes display

**User Test Prompt:**
> "Click 'My Routes' in navigation. Confirm all your saved routes are listed with place names and details."

### Task 5: Implement Get Single Route Endpoint
- Implement `GET /api/v1/routes/{id}`
- Verify route belongs to current user
- Populate full place details
- Return route with places

**Manual Test Step:** Click route → view details with all places

**User Test Prompt:**
> "Click 'View Route' on any saved route. Confirm all places in the route are displayed with full details."

### Task 6: Implement Delete Route Endpoint
- Implement `DELETE /api/v1/routes/{id}`
-
- Verify route belongs to current user (403 if not)
- Delete route from MongoDB
- Return success message

**Manual Test Step:** Delete route → removed from list

**User Test Prompt:**
> "Click delete icon on a route, confirm deletion. Refresh page - confirm route is gone from list."

**Definition of Done:**
- Routes can be created with 2+ places
- Route narrative generates correctly
- Routes list shows user's routes
- Single route view shows all places
- Routes can be deleted
- Street Cred increases by 25 per route

**Post-Sprint:** Commit and push to `main`

---

## 🧱 S5 – Expenses Tracking

**Objectives:**
- Implement expense creation with categories
- List user's expenses with summary
- Calculate category breakdown and totals
- Delete expenses

**User Stories:**
- As a user, I can track my travel expenses
- As a user, I can categorize expenses
- As a user, I can view spending summary by category
- As a user, I can delete expenses

**Tasks:**

### Task 1: Create Expense Model
- Create `backend/models/expense.py` with Pydantic Expense model
- Fields: user_id, amount, category, description, place_id, place_name, notes, date, created_at
- Category enum: food, transport, shopping, entertainment, accommodation, other

**Manual Test Step:** Import model → no errors

**User Test Prompt:**
> "Run Python REPL and import Expense model. Confirm no import errors."

### Task 2: Implement Create Expense Endpoint
- Create `backend/routers/expenses.py`
- Implement `POST /api/v1/expenses`
- Validate: amount > 0, category valid, description required
- Optional: place_id and place_name
- Save expense to MongoDB
- Return created expense

**Manual Test Step:** Add expense via frontend → saved successfully

**User Test Prompt:**
> "In Expenses page, click 'Add Expense', fill form (amount, category, description), and save. Confirm success message and expense appears in list."

### Task 3: Implement List Expenses with Summary
- Implement `GET /api/v1/expenses`
- Filter by current user
- Sort by date descending
- Calculate summary:
  - Total amount across all expenses
  - Breakdown by category (sum per category)
  - Count of expenses
- Return expenses array and summary object

**Manual Test Step:** Navigate to /expenses → see all expenses and summary cards

**User Test Prompt:**
> "Go to Expenses page. Confirm all your expenses are listed, and summary cards show correct total, transaction count, and average."

### Task 4: Implement Category Breakdown
- In list expenses endpoint, add category breakdown
- Group expenses by category
- Calculate sum for each category
- Calculate percentage of total for each category
- Return in summary object

**Manual Test Step:** View expenses → category breakdown shows correct amounts and percentages

**User Test Prompt:**
> "Add expenses in different categories. Confirm 'Spending by Category' section shows each category with correct amount and percentage."

### Task 5: Implement Delete Expense Endpoint
- Implement `DELETE /api/v1/expenses/{id}`
- Verify expense belongs to current user
- Delete expense from MongoDB
- Return success message

**Manual Test Step:** Delete expense → removed from list, totals update

**User Test Prompt:**
> "Click delete icon on an expense, confirm deletion. Confirm expense is removed and summary totals update correctly."

**Definition of Done:**
- Expenses can be created with all fields
- Expenses list shows all user expenses
- Summary shows total, count, average
- Category breakdown shows amounts and percentages
- Expenses can be deleted
- All calculations are accurate

**Post-Sprint:** Commit and push to `main`

---

## ✅ Final Verification Checklist

After completing all sprints, verify:

- [ ] Backend runs on port 8000
- [ ] MongoDB Atlas connection works
- [ ] `/healthz` returns 200 with DB status
- [ ] User can complete onboarding flow
- [ ] User can login and logout
- [ ] Profile page shows correct data
- [ ] Preferences can be updated
- [ ] Places display on home and route builder
- [ ] Recommendations work based on mood
- [ ] Routes can be created, viewed, deleted
- [ ] Street Cred updates correctly (+10 per place, +25 per route)
- [ ] Level calculation works
- [ ] Expenses can be tracked and deleted
- [ ] Expense summary calculates correctly
- [ ] All frontend pages work end-to-end
- [ ] CORS allows frontend requests
- [ ] JWT authentication protects routes
- [ ] All code pushed to `main` branch

---

## 📋 Development Notes

**Git Workflow:**
- Single branch: `main`
- Commit after each task passes testing
- Push to GitHub after each sprint completes

**Testing Approach:**
- Manual testing only via frontend UI
- Test each task before proceeding
- Verify sprint objectives before pushing

**Code Organization:**
```
backend/
├── main.py                 # FastAPI app entry point
├── config.py              # Settings and env vars
├── database.py            # MongoDB connection
├── requirements.txt       # Python dependencies
├── .env                   # Environment variables (gitignored)
├── .env.example          # Example env vars
├── models/
│   ├── user.py
│   ├── place.py
│   ├── route.py
│   └── expense.py
├── routers/
│   ├── auth.py
│   ├── users.py
│   ├── places.py
│   ├── routes.py
│   └── expenses.py
├── auth/
│   ├── utils.py          # Password hashing, JWT
│   └── dependencies.py   # Auth dependencies
├── utils/
│   ├── gamification.py   # Street Cred calculations
│   ├── recommendations.py # Place recommendations
│   └── narrative.py      # Route narrative generation
└── scripts/
    └── seed_places.py    # Seed places data
```

**API Response Patterns:**
- Success: `{ "data": {...} }` or direct object
- Error: `{ "error": "message" }`
- List: `{ "items": [...], "count": 0 }`

**Authentication Flow:**
1. User signs up → receives JWT
2. Frontend stores JWT in localStorage
3. Frontend sends JWT in Authorization header: `Bearer <token>`
4. Backend validates JWT on protected routes
5. Logout clears JWT from frontend

**Street Cred System:**
- Visit place: +10 points
- Create route: +25 points
- Level = floor(total_cred / 100) + 1
- Unbounded progression

**Recommendations Algorithm:**
- Match mood to place vibe
- Match interests to place tags/category
- Filter by time available
- Filter by price level
- Return top 6 matches

---

## 🎯 Success Metrics

**Technical Success:**
- All API endpoints functional
- All frontend pages work
- No CORS errors
- No authentication errors
- Database operations succeed

**User Success:**
- Complete onboarding in < 2 minutes
- Get relevant recommendations
- Create and save routes
- Track expenses accurately
- See Street Cred progress

**Development Success:**
- Clean, organized code
- Proper error handling
- Secure authentication
- Efficient database queries
- Clear API documentation

---

**END OF BACKEND DEVELOPMENT PLAN**

This plan provides complete guidance for building the AI City Companion backend using FastAPI, MongoDB Atlas, and JWT authentication. Follow the sprints sequentially, test each task via the frontend UI, and push to `main` after each sprint completes successfully.