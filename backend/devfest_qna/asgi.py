"""
ASGI config for devfest_qna project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.2/howto/deployment/asgi/
"""

import os
import django
from channels.routing import ProtocolTypeRouter, URLRouter
from django.core.asgi import get_asgi_application
from channels.auth import AuthMiddlewareStack

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'devfest_qna.settings')
django.setup()

import qna_app.routing


application = ProtocolTypeRouter({
    # Handles traditional HTTP requests (REST APIs)
    "http": get_asgi_application(), 

    # Handles WebSocket connections
    "websocket": AuthMiddlewareStack(
        URLRouter(
            qna_app.routing.websocket_urlpatterns
        )
    ),
})
