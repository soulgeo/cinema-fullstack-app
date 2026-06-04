from django.urls import path, include
from rest_framework.routers import DefaultRouter
from screenings.views import MovieViewSet, HallViewSet, ScreeningViewSet, TicketViewSet, SeatViewSet, PurchaseViewSet

router = DefaultRouter()
router.register(r'movies', MovieViewSet)
router.register(r'halls', HallViewSet)
router.register(r'screenings', ScreeningViewSet)
router.register(r'seats', SeatViewSet)
router.register(r'tickets', TicketViewSet)
router.register(r'purchases', PurchaseViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
