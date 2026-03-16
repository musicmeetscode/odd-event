from django.urls import re_path
from typing import Any, cast
from . import consumers

# Defines which Consumers handle which WebSocket URL patterns
websocket_urlpatterns = [
    # Example: ws://127.0.0.1:8000/ws/session/1/
    re_path(r'ws/session/(?P<session_id>\w+)/$', cast(Any, consumers.QuestionConsumer.as_asgi())),
]