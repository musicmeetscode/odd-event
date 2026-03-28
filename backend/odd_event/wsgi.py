"""
WSGI config for odd_event project.
"""

import os

from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'odd_event.settings')

application = get_wsgi_application()
