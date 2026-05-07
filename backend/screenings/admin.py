from django.contrib import admin

import screenings.models as models

admin.site.register(models.Movie)
admin.site.register(models.Hall)
admin.site.register(models.Screening)
admin.site.register(models.Seat)
admin.site.register(models.Ticket)
