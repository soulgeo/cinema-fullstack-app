import random
from datetime import timedelta, date
from decimal import Decimal
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from screenings.models import Movie, Hall, Screening, Seat, Purchase, Ticket

User = get_user_model()

class Command(BaseCommand):
    help = 'Seeds the database with 5 halls and 12 accurate movies with valid TMDB posters'

    def handle(self, *args, **options):
        self.stdout.write('Seeding expanded cinema data with valid posters...')

        # 1. Groups and Users
        staff_group, _ = Group.objects.get_or_create(name='Staff')
        admin_group, _ = Group.objects.get_or_create(name='Admin')

        admin_user, created = User.objects.get_or_create(
            email='admin@cinema.com',
            defaults={
                'first_name': 'Admin',
                'last_name': 'User',
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
            email = u_data.pop('email')
            user, created = User.objects.get_or_create(
                email=email,
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
                'title': 'The Devil Wears Prada 2',
                'description': 'Miranda Priestly struggles to keep Runway magazine relevant while Andy and Emily navigate new roles in a digital world.',
                'producer': 'Wendy Finerman, Karen Rosenfelt',
                'release_date': '2026-05-01',
                'duration': timedelta(hours=1, minutes=59),
                'rating': 'PG-13',
                'genres': 'Comedy, Drama',
                'poster_url': f'https://cdn.moviefone.com/admin-uploads/highlights/images/the-devil-wears-prada-2-character-poster-emily-blunt_1770059722.webp'
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
                'title': 'The Sheep Detectives',
                'description': 'A flock of sheep attempts to solve the murder of their beloved shepherd, George.',
                'producer': 'Lindsay Doran, Tim Bevan, Eric Fellner',
                'release_date': '2026-05-08',
                'duration': timedelta(hours=1, minutes=49),
                'rating': 'PG',
                'genres': 'Mystery, Comedy, Family',
                'poster_url': f'https://cdn.moviefone.com/admin-uploads/highlights/images/the-sheep-detectives-official-poster_1774374465.webp'
            },
            {
                'title': 'In the Grey',
                'description': 'A covert team of elite operatives specializes in recovering stolen assets from a ruthless despot.',
                'producer': 'Guy Ritchie, Ivan Atkinson',
                'release_date': '2026-05-15',
                'duration': timedelta(hours=1, minutes=37),
                'rating': 'R',
                'genres': 'Action, Thriller, Drama',
                'poster_url': f'https://cdn.moviefone.com/admin-uploads/highlights/images/in-the-grey-official-poster_1773945137.webp'
            },
            {
                'title': 'The Mandalorian and Grogu',
                'description': 'Din Djarin and Grogu embark on a mission to rescue Rotta the Hutt for the New Republic.',
                'producer': 'Jon Favreau, Kathleen Kennedy, Dave Filoni',
                'release_date': '2026-05-22',
                'duration': timedelta(hours=2, minutes=12),
                'rating': 'PG-13',
                'genres': 'Action, Adventure, Sci-Fi',
                'poster_url': f'https://cdn.moviefone.com/admin-uploads/highlights/images/star-wars-the-mandalorian-and-grogu-official-poster_1771351937.webp'
            },
            {
                'title': 'Backrooms',
                'description': 'A furniture store owner discovers a portal to a dimension of endless yellow-walled liminal spaces.',
                'producer': 'James Wan, Shawn Levy, Peter Chernin',
                'release_date': '2026-05-29',
                'duration': timedelta(hours=1, minutes=45),
                'rating': 'R',
                'genres': 'Horror, Sci-Fi',
                'poster_url': f'https://mlpnk72yciwc.i.optimole.com/cqhiHLc.IIZS~2ef73/w:auto/h:auto/q:75/https://bleedingcool.com/wp-content/uploads/2026/03/BACKROOMS-Payoff-Poster-2.jpg'
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
                'title': 'Scary Movie',
                'description': 'The original cast returns to parody modern "elevated horror" hits and pop culture trends.',
                'producer': 'Wayans Brothers, Neal H. Moritz',
                'release_date': '2026-06-05',
                'duration': timedelta(hours=1, minutes=35),
                'rating': 'R',
                'genres': 'Comedy, Horror, Parody',
                'poster_url': f'https://cdn.moviefone.com/admin-uploads/highlights/images/scary-movie-official-poster_1778000082.webp'
            },
            {
                'title': 'Disclosure Day',
                'description': 'A targeted whistleblower races against time to reveal the truth about extraterrestrial visitors.',
                'producer': 'Steven Spielberg, Kristie Macosko Krieger',
                'release_date': '2026-06-12',
                'duration': timedelta(hours=2, minutes=25),
                'rating': 'PG-13',
                'genres': 'Sci-Fi, Thriller, Drama',
                'poster_url': f'https://cdn.moviefone.com/admin-uploads/highlights/images/disclosure-day-official-poster_1773337616.webp'
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
                'title': 'The Death of Robin Hood',
                'description': 'A battle-worn Robin Hood grapples with his past and finds a chance at salvation.',
                'producer': 'Aaron Ryder, Andrew Swett, Alexander Black',
                'release_date': '2026-06-19',
                'duration': timedelta(hours=2, minutes=2),
                'rating': 'R',
                'genres': 'Adventure, Drama, Thriller',
                'poster_url': f'{tmdb_base}/avPlzUHfIGuXecXohtOJiAlMXH8.jpg'
            },
            {
                'title': 'Supergirl',
                'description': 'A jaded Kara Zor-El embarks on a galactic journey to help a young alien girl seek revenge.',
                'producer': 'James Gunn, Peter Safran',
                'release_date': '2026-06-26',
                'duration': timedelta(hours=2, minutes=10),
                'rating': 'PG-13',
                'genres': 'Sci-Fi, Fantasy, Superhero',
                'poster_url': f'https://cdn.moviefone.com/admin-uploads/highlights/images/supergirl-official-poster_1765397770.webp'
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
                'title': 'Evil Dead Burn',
                'description': 'A gathering at a secluded family home descends into a Deadite-infested nightmare.',
                'producer': 'Sam Raimi, Rob Tapert',
                'release_date': '2026-07-10',
                'duration': timedelta(hours=1, minutes=30),
                'rating': 'R',
                'genres': 'Horror, Thriller',
                'poster_url': f'https://cdn.moviefone.com/admin-uploads/highlights/images/evil-dead-burn-official-poster_1778002073.webp'
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
            if isinstance(m_data['release_date'], str):
                m_data['release_date'] = date.fromisoformat(m_data['release_date'])
                
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
                    start_time = current_day + timedelta(hours=slot * 3.5)
                    # Only pick movies that have been released
                    available_movies = [m for m in movies if m.release_date <= start_time.date()]
                    if not available_movies:
                        continue
                        
                    movie = random.choice(available_movies)
                    
                    if not Screening.objects.filter(hall=hall, start_time=start_time).exists():
                        Screening.objects.create(
                            movie=movie,
                            hall=hall,
                            start_time=start_time,
                            base_price=Decimal('15.00') if hall.dolby_atmos else Decimal('10.00')
                        )

        # 5. Generate Client Users
        self.stdout.write('Generating client users...')
        clients = []
        client_data_list = [
            {"email": "alice.w@example.com", "first_name": "Alice", "last_name": "Ward"},
            {"email": "bob.m@example.com", "first_name": "Bob", "last_name": "Miller"},
            {"email": "charlie.d@example.com", "first_name": "Charlie", "last_name": "Davis"},
            {"email": "diana.p@example.com", "first_name": "Diana", "last_name": "Prince"},
            {"email": "ethan.h@example.com", "first_name": "Ethan", "last_name": "Hunt"},
            {"email": "fiona.g@example.com", "first_name": "Fiona", "last_name": "Gallagher"},
            {"email": "george.c@example.com", "first_name": "George", "last_name": "Clark"},
            {"email": "hannah.b@example.com", "first_name": "Hannah", "last_name": "Baker"},
            {"email": "ian.m@example.com", "first_name": "Ian", "last_name": "Malcolm"},
            {"email": "julia.r@example.com", "first_name": "Julia", "last_name": "Roberts"},
        ]

        for c_data in client_data_list:
            user, created = User.objects.get_or_create(
                email=c_data["email"],
                defaults={
                    "first_name": c_data["first_name"],
                    "last_name": c_data["last_name"],
                    "phone_number": f"+15550{random.randint(100, 999)}",
                    "date_of_birth": date(random.randint(1975, 2005), random.randint(1, 12), random.randint(1, 28))
                }
            )
            if created:
                user.set_password("password123")
                user.save()
            clients.append(user)

        # 6. Generate Purchases and Tickets
        self.stdout.write('Clearing existing purchases and tickets...')
        Ticket.objects.all().delete()
        Purchase.objects.all().delete()

        self.stdout.write('Generating purchases and tickets...')
        all_screenings = list(Screening.objects.all())
        from collections import defaultdict
        booked_seats = defaultdict(set)

        purchase_statuses = ['PAID', 'PENDING', 'CANCELLED']
        status_weights = [0.80, 0.15, 0.05]

        for client in clients:
            num_purchases = random.randint(1, 4)
            for _ in range(num_purchases):
                status = random.choices(purchase_statuses, weights=status_weights)[0]
                created_time = timezone.now() - timedelta(
                    days=random.randint(0, 6),
                    hours=random.randint(0, 23),
                    minutes=random.randint(0, 59)
                )
                
                purchase = Purchase.objects.create(
                    client=client,
                    status=status,
                    created_at=created_time,
                    paid_at=created_time if status == 'PAID' else None,
                    cancelled_at=created_time if status == 'CANCELLED' else None
                )
                
                total_price = Decimal('0.00')
                num_tickets = random.randint(1, 3)
                
                for _ in range(num_tickets):
                    screening = random.choice(all_screenings)
                    all_seats = list(Seat.objects.filter(hall=screening.hall))
                    available_seats = [s for s in all_seats if s.id not in booked_seats[screening.id]]
                    
                    if not available_seats:
                        continue
                        
                    seat = random.choice(available_seats)
                    booked_seats[screening.id].add(seat.id)
                    
                    multiplier = Decimal('1.5') if seat.seat_type == Seat.SeatType.VIP else Decimal('1.0')
                    price_paid = (screening.base_price * multiplier).quantize(Decimal('0.01'))
                    
                    from screenings.hashing import generate_secret_salt_and_hash
                    _, salt, s_hash = generate_secret_salt_and_hash()
                    
                    Ticket.objects.create(
                        purchase=purchase,
                        client=client,
                        screening=screening,
                        seat=seat,
                        price_paid=price_paid,
                        secret_hash=s_hash,
                        salt=salt,
                        created_at=created_time
                    )
                    total_price += price_paid
                    
                purchase.total_price = total_price
                purchase.save()
                # Override auto_now_add using update to preserve historical transaction dates
                Purchase.objects.filter(pk=purchase.pk).update(created_at=created_time)

        self.stdout.write(self.style.SUCCESS('Seeding complete!'))
