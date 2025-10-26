# AI Route Generator - CalHacks Backend

A FastAPI backend that generates personalized routes using Google Gemini AI and Google Places API.

## 🚀 Quick Start

1. **Install dependencies:**
   ```bash
   cd backend
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

2. **Start the server:**
   ```bash
   uvicorn main:app --reload --port 8000
   ```

3. **Test the AI routes:**
   - Open `ai_route_demo.html` in your browser
   - Or use the API directly:
     ```bash
     curl -X POST "http://localhost:8000/api/v1/ai/generate-route-demo" \
       -H "Content-Type: application/json" \
       -d '{"prompt": "I want to explore Berkeley'\''s coffee culture"}'
     ```

## 🎯 Features

- **No Authentication Required** - Perfect for demos
- **No Database Required** - Works without MongoDB
- **Real AI Integration** - Uses Google Gemini and Places API
- **Web Interface** - Beautiful HTML interface for testing
- **REST API** - Clean API endpoints for integration

## 📡 API Endpoints

### Generate AI Route
```
POST /api/v1/ai/generate-route-demo
Content-Type: application/json

{
  "prompt": "I want to explore Berkeley's coffee culture",
  "city": "Berkeley, CA"
}
```

### Get Route Suggestions
```
GET /api/v1/ai/route-suggestions-demo
```

## 🧪 Test Examples

**Coffee Route:**
```bash
curl -X POST "http://localhost:8000/api/v1/ai/generate-route-demo" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Show me the best coffee shops and cafes in Berkeley"}'
```

**Parks Route:**
```bash
curl -X POST "http://localhost:8000/api/v1/ai/generate-route-demo" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "I want to explore Berkeley'\''s parks and outdoor spaces"}'
```

**Hidden Gems:**
```bash
curl -X POST "http://localhost:8000/api/v1/ai/generate-route-demo" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Find me some hidden gems and local favorites"}'
```

## 🎨 Web Interface

Open `ai_route_demo.html` in your browser for a beautiful, interactive interface to test the AI route generation.

## 🔧 Configuration

API keys are configured in `config.py`:
- Google Gemini API key
- Google Places API key

## 📁 Project Structure

```
backend/
├── main.py                    # FastAPI app
├── config.py                  # Configuration and API keys
├── database.py               # MongoDB connection (optional)
├── ai_route_demo.html        # Web interface
├── routers/
│   └── ai_routes_demo.py     # Demo AI routes (no auth required)
├── services/
│   ├── gemini_service.py     # Google Gemini AI integration
│   └── google_places_service.py # Google Places API integration
└── requirements.txt          # Python dependencies
```

## 🎉 Perfect for CalHacks!

- **No setup complexity** - Works out of the box
- **No authentication barriers** - Anyone can test
- **Real AI integration** - Impressive demo capabilities
- **Beautiful web interface** - Professional presentation
- **Clean API** - Easy to integrate with frontend
