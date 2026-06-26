from datetime import datetime, time, timedelta
from typing import Any

from django.db.models import Count, Q
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from screenings.hashing import generate_secret_salt_and_hash
from screenings.models import Hall, Movie, Purchase, Screening, Seat, Ticket
from screenings.permissions import IsAdminUser, IsStaffUser
from screenings.utils import send_ticket_email
from screenings.serializers import (
    HallSerializer,
    MovieSerializer,
    PurchaseCreateSerializer,
    PurchaseSerializer,
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
        hall_id = request.query_params.get('hall')
        date_str = request.query_params.get('date')
        genres_str = request.query_params.get('genres')
        time_min = request.query_params.get('time_min')
        time_max = request.query_params.get('time_max')

        if movie_id:
            queryset = queryset.filter(movie_id=movie_id)
        
        if hall_id:
            queryset = queryset.filter(hall_id=hall_id)

        if date_str:
            try:
                date_val = datetime.strptime(date_str, '%Y-%m-%d').date()
                queryset = queryset.filter(start_time__date=date_val)
            except ValueError:
                pass

        if genres_str:
            genres = genres_str.split(',')
            genre_queries = Q()
            for genre in genres:
                genre_queries |= Q(movie__genres__icontains=genre.strip())
            queryset = queryset.filter(genre_queries)

        if time_min:
            try:
                h = float(time_min)
                queryset = queryset.filter(start_time__hour__gte=int(h))
            except ValueError:
                pass

        if time_max:
            try:
                h = float(time_max)
                queryset = queryset.filter(start_time__hour__lte=int(h))
            except ValueError:
                pass

        queryset = queryset.annotate(tickets_count_annotated=Count('tickets'))
        return queryset

    @action(detail=False, methods=['get'])
    def screening_dates(self, request):
        dates = (
            Screening.objects.all()
            .values_list('start_time__date', flat=True)
            .distinct()
        )
        return Response(list(dates))

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


class PurchaseViewSet(viewsets.ModelViewSet):
    queryset = Purchase.objects.all()

    def get_serializer_class(self):
        if self.action == 'create':
            return PurchaseCreateSerializer
        return PurchaseSerializer

    def get_permissions(self):
        if self.action in ['create', 'list', 'retrieve']:
            permission_classes = [permissions.IsAuthenticated]
        else:
            permission_classes = [IsStaffUser]
        return [permission() for permission in permission_classes]

    def get_queryset(self):
        user: Any = self.request.user
        request: Any = self.request
        queryset = Purchase.objects.filter(client=user)
        if (
            user.is_superuser
            or user.groups.filter(name__in=['Staff', 'Admin']).exists()
        ):
            queryset = Purchase.objects.all()

        from_date = request.query_params.get('from_date')
        till_date = request.query_params.get('till_date')

        if from_date:
            try:
                from_date_val = datetime.strptime(from_date, '%Y-%m-%d').date()
                queryset = queryset.filter(
                    Q(paid_at__date__gte=from_date_val) |
                    Q(paid_at__isnull=True, created_at__date__gte=from_date_val)
                )
            except ValueError:
                pass

        if till_date:
            try:
                till_date_val = datetime.strptime(till_date, '%Y-%m-%d').date()
                queryset = queryset.filter(
                    Q(paid_at__date__lte=till_date_val) |
                    Q(paid_at__isnull=True, created_at__date__lte=till_date_val)
                )
            except ValueError:
                pass

        return queryset

    def perform_create(self, serializer):
        serializer.save()


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
        user: Any = request.user
        if not user.is_authenticated:
            return Ticket.objects.none()

        queryset = Ticket.objects.filter(client=user)
        if (
            user.is_superuser
            or user.groups.filter(name__in=['Staff', 'Admin']).exists()
        ):
            queryset = Ticket.objects.all()

        screening_id = request.query_params.get('screening')
        from_date = request.query_params.get('from_date')
        till_date = request.query_params.get('till_date')

        if screening_id:
            queryset = queryset.filter(screening_id=screening_id)

        if from_date:
            try:
                from_date_val = datetime.strptime(from_date, '%Y-%m-%d').date()
                queryset = queryset.filter(created_at__date__gte=from_date_val)
            except ValueError:
                pass

        if till_date:
            try:
                till_date_val = datetime.strptime(till_date, '%Y-%m-%d').date()
                queryset = queryset.filter(created_at__date__lte=till_date_val)
            except ValueError:
                pass

        return queryset

    def perform_create(self, serializer):
        _, salt, s_hash = generate_secret_salt_and_hash()

        user: Any = self.request.user
        request: Any = self.request
        
        purchase = serializer.validated_data.get('purchase')
        if not purchase:
            purchase = Purchase.objects.create(client=user)
        
        is_staff_or_admin = (
            user.is_superuser
            or user.groups.filter(name__in=['Staff', 'Admin']).exists()
        )
        
        if is_staff_or_admin and 'client' in request.data:
            instance = serializer.save(
                secret_hash=s_hash, salt=salt, purchase=purchase
            )
        else:
            instance = serializer.save(
                secret_hash=s_hash, salt=salt, client=user, purchase=purchase
            )

        purchase.total_price += instance.price_paid
        purchase.save()

    @action(detail=False, methods=['get'])
    def my_tickets(self, request):
        queryset = Ticket.objects.filter(
            client=request.user, purchase__status=Purchase.Status.PAID
        )
        serializer = RichTicketSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['patch'])
    def re_issue(self, request, pk=None):
        instance = self.get_object()

        if instance.purchase.status != Purchase.Status.PAID:
            return Response(
                {"error": "Cannot re-issue a ticket for an unpaid purchase."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        secret, salt, s_hash = generate_secret_salt_and_hash()

        instance.salt = salt
        instance.secret_hash = s_hash
        instance.save()

        send_ticket_email(instance, secret)

        return Response(
            {"status": "ticket re-issued"}, status=status.HTTP_200_OK
        )

    @action(detail=True, methods=['post'], permission_classes=[IsStaffUser])
    def validate_ticket(self, request, pk=None):
        instance = self.get_object()
        secret = request.data.get('secret')

        if not secret:
            return Response(
                {"error": "Secret is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        from screenings.hashing import hash as hash_secret
        computed_hash = hash_secret(secret, instance.salt)

        if computed_hash != instance.secret_hash:
            return Response(
                {"error": "Invalid ticket secret."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if instance.is_used:
            return Response(
                {"error": "Ticket has already been used."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if instance.purchase.status != Purchase.Status.PAID:
            return Response(
                {"error": "Ticket belongs to an unpaid purchase."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        instance.is_used = True
        instance.save()

        serializer = RichTicketSerializer(instance)
        return Response(
            {"status": "validated", "ticket": serializer.data},
            status=status.HTTP_200_OK,
        )
