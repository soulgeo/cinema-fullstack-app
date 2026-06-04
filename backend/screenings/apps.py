from django.apps import AppConfig


class ScreeningsConfig(AppConfig):
    name = 'screenings'

    def ready(self):
        import screenings.signals
