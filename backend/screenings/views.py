from typing import Any

from rest_framework import permissions, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from screenings.models import Hall, Movie, Screening, Seat, Ticket
from screenings.permissions import IsAdminUser, IsStaffUser
from screenings.serializers import (
    HallSerializer,
    MovieSerializer,
    RichTicketSerializer,
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

    def get_queryset(self) -> Any:  # type: ignore[override]
        queryset = Screening.objects.all()
        request: Any = self.request
        movie_id = request.query_params.get('movie')
        if movie_id is not None:
            queryset = queryset.filter(movie_id=movie_id)
        return queryset


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
        request: Any = self.request
        hall_id = request.query_params.get('hall')
        if hall_id is not None:
            queryset = queryset.filter(hall_id=hall_id)
        return queryset


class TicketViewSet(viewsets.ModelViewSet):
    queryset = Ticket.objects.all()
    serializer_class = TicketSerializer

    def get_permissions(self):
        if self.action in ['create', 'list', 'retrieve', 'my_tickets']:
            permission_classes = [permissions.IsAuthenticated]
        else:
            permission_classes = [IsStaffUser]
        return [permission() for permission in permission_classes]

    def get_queryset(self) -> Any:  # type: ignore[override]
        request: Any = self.request
        screening_id = request.query_params.get('screening')
        user: Any = request.user
        if not user.is_authenticated:
            return Ticket.objects.none()

        if (
            user.is_superuser
            or user.groups.filter(name__in=['Staff', 'Admin']).exists()
        ):
            return Ticket.objects.all()
        if (screening_id):
            return Ticket.objects.filter(screening_id=screening_id)
        return Ticket.objects.filter(client=user)

    def perform_create(self, serializer):
        user: Any = self.request.user
        is_staff_or_admin = (
            user.is_superuser
            or user.groups.filter(name__in=['Staff', 'Admin']).exists()
        )
        request: Any = self.request
        if is_staff_or_admin and 'client' in request.data:
            serializer.save()
        else:
            serializer.save(client=user)

    @action(detail=False, methods=['get'])
    def my_tickets(self, request):
        queryset = self.get_queryset()
        serializer = RichTicketSerializer(queryset, many=True)
        return Response(serializer.data)
