from rest_framework import serializers

from screenings.models import Hall, Movie, Screening, Seat, Ticket


class MovieSerializer(serializers.ModelSerializer):
    class Meta:  # type: ignore[override]
        model = Movie
        fields = '__all__'


class HallSerializer(serializers.ModelSerializer):
    class Meta:  # type: ignore[override]
        model = Hall
        fields = '__all__'


class ScreeningSerializer(serializers.ModelSerializer):
    movie_title = serializers.CharField(source='movie.title', read_only=True)
    tickets_count = serializers.SerializerMethodField()

    class Meta:  # type: ignore[override]
        model = Screening
        fields = '__all__'

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation['hall'] = HallSerializer(instance.hall).data
        return representation

    def get_tickets_count(self, obj):
        if hasattr(obj, 'tickets_count_annotated'):
            return obj.tickets_count_annotated
        return obj.tickets.count()


class SeatSerializer(serializers.ModelSerializer):
    class Meta:  # type: ignore[override]
        model = Seat
        fields = '__all__'


class TicketCreateSerializer(serializers.ModelSerializer):
    class Meta:  # type: ignore[override]
        model = Ticket
        fields = '__all__'
        read_only_fields = ('price_paid', 'created_at', 'secret_hash', 'salt')
        extra_kwargs = {
            'client': {'required': False},
        }


class TicketDetailSerializer(serializers.ModelSerializer):
    class Meta:  # type: ignore[override]
        model = Ticket
        fields = [
            'id',
            'client',
            'screening',
            'seat',
            'status',
            'price_paid',
            'created_at',
        ]
        read_only_fields = ('price_paid', 'created_at')
        extra_kwargs = {
            'client': {'required': False},
        }


class RichScreeningSerializer(serializers.ModelSerializer):
    movie = MovieSerializer(read_only=True)
    hall = HallSerializer(read_only=True)

    class Meta:  # type: ignore[override]
        model = Screening
        fields = '__all__'


class RichTicketSerializer(serializers.ModelSerializer):
    seat = SeatSerializer(read_only=True)
    screening = RichScreeningSerializer(read_only=True)

    class Meta:  # type: ignore[override]
        model = Ticket
        fields = '__all__'
