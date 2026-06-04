from datetime import timedelta
from decimal import Decimal
from typing import Any

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Hall, Movie, Screening, Seat, Ticket, Purchase
from .hashing import generate_secret_salt_and_hash

User = get_user_model()


class CinemaAPITestCase(APITestCase):
    def setUp(self):
        # Create groups
        self.staff_group, _ = Group.objects.get_or_create(name='Staff')
        self.admin_group, _ = Group.objects.get_or_create(name='Admin')

        # Create users - cast Manager to Any for create_user
        mgr: Any = User.objects
        self.audience_user = mgr.create_user(
            email='audience@test.com', 
            password='password',
            first_name='Audience',
            last_name='User',
            phone_number='+1111111111'
        )
        self.staff_user = mgr.create_user(
            email='staff@test.com', 
            password='password',
            first_name='Staff',
            last_name='User',
            phone_number='+2222222222'
        )
        self.staff_user.groups.add(self.staff_group)
        self.admin_user = mgr.create_user(
            email='admin@test.com', 
            password='password',
            first_name='Admin',
            last_name='User',
            phone_number='+3333333333'
        )
        self.admin_user.groups.add(self.admin_group)

        # Create initial data
        self.movie = Movie.objects.create(
            title="Inception",
            duration=timedelta(hours=2),
            release_date="2010-07-16",
        )
        self.hall = Hall.objects.create(
            name="Hall 1", rows_count=10, cols_count=10, dolby_atmos=True
        )
        self.screening = Screening.objects.create(
            movie=self.movie,
            hall=self.hall,
            start_time=timezone.now() + timedelta(days=1),
            base_price=Decimal('10.00'),
        )
        self.seat = Seat.objects.create(
            hall=self.hall, row_label="A", seat_number=1, grid_x=1, grid_y=1
        )

    def test_audience_can_view_movies_and_screenings(self):
        # Anonymous user
        response = self.client.get(reverse('movie-list'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        response = self.client.get(reverse('screening-list'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_audience_can_buy_ticket(self):
        cl: Any = self.client
        cl.force_authenticate(user=self.audience_user)
        url = reverse('ticket-list')
        scr: Any = self.screening
        st: Any = self.seat
        data = {'screening': scr.id, 'seat': st.id}
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Ticket.objects.count(), 1)
        first_ticket: Any = Ticket.objects.first()
        self.assertEqual(first_ticket.client, self.audience_user)
        self.assertIsNotNone(first_ticket.purchase)

    def test_audience_can_buy_multiple_tickets_in_one_purchase(self):
        cl: Any = self.client
        cl.force_authenticate(user=self.audience_user)
        url = reverse('purchase-list')
        
        seat2 = Seat.objects.create(
            hall=self.hall, row_label="A", seat_number=2, grid_x=1, grid_y=2
        )
        
        data = {
            'tickets': [
                {'screening': self.screening.id, 'seat': self.seat.id},
                {'screening': self.screening.id, 'seat': seat2.id},
            ]
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Purchase.objects.count(), 1)
        self.assertEqual(Ticket.objects.count(), 2)
        purchase: Any = Purchase.objects.first()
        self.assertEqual(purchase.tickets.count(), 2)
        # Check total price
        expected_price = self.screening.base_price * 2
        self.assertEqual(purchase.total_price, expected_price)

    def test_audience_cannot_create_movie(self):
        cl: Any = self.client
        cl.force_authenticate(user=self.audience_user)
        url = reverse('movie-list')
        data = {
            'title': 'Interstellar',
            'duration': '02:49:00',
            'release_date': '2014-11-07',
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_staff_can_view_all_tickets(self):
        # Create a ticket for audience
        _, salt, hash = generate_secret_salt_and_hash()
        purchase = Purchase.objects.create(client=self.audience_user)
        Ticket.objects.create(
            client=self.audience_user,
            screening=self.screening,
            seat=self.seat,
            salt=salt,
            secret_hash=hash,
            purchase=purchase
        )

        cl: Any = self.client
        cl.force_authenticate(user=self.staff_user)
        url = reverse('ticket-list')
        response: Any = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_staff_can_validate_purchase(self):
        _, salt, hash = generate_secret_salt_and_hash()
        purchase = Purchase.objects.create(client=self.audience_user)
        ticket: Any = Ticket.objects.create(
            client=self.audience_user,
            screening=self.screening,
            seat=self.seat,
            salt=salt,
            secret_hash=hash,
            purchase=purchase
        )
        cl: Any = self.client
        cl.force_authenticate(user=self.staff_user)
        url = reverse('purchase-detail', args=[purchase.id])
        data = {'status': 'PAID'}
        response = self.client.patch(url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        purchase.refresh_from_db()
        self.assertEqual(purchase.status, 'PAID')

    def test_staff_can_create_ticket_for_audience(self):
        cl: Any = self.client
        cl.force_authenticate(user=self.staff_user)
        url = reverse('ticket-list')
        scr: Any = self.screening
        st: Any = self.seat
        u: Any = self.audience_user
        data = {'screening': scr.id, 'seat': st.id, 'client': u.id}
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        first_ticket: Any = Ticket.objects.first()
        self.assertEqual(first_ticket.client, self.audience_user)

    def test_admin_full_crud_movie(self):
        cl: Any = self.client
        cl.force_authenticate(user=self.admin_user)
        # Create
        url = reverse('movie-list')
        data = {
            'title': 'Interstellar',
            'description': 'Space',
            'producer': 'Chris Nolan',
            'duration': '02:49:00',
            'release_date': '2014-11-07',
            'rating': 'PG-13',
        }
        response: Any = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # Update
        movie_id = response.data['id']
        url = reverse('movie-detail', args=[movie_id])
        response = self.client.put(url, {**data, 'title': 'Interstellar Redux'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Delete
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_audience_sees_only_own_tickets(self):
        # Ticket for audience
        _, salt, hash = generate_secret_salt_and_hash()
        purchase = Purchase.objects.create(client=self.audience_user)
        Ticket.objects.create(
            client=self.audience_user,
            screening=self.screening,
            seat=self.seat,
            salt=salt,
            secret_hash=hash,
            purchase=purchase
        )

        # Another user and their ticket
        mgr: Any = User.objects
        other_user = mgr.create_user(
            email='other@test.com', 
            password='password',
            first_name='Other',
            last_name='User',
            phone_number='+4444444444'
        )
        other_seat = Seat.objects.create(
            hall=self.hall, row_label="A", seat_number=2, grid_x=1, grid_y=2
        )
        _, salt, hash = generate_secret_salt_and_hash()
        other_purchase = Purchase.objects.create(client=other_user)
        Ticket.objects.create(
            client=other_user,
            screening=self.screening,
            seat=other_seat,
            salt=salt,
            secret_hash=hash,
            purchase=other_purchase
        )

        cl: Any = self.client
        cl.force_authenticate(user=self.audience_user)
        url = reverse('ticket-list')
        response: Any = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        u: Any = self.audience_user
        self.assertEqual(response.data[0]['client'], u.id)

    def test_staff_can_re_issue_ticket(self):
        _, salt, hash = generate_secret_salt_and_hash()
        purchase = Purchase.objects.create(client=self.audience_user, status='PAID')
        ticket: Any = Ticket.objects.create(
            client=self.audience_user,
            screening=self.screening,
            seat=self.seat,
            salt=salt,
            secret_hash=hash,
            purchase=purchase
        )
        old_hash = ticket.secret_hash
        old_salt = ticket.salt

        cl: Any = self.client
        cl.force_authenticate(user=self.staff_user)
        url = reverse('ticket-re-issue', args=[ticket.id])
        response = self.client.patch(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        ticket.refresh_from_db()
        self.assertNotEqual(ticket.secret_hash, old_hash)
        self.assertNotEqual(ticket.salt, old_salt)
