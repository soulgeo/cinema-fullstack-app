from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

User = get_user_model()

class RegistrationTestCase(APITestCase):
    def test_registration_saves_custom_fields(self):
        url = "/_allauth/browser/v1/auth/signup"
        data = {
            "email": "newuser@example.com",
            "password": "ComplexPassword123!",
            "first_name": "John",
            "last_name": "Doe",
            "phone_number": "+1234567890",
            "date_of_birth": "1990-01-01"
        }
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify response contains the new fields
        resp_data = response.json()
        user_data = resp_data['data']['user']
        self.assertEqual(user_data['first_name'], "John")
        self.assertEqual(user_data['last_name'], "Doe")
        self.assertEqual(user_data['phone_number'], "+1234567890")
        
        user = User.objects.get(email="newuser@example.com")
        self.assertEqual(user.first_name, "John")
        self.assertEqual(user.last_name, "Doe")
        self.assertEqual(user.phone_number, "+1234567890")
        self.assertEqual(str(user.date_of_birth), "1990-01-01")
