from django.urls import re_path
from typing import Any, cast
from . import consumers

websocket_urlpatterns = [
    # Q&A session WebSocket (kept)
    re_path(r'ws/session/(?P<session_id>\w+)/$', cast(Any, consumers.QuestionConsumer.as_asgi())),
    # Leaderboard WebSocket (new)
    re_path(r'ws/event/(?P<event_id>\w+)/leaderboard/$', cast(Any, consumers.LeaderboardConsumer.as_asgi())),
]