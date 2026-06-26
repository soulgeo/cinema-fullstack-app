from decimal import Decimal
from rest_framework import serializers

from screenings.hashing import generate_secret_salt_and_hash
from screenings.models import Hall, Movie, Purchase, Screening, Seat, Ticket


class MovieSerializer(serializers.ModelSerializer):
    class Meta:  # type: ignore[override]
        model = Movie
        fields = '__all__'


class HallSerializer(serializers.ModelSerializer):
    class Meta:  # type: ignore[override]
        model = Hall
        fields = '__all__'


class ScreeningSerializer(serializers.ModelSerializer):
    tickets_count = serializers.SerializerMethodField()

    class Meta:  # type: ignore[override]
        model = Screening
        fields = '__all__'

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation['movie'] = MovieSerializer(instance.movie).data
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
            'purchase': {'required': False},
        }


class TicketDetailSerializer(serializers.ModelSerializer):
    class Meta:  # type: ignore[override]
        model = Ticket
        fields = [
            'id',
            'client',
            'screening',
            'seat',
            'price_paid',
            'created_at',
            'is_used',
            'purchase',
        ]
        read_only_fields = ('price_paid', 'created_at')
        extra_kwargs = {
            'client': {'required': False},
        }


class PurchaseSerializer(serializers.ModelSerializer):
    tickets = TicketDetailSerializer(many=True, read_only=True)

    class Meta:  # type: ignore[override]
        model = Purchase
        fields = '__all__'
        read_only_fields = ('client', 'created_at', 'total_price')


class PurchaseCreateSerializer(serializers.ModelSerializer):
    tickets = TicketCreateSerializer(many=True)

    class Meta:  # type: ignore[override]
        model = Purchase
        fields = ['id', 'tickets', 'client']
        read_only_fields = ['id']
        extra_kwargs = {
            'client': {'required': False},
        }

    def create(self, validated_data):
        tickets_data = validated_data.pop('tickets')
        request = self.context.get('request')
        user = request.user if request else None
        
        # If client is provided in validated_data and user is staff, use it.
        # Otherwise use the request user.
        client = validated_data.get('client', user)
        
        purchase = Purchase.objects.create(client=client)
        total_price = Decimal('0.00')
        
        for ticket_data in tickets_data:
            _, salt, s_hash = generate_secret_salt_and_hash()
            ticket_client = ticket_data.pop('client', client)
            
            ticket = Ticket.objects.create(
                purchase=purchase,
                client=ticket_client,
                secret_hash=s_hash,
                salt=salt,
                **ticket_data
            )
            total_price += ticket.price_paid
            
        purchase.total_price = total_price
        purchase.save()
        return purchase


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
