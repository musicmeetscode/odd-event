# DevFest Q&A Backend

A real-time question and answer system built with Django and Django Channels, designed for conference sessions where attendees can submit questions and speakers can respond in real-time.

## Overview

This backend provides a robust REST API and WebSocket server that enables seamless communication between conference attendees and speakers. The system supports multiple concurrent sessions, real-time updates via WebSocket connections, and comprehensive authentication for both attendees and speakers.

## Features

### Core Functionality
- **Real-time Q&A**: WebSocket-based live updates for questions and answers
- **Multi-session Support**: Handle multiple concurrent conference sessions
- **Role-based Access**: Separate authentication flows for attendees and speakers
- **Token Authentication**: Secure API access using Django REST Framework tokens
- **CORS Support**: Configured for cross-origin requests from frontend applications

### API Capabilities
- User registration and authentication (attendees and speakers)
- Session management and listing
- Question submission and retrieval
- Answer submission with real-time broadcasting
- Query filtering by session and answer status

### Technical Features
- **ASGI Server**: Daphne for handling HTTP and WebSocket connections
- **Channel Layers**: Redis-backed or in-memory for WebSocket message routing
- **RESTful API**: Built with Django REST Framework
- **Database ORM**: Django models for User, Session, and Question entities
- **Admin Interface**: Django admin for data management

## Architecture

### Technology Stack
- **Framework**: Django 5.2.7
- **API**: Django REST Framework 3.16.1
- **WebSockets**: Django Channels 4.3.1
- **ASGI Server**: Daphne 4.2.1
- **Authentication**: DRF Token Authentication
- **CORS**: django-cors-headers 4.9.0

### Database Schema

**User Model**
- Custom user model with username/password authentication
- Boolean flag for speaker role differentiation
- Display name for public presentation

**Session Model**
- Session title and description
- Many-to-many relationship with speakers
- Start time tracking
- Timestamps for creation and updates

**Question Model**
- Foreign keys to User (author) and Session
- Question text and optional answer text
- Boolean flag for answered status
- Timestamps for creation and updates

### WebSocket Protocol

**Connection**
```
ws://localhost:8000/ws/session/{session_id}/
```

**Message Format (Broadcast)**
```json
{
  "type": "question_update",
  "question": {
    "id": 1,
    "question_text": "What is the session about?",
    "answer_text": "This session covers...",
    "is_answered": true,
    "username": "attendee123",
    "created_at": "2025-11-12T10:30:00Z"
  }
}
```

## Installation

### Prerequisites
- Python 3.11 or higher
- Redis (for production WebSocket channel layer)
- PostgreSQL (recommended for production)

### Local Development Setup

1. **Clone the repository**
```bash
git clone https://github.com/Hotchapu13/Devfest-QnA.git
cd Devfest-QnA/backend
```

2. **Create and activate virtual environment**
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install dependencies**
```bash
pip install -r requirements.txt
```

4. **Configure environment variables**
```bash
# Create .env file or set environment variables
export SECRET_KEY='your-secret-key-here'
export DEBUG=True
export ALLOWED_HOSTS='localhost,127.0.0.1'
```

5. **Run database migrations**
```bash
python manage.py migrate
```

6. **Create initial data**
```bash
# Create superuser for admin access
python manage.py createsuperuser

# Create test speakers and sessions using added fixtur
python manage.py loaddata sample.json
```

7. **Start the development server**
```bash
# Using Daphne (supports WebSockets)
daphne -b 0.0.0.0 -p 8000 devfest_qna.asgi:application

# Alternative: Django's runserver (no WebSocket support)
python manage.py runserver  # Not recommended
```

The server will be available at `http://localhost:8000`

## API Documentation

### Authentication Endpoints

**Register Attendee**
```http
POST /api/auth/register-audience/
Content-Type: application/json

{
  "username": "attendee1",
  "password": "password123",
  "display_name": "Jane Smith"
}

Response: 201 Created
{
  "token": "abc123...",
  "username": "attendee1",
  "display_name": "Jane Smith",
  "is_speaker": false
}
```

**Login Attendee**
```http
POST /api/auth/login-audience/
Content-Type: application/json

{
  "username": "attendee1",
  "password": "password123"
}

Response: 200 OK
{
  "token": "abc123...",
  "username": "attendee1",
  "display_name": "Jane Smith",
  "is_speaker": false
}
```

**Login Speaker**
```http
POST /api/auth/login/
Content-Type: application/json

{
  "username": "speaker1",
  "password": "devfest2024"
}

Response: 200 OK
{
  "token": "def456..."
}
```

**Logout**
```http
POST /api/auth/logout/
Authorization: Token abc123...

Response: 200 OK
{
  "message": "Successfully logged out"
}
```

### Session Endpoints

**List Sessions**
```http
GET /api/sessions/
Authorization: Token abc123...

Response: 200 OK
[
  {
    "id": 1,
    "title": "Opening Keynote",
    "description": "Welcome to DevFest",
    "speakers": ["John Doe", "Jane Smith"],
    "start_time": "2025-11-20T09:00:00Z"
  }
]
```

### Question Endpoints

**List Questions for Session**
```http
GET /api/questions/?session=1
Authorization: Token abc123...

Response: 200 OK
[
  {
    "id": 1,
    "question_text": "What topics will be covered?",
    "answer_text": null,
    "is_answered": false,
    "username": "attendee1",
    "session": 1,
    "created_at": "2025-11-20T09:15:00Z"
  }
]
```

**Submit Question (Attendees)**
```http
POST /api/questions/
Authorization: Token abc123...
Content-Type: application/json

{
  "session": 1,
  "question_text": "What is the session schedule?"
}

Response: 201 Created
{
  "id": 2,
  "question_text": "What is the session schedule?",
  "answer_text": null,
  "is_answered": false,
  "username": "attendee1",
  "session": 1
}
```

**Answer Question (Speakers Only)**
```http
PATCH /api/questions/2/
Authorization: Token def456...
Content-Type: application/json

{
  "answer_text": "The session runs from 9:00 AM to 10:30 AM",
  "is_answered": true
}

Response: 200 OK
{
  "id": 2,
  "question_text": "What is the session schedule?",
  "answer_text": "The session runs from 9:00 AM to 10:30 AM",
  "is_answered": true,
  "username": "attendee1",
  "session": 1
}
```

## WebSocket Usage

### Connecting to a Session

```javascript
const sessionId = 1;
const ws = new WebSocket(`ws://localhost:8000/ws/session/${sessionId}/`);

ws.onopen = () => {
  console.log('Connected to session');
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === 'question_update') {
    console.log('New/Updated question:', data.question);
    // Update UI with new question or answer
  }
};

ws.onerror = (error) => {
  console.error('WebSocket error:', error);
};

ws.onclose = () => {
  console.log('Disconnected from session');
};
```

### Event Types
- `question_update`: Broadcast when a new question is submitted or an answer is added
- Automatic reconnection recommended for production use

## Configuration

### Environment Variables

**Required**
- `SECRET_KEY`: Django secret key for cryptographic signing
- `DEBUG`: Set to `False` in production
- `ALLOWED_HOSTS`: Comma-separated list of allowed hostnames
- `DATABASE_URL`: PostgreSQL connection string (production)

**Optional**
- `CORS_ORIGINS`: Comma-separated list of allowed CORS origins
- `REDIS_URL`: Redis connection string for channel layers

### Channel Layers

**Development (In-Memory)**
```python
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels.layers.InMemoryChannelLayer'
    },
}
```

**Production (Redis)**
```python
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            "hosts": [('localhost', 6379)],
        },
    },
}
```

## Production Deployment

### Database Migration

Switch from SQLite to PostgreSQL for production:

1. Install PostgreSQL adapter:
```bash
pip install psycopg2-binary dj-database-url
```

2. Update settings:
```python
import dj_database_url

DATABASES = {
    'default': dj_database_url.config(
        default=os.environ.get('DATABASE_URL'),
        conn_max_age=600
    )
}
```

### ASGI Server Setup

Use Daphne with proper process management:

**Procfile (for Render/Heroku)**
```
web: daphne -b 0.0.0.0 -p $PORT devfest_qna.asgi:application
```

**Systemd Service**
```ini
[Unit]
Description=DevFest QnA ASGI Server
After=network.target

[Service]
User=www-data
WorkingDirectory=/path/to/backend
ExecStart=/path/to/venv/bin/daphne -b 0.0.0.0 -p 8000 devfest_qna.asgi:application
Restart=always

[Install]
WantedBy=multi-user.target
```

### Security Checklist

- [ ] Set `DEBUG = False`
- [ ] Use strong `SECRET_KEY`
- [ ] Configure `ALLOWED_HOSTS`
- [ ] Use HTTPS/WSS in production
- [ ] Enable CORS only for trusted origins
- [ ] Use PostgreSQL instead of SQLite
- [ ] Set up Redis for channel layers
- [ ] Configure proper firewall rules
- [ ] Enable SSL certificate
- [ ] Set up monitoring and logging

## Performance Considerations

### Database Optimization
- Add indexes on frequently queried fields (session, created_at, is_answered)
- Use `select_related()` and `prefetch_related()` for related queries
- Enable connection pooling for high traffic

### WebSocket Scaling
- Use Redis channel layer for multi-server deployments
- Configure Redis persistence for reliability
- Consider horizontal scaling with load balancer

### Expected Performance
- **SQLite (Development)**: 50-100 concurrent users, ~200 RPS
- **PostgreSQL + Redis**: 500+ concurrent users, 1000+ RPS

## Testing

### Load Testing

Use the included Locust configuration:

```bash
cd ../load_testing
locust -f locustfile.py --host=http://localhost:8000
```

Open `http://localhost:8089` and configure:
- Number of users: 100-500
- Spawn rate: 10-20 users/second

### Unit Tests

```bash
python manage.py test
```

## Troubleshooting

### WebSocket Connection Issues
- Verify Daphne is running (not Django runserver)
- Check Redis connection if using Redis channel layer
- Ensure CORS settings allow WebSocket upgrade

### Database Lock Errors
- Switch to PostgreSQL for concurrent writes
- SQLite only supports single writer at a time

### Authentication Failures
- Verify token is included in Authorization header
- Check token hasn't been deleted from database
- Ensure user has appropriate permissions (is_speaker flag)

## Project Structure

```
backend/
├── devfest_qna/          # Project configuration
│   ├── settings.py       # Django settings
│   ├── settings_prod.py  # Production settings
│   ├── urls.py           # URL routing
│   ├── asgi.py          # ASGI configuration
│   └── wsgi.py          # WSGI configuration (not used)
├── qna_app/             # Main application
│   ├── models.py        # Database models
│   ├── views.py         # API views
│   ├── serializers.py   # DRF serializers
│   ├── consumers.py     # WebSocket consumers
│   ├── routing.py       # WebSocket routing
│   ├── permissions.py   # Custom permissions
│   ├── urls.py          # App URL patterns
│   └── admin.py         # Admin configuration
├── manage.py            # Django CLI
├── requirements.txt     # Python dependencies
├── Procfile            # Deployment configuration
└── runtime.txt         # Python version specification
```

## Contributing

This project was built for DevFest conference sessions. Contributions are welcome for:
- Bug fixes and performance improvements
- Additional authentication methods
- Enhanced WebSocket features
- Better error handling and logging
- Documentation improvements

## License

This project is part of the DevFest Q&A application and follows standard open-source practices.

## Support

For issues, questions, or contributions, please open an issue on the GitHub repository.

## Related Projects

- **Frontend**: React + TypeScript application (see `/frontend` directory)
- **Load Testing**: Locust configuration (see `/load_testing` directory)
- **Deployment Guide**: See `DEPLOYMENT_GUIDE.md` for production setup

## Version History

**v1.0** - Initial release
- Basic Q&A functionality
- WebSocket real-time updates
- Token authentication
- Multi-session support
