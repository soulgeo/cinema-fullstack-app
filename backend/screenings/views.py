from typing import Any

from rest_framework import permissions, viewsets

from screenings.models import Hall, Movie, Screening, Seat, Ticket
from screenings.permissions import IsAdminUser, IsStaffUser
from screenings.serializers import (
    HallSerializer,
    MovieSerializer,
    ScreeningSerializer,
    SeatSerializer,
    TicketSerializer,
)


class MovieViewSet(viewsets.ModelViewSet):
    queryset = Movie.objects.all()
    serializer_class = MovieSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            permission_classes = [permissions.AllowAny]
        else:
            permission_classes = [IsAdminUser]
        return [permission() for permission in permission_classes]


class HallViewSet(viewsets.ModelViewSet):
    queryset = Hall.objects.all()
    serializer_class = HallSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            permission_classes = [permissions.AllowAny]
        else:
            permission_classes = [IsAdminUser]
        return [permission() for permission in permission_classes]


class ScreeningViewSet(viewsets.ModelViewSet):
    queryset = Screening.objects.all()
    serializer_class = ScreeningSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            permission_classes = [permissions.AllowAny]
        else:
            permission_classes = [IsAdminUser]
        return [permission() for permission in permission_classes]


class SeatViewSet(viewsets.ModelViewSet):
    queryset = Seat.objects.all()
    serializer_class = SeatSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            permission_classes = [permissions.AllowAny]
        else:
            permission_classes = [IsAdminUser]
        return [permission() for permission in permission_classes]

    def get_queryset(self) -> Any:  # type: ignore[override]
        queryset = Seat.objects.all()
        r: Any = self.request
        hall_id = r.query_params.get('hall')
        if hall_id is not None:
            queryset = queryset.filter(hall_id=hall_id)
        return queryset


class TicketViewSet(viewsets.ModelViewSet):
    queryset = Ticket.objects.all()
    serializer_class = TicketSerializer

    def get_permissions(self):
        if self.action in ['create', 'list', 'retrieve']:
            permission_classes = [permissions.IsAuthenticated]
        elif self.action in ['update', 'partial_update']:
            permission_classes = [IsStaffUser]
        else:
            permission_classes = [IsStaffUser]
        return [permission() for permission in permission_classes]

    def get_queryset(self) -> Any:  # type: ignore[override]
        user = self.request.user
        if not user.is_authenticated:
            return Ticket.objects.none()

        u: Any = user
        if (
            u.is_superuser
            or u.groups.filter(name__in=['Staff', 'Admin']).exists()
        ):
            return Ticket.objects.all()
        return Ticket.objects.filter(client=u)

    def perform_create(self, serializer):
        user = self.request.user
        u: Any = user
        is_staff_or_admin = (
            u.is_superuser
            or u.groups.filter(name__in=['Staff', 'Admin']).exists()
        )
        req: Any = self.request
        if is_staff_or_admin and 'client' in req.data:
            serializer.save()
        else:
            serializer.save(client=user)
