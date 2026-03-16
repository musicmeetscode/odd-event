from rest_framework import permissions


class IsSpeakerOrReadOnly(permissions.BasePermission):
    """
    Custom permission to allow read only access to all users,
    but only allow write access (POST, PUT, DELETE) to speakers
    """

    def has_permission(self, request, view):
        # Allow read access to everyone (GET, HEAD, OPTIONS)
        if request.method in permissions.SAFE_METHODS:
            return True

        return request.user and request.user.is_authenticated and request.user.is_speaker