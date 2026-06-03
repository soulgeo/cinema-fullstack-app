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

class UserPermissionTestCase(APITestCase):
    def test_user_permission_flags(self):
        from django.contrib.auth.models import Group
        admin_group, _ = Group.objects.get_or_create(name='Admin')
        staff_group, _ = Group.objects.get_or_create(name='Staff')

        # 1. Regular user
        user = User.objects.create_user(
            email="regular@example.com",
            password="Password123!",
            first_name="Regular",
            last_name="User",
            phone_number="+1111111111"
        )
        self.client.force_login(user)
        url = "/_allauth/browser/v1/auth/session"
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, 200)
        data = response.json().get('data', {})
        self.assertIn('user', data)
        user_data = data['user']
        self.assertFalse(user_data['is_staff'])
        self.assertFalse(user_data['is_admin'])

        # 2. Staff user (via group)
        user.groups.add(staff_group)
        # Clear groups cache if necessary, though creating a new request should be fine
        response = self.client.get(url)
        user_data = response.json()['data']['user']
        self.assertTrue(user_data['is_staff'])
        self.assertFalse(user_data['is_admin'])

        # 3. Admin user (via group)
        user.groups.remove(staff_group)
        user.groups.add(admin_group)
        response = self.client.get(url)
        user_data = response.json()['data']['user']
        self.assertTrue(user_data['is_staff'])
        self.assertTrue(user_data['is_admin'])

        # 4. Superuser
        superuser = User.objects.create_superuser(
            email="super@example.com",
            password="Password123!",
            first_name="Super",
            last_name="User",
            phone_number="+2222222222"
        )
        self.client.force_login(superuser)
        response = self.client.get(url)
        user_data = response.json()['data']['user']
        self.assertTrue(user_data['is_staff'])
        self.assertTrue(user_data['is_admin'])

