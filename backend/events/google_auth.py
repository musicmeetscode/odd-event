from django.conf import settings
from google.oauth2 import id_token
from google.auth.transport import requests

def verify_google_token(token: str):
    """
    Verifies a Google ID token and returns the user information.
    """
    try:
        # Specify the CLIENT_ID of the app that accesses the backend:
        idinfo = id_token.verify_oauth2_token(
            token, 
            requests.Request(), 
            settings.GOOGLE_CLIENT_ID
        )

        # ID token is valid. Get the user's Google Account ID from the decoded token.
        # userid = idinfo['sub']
        return idinfo
    except ValueError:
        # Invalid token
        return None
