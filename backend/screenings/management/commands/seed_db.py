import random
from datetime import timedelta
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
            username='admin',
            defaults={'email': 'admin@cinema.com', 'is_staff': True, 'is_superuser': True}
        )
        if created:
            admin_user.set_password('admin123')
            admin_user.save()
            admin_user.groups.add(admin_group)
            self.stdout.write(f'Created admin user: admin')

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

        # 3. Create 12 Accurate Movies with TMDB Poster URLs
        tmdb_base = "https://image.tmdb.org/t/p/w500"
        movies_data = [
            {
                'title': 'The Fall Guy',
                'description': 'A battered stuntman springs back into action.',
                'producer': 'David Leitch',
                'release_date': '2024-05-03',
                'duration': timedelta(hours=2, minutes=6),
                'rating': 'PG-13',
                'genres': 'Action, Comedy',
                'poster_url': f'{tmdb_base}/ez7xavvDr5yDz4sSvI55xDp0BoU.jpg'
            },
            {
                'title': 'Kingdom of the Planet of the Apes',
                'description': 'Many years after the reign of Caesar, a young ape goes on a journey that will lead him to question everything.',
                'producer': 'Wes Ball',
                'release_date': '2024-05-10',
                'duration': timedelta(hours=2, minutes=25),
                'rating': 'PG-13',
                'genres': 'Sci-Fi, Action',
                'poster_url': f'{tmdb_base}/gKkl37BQuKTanygYQG1pyYgLVgf.jpg'
            },
            {
                'title': 'Furiosa: A Mad Max Saga',
                'description': 'The origin story of renegade warrior Furiosa before she teamed up with Mad Max.',
                'producer': 'George Miller',
                'release_date': '2024-05-24',
                'duration': timedelta(hours=2, minutes=28),
                'rating': 'R',
                'genres': 'Action, Adventure',
                'poster_url': f'{tmdb_base}/iADOJ8Zymht2JPMoy3R7xceZprc.jpg'
            },
            {
                'title': 'Civil War',
                'description': 'A journey across a futuristic hostile America with a team of military-embedded journalists.',
                'producer': 'Alex Garland',
                'release_date': '2024-04-12',
                'duration': timedelta(hours=1, minutes=49),
                'rating': 'R',
                'genres': 'Action, Sci-Fi',
                'poster_url': f'{tmdb_base}/bX2xnavhMYjWDoZp1VM6VnU1xwe.jpg'
            },
            {
                'title': 'Challengers',
                'description': 'Tashi, a former tennis prodigy turned coach, is married to a champion on a losing streak.',
                'producer': 'Luca Guadagnino',
                'release_date': '2024-04-26',
                'duration': timedelta(hours=2, minutes=11),
                'rating': 'R',
                'genres': 'Drama, Sport',
                'poster_url': f'{tmdb_base}/H6vke7zGfvqJ9Y60Wygnp39sC0.jpg'
            },
            {
                'title': 'Inside Out 2',
                'description': 'Riley, now a teenager, encounters new Emotions.',
                'producer': 'Kelsey Mann',
                'release_date': '2024-06-14',
                'duration': timedelta(hours=1, minutes=36),
                'rating': 'PG',
                'genres': 'Animation, Adventure',
                'poster_url': f'{tmdb_base}/vpnVM9B6NMmQpWeZvzLvDESb2QY.jpg'
            },
            {
                'title': 'Deadpool & Wolverine',
                'description': 'A weary Wolverine finds himself recovering from his injuries when he comes across a loudmouth Deadpool.',
                'producer': 'Shawn Levy',
                'release_date': '2024-07-26',
                'duration': timedelta(hours=2, minutes=7),
                'rating': 'R',
                'genres': 'Action, Comedy, Sci-Fi',
                'poster_url': f'{tmdb_base}/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg'
            },
            {
                'title': 'Joker: Folie à Deux',
                'description': 'Arthur Fleck is institutionalized at Arkham awaiting trial for his crimes as Joker.',
                'producer': 'Todd Phillips',
                'release_date': '2024-10-04',
                'duration': timedelta(hours=2, minutes=18),
                'rating': 'R',
                'genres': 'Crime, Drama, Music',
                'poster_url': f'{tmdb_base}/aciP8Km0waTLXEYf5ybFK5CSUxl.jpg'
            },
            {
                'title': 'Gladiator II',
                'description': 'After his home is conquered by the tyrannical Emperors who now lead Rome, Lucius is forced to enter the Colosseum.',
                'producer': 'Ridley Scott',
                'release_date': '2024-11-22',
                'duration': timedelta(hours=2, minutes=28),
                'rating': 'R',
                'genres': 'Action, Adventure, Drama',
                'poster_url': f'{tmdb_base}/2cxhvwyEwRlysAmRH4iodkvo0z5.jpg'
            },
            {
                'title': 'Wicked',
                'description': 'The story of how a green-skinned woman framed by the Wizard of Oz becomes the Wicked Witch of the West.',
                'producer': 'Jon M. Chu',
                'release_date': '2024-11-22',
                'duration': timedelta(hours=2, minutes=40),
                'rating': 'PG',
                'genres': 'Fantasy, Musical',
                'poster_url': f'{tmdb_base}/dfdvUzj4nLZpZ37BoefqvevCMI1.jpg'
            },
            {
                'title': 'Moana 2',
                'description': 'Moana journeys to the far seas of Oceania after receiving an unexpected call from her wayfinding ancestors.',
                'producer': 'David G. Derrick Jr.',
                'release_date': '2024-11-27',
                'duration': timedelta(hours=1, minutes=40),
                'rating': 'PG',
                'genres': 'Animation, Adventure',
                'poster_url': f'{tmdb_base}/aLVkiINlIeCkcZIzb7XHzPYgO6L.jpg'
            },
            {
                'title': 'Nosferatu',
                'description': 'A gothic tale of obsession between a haunted young woman and the terrifying vampire infatuated with her.',
                'producer': 'Robert Eggers',
                'release_date': '2024-12-25',
                'duration': timedelta(hours=2, minutes=12),
                'rating': 'R',
                'genres': 'Horror, Fantasy',
                'poster_url': f'{tmdb_base}/5qGIxdEO841C0tdY8vOdLoRVrr0.jpg'
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
