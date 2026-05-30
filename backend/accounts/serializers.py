from rest_framework import serializers
from .models import User

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'phone_number', 'date_of_birth']
        extra_kwargs = {
            'date_of_birth': {'allow_null': True, 'required': False}
        }

    def to_internal_value(self, data):
        # Intercept the data before validation to convert empty date strings to None
        if 'date_of_birth' in data and data['date_of_birth'] == '':
            data = data.copy()
            data['date_of_birth'] = None
        return super().to_internal_value(data)
