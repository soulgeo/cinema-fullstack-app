from dataclasses import dataclass
import json
from typing import cast, Any, Optional
from allauth.account.adapter import DefaultAccountAdapter
from allauth.headless.adapter import DefaultHeadlessAdapter
from django.http import HttpRequest

from accounts.models import User

@dataclass
class UserContainer:
    id: int
    email: str
    display: str
    first_name: str
    last_name: str
    phone_number: str
    date_of_birth: Optional[str]

class UserAdapter(DefaultAccountAdapter):
    def save_user(self, request: HttpRequest, user, form, commit=True):
        user = cast(User, super().save_user(request, user, form, commit=False))
        
        try:
            data = json.loads(request.body)
        except (json.JSONDecodeError, AttributeError):
            data = {}

        user.first_name = data.get('first_name', '')
        user.last_name = data.get('last_name', '')
        user.phone_number = data.get('phone_number', '')
        user.date_of_birth = data.get('date_of_birth')

        if commit:
            user.save()

        return user

class HeadlessUserAdapter(DefaultHeadlessAdapter):
    def get_user_dataclass(self):
        return UserContainer

    def user_as_dataclass(self, user: Any):
        dob = user.date_of_birth
        if dob and hasattr(dob, 'isoformat'):
            dob = dob.isoformat()
        return UserContainer(
            id=user.pk,
            email=user.email,
            display=str(user),
            first_name=user.first_name,
            last_name=user.last_name,
            phone_number=user.phone_number,
            date_of_birth=str(dob) if dob else None,
        )
