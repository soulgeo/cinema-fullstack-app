from django.conf import settings

class DevDisableCSRFMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if settings.DEBUG:
            setattr(request, '_dont_enforce_csrf_checks', True)
        response = self.get_response(request)
        return response
