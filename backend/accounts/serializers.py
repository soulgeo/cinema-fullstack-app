from rest_framework import serializers
from .models import User

class UserSerializer(serializers.ModelSerializer):
    class Meta: # type: ignore[override]
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'phone_number', 'date_of_birth', 'is_staff']
        extra_kwargs = {
            'date_of_birth': {'allow_null': True, 'required': False}
        }

    def to_internal_value(self, data):
        if 'date_of_birth' in data and data['date_of_birth'] == '':
            data = data.copy()
            data['date_of_birth'] = None
        return super().to_internal_value(data)
