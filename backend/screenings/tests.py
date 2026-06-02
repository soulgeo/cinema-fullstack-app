from datetime import timedelta
from decimal import Decimal
from django.core.exceptions import ValidationError
from django.test import TestCase
from django.utils import timezone
from django.contrib.auth import get_user_model
from .models import Movie, Hall, Screening, Seat, Ticket
from .hashing import generate_secret_salt_and_hash

User = get_user_model()

class ScreeningModelTest(TestCase):
    def setUp(self):
        self.movie = Movie.objects.create(
            title="Inception",
            description="A thief who steals corporate secrets...",
            producer="Emma Thomas",
            release_date="2010-07-16",
            duration=timedelta(hours=2, minutes=28),
            rating="PG-13"
        )
        self.hall = Hall.objects.create(
            name="Hall 1",
            rows_count=10,
            cols_count=10,
            dolby_atmos=True
        )

    def test_screening_overlap(self):
        start_time = timezone.now()
        Screening.objects.create(
            movie=self.movie,
            hall=self.hall,
            start_time=start_time,
            base_price=Decimal('10.00')
        )

        # Overlapping screening: same hall, starting during the first one
        overlap_screening = Screening(
            movie=self.movie,
            hall=self.hall,
            start_time=start_time + timedelta(hours=1),
            base_price=Decimal('10.00')
        )
        
        with self.assertRaises(ValidationError):
            overlap_screening.full_clean()
            overlap_screening.save()

    def test_non_overlapping_screening(self):
        start_time = timezone.now()
        Screening.objects.create(
            movie=self.movie,
            hall=self.hall,
            start_time=start_time,
            base_price=Decimal('10.00')
        )

        # Non-overlapping screening: same hall, starting after the first one ends
        ok_screening = Screening(
            movie=self.movie,
            hall=self.hall,
            start_time=start_time + self.movie.duration + timedelta(minutes=1),
            base_price=Decimal('10.00')
        )
        
        # This should NOT raise ValidationError
        ok_screening.full_clean()
        ok_screening.save()


class TicketModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@test.com', 
            password='password',
            first_name='Test',
            last_name='User',
            phone_number='+9999999999'
        )
        self.movie = Movie.objects.create(
            title="Inception",
            duration=timedelta(hours=2),
            release_date="2010-07-16"
        )
        self.hall = Hall.objects.create(name="Hall 1", rows_count=10, cols_count=10, dolby_atmos=True)
        self.screening = Screening.objects.create(
            movie=self.movie,
            hall=self.hall,
            start_time=timezone.now(),
            base_price=Decimal('10.00')
        )
        self.regular_seat = Seat.objects.create(
            hall=self.hall, row_label="A", seat_number=1, grid_x=1, grid_y=1,
            seat_type=Seat.SeatType.REGULAR
        )
        self.vip_seat = Seat.objects.create(
            hall=self.hall, row_label="B", seat_number=1, grid_x=1, grid_y=2,
            seat_type=Seat.SeatType.VIP
        )

    def test_ticket_price_calculation_regular(self):
        _, salt, hash = generate_secret_salt_and_hash()
        ticket = Ticket.objects.create(
            client=self.user,
            screening=self.screening,
            seat=self.regular_seat,
            salt=salt,
            secret_hash=hash
        )
        self.assertEqual(ticket.price_paid, Decimal('10.00'))

    def test_ticket_price_calculation_vip(self):
        _, salt, hash = generate_secret_salt_and_hash()
        ticket = Ticket.objects.create(
            client=self.user,
            screening=self.screening,
            seat=self.vip_seat,
            salt=salt,
            secret_hash=hash
        )
        # 10.00 * 1.5 = 15.00
        self.assertEqual(ticket.price_paid, Decimal('15.00'))

    def test_seat_hall_mismatch(self):
        other_hall = Hall.objects.create(name="Hall 2", rows_count=5, cols_count=5, dolby_atmos=False)
        wrong_seat = Seat.objects.create(
            hall=other_hall, row_label="A", seat_number=1, grid_x=1, grid_y=1
        )
        
        ticket = Ticket(
            client=self.user,
            screening=self.screening,
            seat=wrong_seat
        )
        
        with self.assertRaises(ValidationError):
            ticket.full_clean()
            ticket.save()
