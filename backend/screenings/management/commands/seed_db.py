import random
from datetime import timedelta, date
from decimal import Decimal
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from screenings.models import Movie, Hall, Screening, Seat

User = get_user_model()

class Command(BaseCommand):
    help = 'Seeds the database with 5 halls and 12 accurate movies with valid TMDB posters'

    def handle(self, *args, **options):
        self.stdout.write('Seeding expanded cinema data with valid posters...')

        # 1. Groups and Users
        staff_group, _ = Group.objects.get_or_create(name='Staff')
        admin_group, _ = Group.objects.get_or_create(name='Admin')

        admin_user, created = User.objects.get_or_create(
            defaults={
                'email': 'admin@cinema.com',
                'is_staff': True,
                'is_superuser': True,
                'phone_number': '+1234567890',
                'date_of_birth': date(1990, 1, 1)
            }
        )
        if created:
            admin_user.set_password('admin123')
            admin_user.save()
            admin_user.groups.add(admin_group)
            self.stdout.write(f'Created admin user: admin')

        # Create some test users
        test_users = [
            {
                'email': 'jdoe@example.com',
                'first_name': 'John',
                'last_name': 'Doe',
                'phone_number': '+1555010101',
                'date_of_birth': date(1985, 5, 15)
            },
            {
                'email': 'asmith@example.com',
                'first_name': 'Adam',
                'last_name': 'Smith',
                'phone_number': '+1555020202',
                'date_of_birth': date(1995, 10, 20)
            }
        ]

        for u_data in test_users:
            user, created = User.objects.get_or_create(
                defaults=u_data
            )
            if created:
                user.set_password('password123')
                user.save()
                self.stdout.write(f"Created test user: {user.email}")

        # 2. Create 5 Halls
        halls_data = [
            {'name': 'Grand IMAX', 'rows_count': 12, 'cols_count': 16, 'dolby_atmos': True},
            {'name': 'Screen 1', 'rows_count': 8, 'cols_count': 12, 'dolby_atmos': False},
            {'name': 'Screen 2', 'rows_count': 8, 'cols_count': 12, 'dolby_atmos': False},
            {'name': 'VIP Lounge', 'rows_count': 4, 'cols_count': 6, 'dolby_atmos': True},
            {'name': 'Kids Zone', 'rows_count': 6, 'cols_count': 10, 'dolby_atmos': False},
        ]
        
        halls = []
        for h_data in halls_data:
            hall, created = Hall.objects.get_or_create(name=h_data['name'], defaults=h_data)
            halls.append(hall)
            if created:
                self.stdout.write(f'Created Hall: {hall.name}')
                # Generate seats
                for r in range(hall.rows_count):
                    row_label = chr(65 + r)
                    for c in range(1, hall.cols_count + 1):
                        seat_type = Seat.SeatType.REGULAR
                        if hall.name == 'VIP Lounge' or r >= hall.rows_count - 2:
                            seat_type = Seat.SeatType.VIP
                        
                        Seat.objects.create(
                            hall=hall,
                            row_label=row_label,
                            seat_number=c,
                            grid_x=c,
                            grid_y=r + 1,
                            seat_type=seat_type
                        )

        # 3. Create Accurate Movies with TMDB Poster URLs for May, June, and July 2026
        self.stdout.write('Clearing existing movies...')
        Movie.objects.all().delete()

        tmdb_base = "https://image.tmdb.org/t/p/w500"
        movies_data = [
            {
                'title': 'Project Hail Mary',
                'description': 'An astronaut tries to save Earth while alone in outer space.',
                'producer': 'Phil Lord, Christopher Miller',
                'release_date': '2026-03-20',
                'duration': timedelta(hours=2, minutes=15),
                'rating': 'PG-13',
                'genres': 'Sci-Fi, Adventure',
                'poster_url': f'{tmdb_base}/yihdXomYb5kTeSivtFndMy5iDmf.jpg'
            },
            {
                'title': 'The Super Mario Galaxy Movie',
                'description': 'Mario and friends travel through space to save the galaxy.',
                'producer': 'Chris Meledandri',
                'release_date': '2026-04-01',
                'duration': timedelta(hours=1, minutes=45),
                'rating': 'PG',
                'genres': 'Animation, Adventure, Comedy',
                'poster_url': f'{tmdb_base}/eJGWx219ZcEMVQJhAgMiqo8tYY.jpg'
            },
            {
                'title': "Lee Cronin's The Mummy",
                'description': 'A new take on the ancient Egyptian curse.',
                'producer': 'Lee Cronin',
                'release_date': '2026-04-17',
                'duration': timedelta(hours=1, minutes=55),
                'rating': 'R',
                'genres': 'Horror, Fantasy, Action',
                'poster_url': f'{tmdb_base}/uIb9Tvae5haF0XcQBaPyufmxbb0.jpg'
            },
            {
                'title': 'Michael',
                'description': 'The definitive biopic of the King of Pop, chronicling his rise from the Jackson 5 to global superstardom.',
                'producer': 'Graham King, Antoine Fuqua',
                'release_date': '2026-04-24',
                'duration': timedelta(hours=2, minutes=30),
                'rating': 'PG-13',
                'genres': 'Drama, Music, History',
                'poster_url': f'https://glamournepal.com/wp-content/uploads/2025/11/Michael-Biopic-Film-Poster-2026.jpg'
            },
            {
                'title': 'Mortal Kombat II',
                'description': 'The tournament continues with new fighters and higher stakes.',
                'producer': 'James Wan',
                'release_date': '2026-05-08',
                'duration': timedelta(hours=2, minutes=10),
                'rating': 'R',
                'genres': 'Action, Fantasy',
                'poster_url': f'{tmdb_base}/lIsMeDbwntNXSUVHmWMMRXEZOVc.jpg'
            },
            {
                'title': 'Masters of the Universe',
                'description': 'Prince Adam / He-Man must protect Eternia from the dark forces of Skeletor.',
                'producer': 'Travis Knight',
                'release_date': '2026-06-05',
                'duration': timedelta(hours=2, minutes=5),
                'rating': 'PG-13',
                'genres': 'Action, Fantasy, Adventure',
                'poster_url': f'https://cdn.kinocheck.com/i/93nua8uz97.jpg'
            },
            {
                'title': 'Toy Story 5',
                'description': 'Woody, Buzz, and the gang return for another adventure.',
                'producer': 'Andrew Stanton',
                'release_date': '2026-06-19',
                'duration': timedelta(hours=1, minutes=40),
                'rating': 'G',
                'genres': 'Animation, Adventure, Family',
                'poster_url': f'{tmdb_base}/i4UtdsApMwXQkGD2mBDroJSJZsk.jpg'
            },
            {
                'title': 'Moana (Live-Action)',
                'description': 'A young woman sets sail on a daring mission to save her people.',
                'producer': 'Dwayne Johnson',
                'release_date': '2026-07-10',
                'duration': timedelta(hours=2, minutes=0),
                'rating': 'PG',
                'genres': 'Adventure, Fantasy, Family',
                'poster_url': f'{tmdb_base}/aLVkiINlIeCkcZIzb7XHzPYgO6L.jpg'
            },
            {
                'title': 'Spider-Man: Brand New Day',
                'description': 'Peter Parker\'s life is reset after the events of No Way Home.',
                'producer': 'Kevin Feige',
                'release_date': '2026-07-31',
                'duration': timedelta(hours=2, minutes=20),
                'rating': 'PG-13',
                'genres': 'Action, Adventure, Sci-Fi',
                'poster_url': f'{tmdb_base}/ucQ0QBXXQPSxeUmWfh4YQenIuB9.jpg'
            },
        ]

        movies = []
        for m_data in movies_data:
            movie, created = Movie.objects.update_or_create(
                title=m_data['title'],
                defaults=m_data
            )
            movies.append(movie)
            if created:
                self.stdout.write(f'Created Movie: {movie.title}')
            else:
                self.stdout.write(f'Updated Movie: {movie.title}')

        # 4. Create Screenings for the next 7 days
        self.stdout.write('Generating screenings for the next week...')
        start_date = timezone.now().replace(hour=10, minute=0, second=0, microsecond=0)
        
        for day_offset in range(7):
            current_day = start_date + timedelta(days=day_offset)
            for hall in halls:
                for slot in range(4):
                    movie = random.choice(movies)
                    start_time = current_day + timedelta(hours=slot * 3.5)
                    
                    if not Screening.objects.filter(hall=hall, start_time=start_time).exists():
                        Screening.objects.create(
                            movie=movie,
                            hall=hall,
                            start_time=start_time,
                            base_price=Decimal('15.00') if hall.dolby_atmos else Decimal('10.00')
                        )

        self.stdout.write(self.style.SUCCESS('Seeding complete!'))
