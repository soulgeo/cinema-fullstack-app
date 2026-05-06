from decimal import Decimal
from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.utils.translation import gettext_lazy as _


class Movie(models.Model):
    title = models.CharField(max_length=100)
    description = models.TextField()
    producer = models.CharField(max_length=100)
    release_date = models.DateField()
    duration = models.DurationField()
    rating = models.CharField(max_length=10)
    poster_url = models.URLField(blank=True, null=True)
    genres = models.CharField(max_length=200, blank=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.title


class Hall(models.Model):
    name = models.CharField(max_length=100)
    rows_count = models.PositiveIntegerField()
    cols_count = models.PositiveIntegerField()
    dolby_atmos = models.BooleanField()

    def __str__(self):
        return self.name


class Screening(models.Model):
    movie = models.ForeignKey(
        Movie, related_name="screenings", on_delete=models.CASCADE
    )
    hall = models.ForeignKey(
        Hall, related_name="screenings", on_delete=models.CASCADE
    )
    start_time = models.DateTimeField()
    base_price = models.DecimalField(
        max_digits=6, decimal_places=2, default=Decimal('10.00')
    )

    def __str__(self):
        return f"{self.movie.title} in {self.hall.name} at {self.start_time}"

    def clean(self):
        if self.start_time and self.movie and self.hall:
            end_time = self.start_time + self.movie.duration
            # Check for overlapping screenings in the same hall
            overlapping_screenings = Screening.objects.filter(
                hall=self.hall,
                start_time__lt=end_time,
            ).exclude(pk=self.pk)

            for screening in overlapping_screenings:
                screening_end_time = screening.start_time + screening.movie.duration
                if screening_end_time > self.start_time:
                    raise ValidationError(
                        _("This screening overlaps with another screening in the same hall.")
                    )

    def save(self, *args, **kwargs):
        self.full_clean()
        return super().save(*args, **kwargs)


class Seat(models.Model):
    hall = models.ForeignKey(
        Hall, related_name="seats", on_delete=models.CASCADE
    )
    row_label = models.CharField(max_length=7)
    seat_number = models.IntegerField()
    grid_x = models.PositiveIntegerField()  # Horizontal position in the UI
    grid_y = models.PositiveIntegerField()  # Vertical position in the UI

    class SeatType(models.TextChoices):
        REGULAR = 'REGULAR', _('Regular')
        VIP = 'VIP', _('VIP')

    seat_type = models.CharField(
        max_length=10, choices=SeatType.choices, default=SeatType.REGULAR
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['hall', 'row_label', 'seat_number'],
                name='unique_seat_per_hall'
            )
        ]

    def __str__(self):
        return f"{self.hall.name} - {self.row_label}{self.seat_number} ({self.seat_type})"


class Ticket(models.Model):
    client = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="tickets",
        on_delete=models.CASCADE,
    )
    screening = models.ForeignKey(
        Screening, related_name="tickets", on_delete=models.CASCADE
    )
    seat = models.ForeignKey(
        Seat, related_name="tickets", on_delete=models.CASCADE
    )

    class Status(models.TextChoices):
        RESERVED = 'RESERVED', _('Reserved')
        PAID = 'PAID', _('Paid')
        CANCELLED = 'CANCELLED', _('Cancelled')

    status = models.CharField(
        max_length=10,
        choices=Status.choices,
        default=Status.RESERVED,
    )
    price_paid = models.DecimalField(
        max_digits=6, decimal_places=2, blank=True, null=True
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['screening', 'seat'], name='unique_ticket_per_screening'
            )
        ]

    def save(self, *args, **kwargs):
        self.full_clean()
        return super().save(*args, **kwargs)

    def clean(self):
        if self.seat and self.screening:
            if self.seat.hall != self.screening.hall:
                raise ValidationError(
                    _("Seat and screening must be on the same hall.")
                )

            if not self.price_paid:
                multiplier = Decimal('1.5') if self.seat.seat_type == Seat.SeatType.VIP else Decimal('1.0')
                self.price_paid = self.screening.base_price * multiplier

    def __str__(self):
        return f"Ticket for {self.screening.movie.title} - {self.seat}"
