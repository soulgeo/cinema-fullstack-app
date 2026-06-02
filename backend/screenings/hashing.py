import secrets
from string import ascii_letters, digits

from django.contrib.auth.hashers import PBKDF2PasswordHasher

SECRET_LEN = 20
SALT_LEN = 8
NUM_ITERS = 600000


def hash(secret, salt):
    hasher = PBKDF2PasswordHasher()
    return hasher.encode(secret, salt, NUM_ITERS)


def generate_secret_salt_and_hash():
    hasher = PBKDF2PasswordHasher()
    secret = ''.join(secrets.choice(ascii_letters + digits) for _ in range(SECRET_LEN))
    salt = ''.join(secrets.choice(ascii_letters + digits) for _ in range(SALT_LEN))

    return secret, salt, hasher.encode(secret, salt, NUM_ITERS)
