from typing import Any
from rest_framework import viewsets, permissions
from screenings.models import Movie, Hall, Screening, Ticket
from screenings.serializers import MovieSerializer, HallSerializer, ScreeningSerializer, TicketSerializer
from screenings.permissions import IsAdminUser, IsStaffUser

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
    permission_classes = [IsAdminUser]

class ScreeningViewSet(viewsets.ModelViewSet):
    queryset = Screening.objects.all()
    serializer_class = ScreeningSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            permission_classes = [permissions.AllowAny]
        else:
            permission_classes = [IsAdminUser]
        return [permission() for permission in permission_classes]

class TicketViewSet(viewsets.ModelViewSet):
    queryset = Ticket.objects.all()
    serializer_class = TicketSerializer

    def get_permissions(self):
        if self.action == 'create':
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
        if u.is_superuser or u.groups.filter(name__in=['Staff', 'Admin']).exists():
            return Ticket.objects.all()
        return Ticket.objects.filter(client=u)

    def perform_create(self, serializer):
        serializer.save(client=self.request.user)
