from rest_framework import permissions


class IsAdminUser(permissions.BasePermission):
    """Allow access only to admin users (role='admin' or is_staff)."""

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and (request.user.role == 'admin' or request.user.is_staff)
        )


class IsAdminOrReadOnly(permissions.BasePermission):
    """Read-only for everyone. Write access for admins only."""

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return (
            request.user
            and request.user.is_authenticated
            and (request.user.role == 'admin' or request.user.is_staff)
        )


class IsJudge(permissions.BasePermission):
    """Allow access only to judges."""

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == 'judge'
        )


class IsJudgeOrAdmin(permissions.BasePermission):
    """Allow access to judges and admins."""

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role in ('judge', 'admin')
        )