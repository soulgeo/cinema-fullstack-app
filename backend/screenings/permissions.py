from typing import Any
from rest_framework import permissions

class IsAdminUser(permissions.BasePermission):
    def has_permission(self, request: Any, view: Any) -> bool:  # type: ignore[override]
        user: Any = request.user
        return bool(
            user and (
                user.is_superuser or 
                user.groups.filter(name='Admin').exists()
            )
        )

class IsStaffUser(permissions.BasePermission):
    def has_permission(self, request: Any, view: Any) -> bool:  # type: ignore[override]
        user: Any = request.user
        return bool(
            user and (
                user.is_superuser or 
                user.groups.filter(name__in=['Staff', 'Admin']).exists()
            )
        )
