import io
from datetime import datetime, time, timedelta
from email.mime.image import MIMEImage
from typing import Any

from django.core.mail import EmailMultiAlternatives
from django.db.models import Count
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from screenings.hashing import generate_secret_salt_and_hash
from screenings.models import Hall, Movie, Screening, Seat, Ticket
from screenings.permissions import IsAdminUser, IsStaffUser
from screenings.qr import qr_encode
from screenings.serializers import (
    HallSerializer,
    MovieSerializer,
    RichTicketSerializer,
    ScreeningSerializer,
    SeatSerializer,
    TicketCreateSerializer,
    TicketDetailSerializer,
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
    queryset = Screening.objects.all().annotate(
        tickets_count_annotated=Count('tickets')
    )
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

        queryset = queryset.annotate(tickets_count_annotated=Count('tickets'))
        return queryset

    @action(detail=False, methods=['get'])
    def showing_today(self, request):
        today = datetime.now().date()
        tomorrow = today + timedelta(1)
        today_start = datetime.combine(today, time())
        today_end = datetime.combine(tomorrow, time())
        queryset = Screening.objects.filter(
            start_time__lte=today_end,
            start_time__gte=today_start,
        ).annotate(tickets_count_annotated=Count('tickets'))
        serializer = ScreeningSerializer(queryset, many=True)
        return Response(serializer.data)


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

    def get_serializer_class(self):  # type: ignore[override]
        if self.action in ['create', 'update', 'partial_update']:
            return TicketCreateSerializer
        return TicketDetailSerializer

    def get_permissions(self):
        if self.action in [
            'create',
            'list',
            'retrieve',
            'my_tickets',
            're_issue',
        ]:
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
        if screening_id:
            return Ticket.objects.filter(screening_id=screening_id)
        return Ticket.objects.filter(client=user)

    def perform_create(self, serializer):
        secret, salt, s_hash = generate_secret_salt_and_hash()

        user: Any = self.request.user
        is_staff_or_admin = (
            user.is_superuser
            or user.groups.filter(name__in=['Staff', 'Admin']).exists()
        )
        request: Any = self.request
        if is_staff_or_admin and 'client' in request.data:
            instance = serializer.save(secret_hash=s_hash, salt=salt)
        else:
            instance = serializer.save(
                secret_hash=s_hash, salt=salt, client=user
            )

        self._send_ticket_email(instance, secret)

    def _send_ticket_email(self, instance, secret):
        email_user = instance.client
        data = {
            'id': instance.pk,
            'secret': secret,
        }
        qr_img = qr_encode(data)

        buffer = io.BytesIO()
        qr_img.save(buffer, kind='PNG')
        buffer.seek(0)
        image_data = buffer.read()

        html_content = render_to_string(
            'ticket_mail.html', {'first_name': email_user.first_name}
        )
        text_content = strip_tags(html_content)

        msg = EmailMultiAlternatives(
            "Secret", text_content, "from@example.com", [email_user.email]
        )
        msg.attach_alternative(html_content, "text/html")
        mime_image = MIMEImage(image_data)
        mime_image.add_header('Content-ID', '<ticket_qr>')
        msg.attach(mime_image)

        msg.send()

    @action(detail=False, methods=['get'])
    def my_tickets(self, request):
        queryset = self.get_queryset()
        serializer = RichTicketSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['patch'])
    def re_issue(self, request, pk=None):
        instance = self.get_object()
        secret, salt, s_hash = generate_secret_salt_and_hash()

        instance.salt = salt
        instance.secret_hash = s_hash
        instance.save()

        self._send_ticket_email(instance, secret)

        return Response(
            {"status": "ticket re-issued"}, status=status.HTTP_200_OK
        )
