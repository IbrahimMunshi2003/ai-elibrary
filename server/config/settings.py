# """
# Django settings for config project.
# """

# from pathlib import Path
# import os

# BASE_DIR = Path(__file__).resolve().parent.parent


# # ================================
# # SECURITY
# # ================================

# SECRET_KEY = os.getenv(
#     "DJANGO_SECRET_KEY",
#     "django-insecure-dev-key"
# )

# DEBUG = os.getenv("DEBUG", "False") == "True"

# ALLOWED_HOSTS = [
#     "localhost",
#     "127.0.0.1",
#     ".onrender.com"
# ]


# # ================================
# # INSTALLED APPS
# # ================================

# INSTALLED_APPS = [
#     'django.contrib.admin',
#     'django.contrib.auth',
#     'django.contrib.contenttypes',
#     'django.contrib.sessions',
#     'django.contrib.messages',
#     'django.contrib.staticfiles',

#     # third party
#     'corsheaders',

#     # your apps
#     'library',
# ]


# # ================================
# # MIDDLEWARE
# # ================================

# MIDDLEWARE = [
#     'django.middleware.security.SecurityMiddleware',
#     'corsheaders.middleware.CorsMiddleware',

#     'django.contrib.sessions.middleware.SessionMiddleware',
#     'django.middleware.common.CommonMiddleware',

#     'django.middleware.csrf.CsrfViewMiddleware',
#     'django.contrib.auth.middleware.AuthenticationMiddleware',

#     'django.contrib.messages.middleware.MessageMiddleware',
#     'django.middleware.clickjacking.XFrameOptionsMiddleware',
# ]


# # ================================
# # CORS SETTINGS
# # ================================

# CORS_ALLOW_ALL_ORIGINS = True


# # ================================
# # URLS / TEMPLATES
# # ================================

# ROOT_URLCONF = 'config.urls'

# TEMPLATES = [
#     {
#         'BACKEND': 'django.template.backends.django.DjangoTemplates',
#         'DIRS': [],
#         'APP_DIRS': True,
#         'OPTIONS': {
#             'context_processors': [
#                 'django.template.context_processors.request',
#                 'django.contrib.auth.context_processors.auth',
#                 'django.contrib.messages.context_processors.messages',
#             ],
#         },
#     },
# ]

# WSGI_APPLICATION = 'config.wsgi.application'


# # ================================
# # DATABASE (MongoDB Atlas)
# # ================================

# DATABASES = {
#     "default": {
#         "ENGINE": "djongo",
#         "NAME": "AI-ELIBRARY",
#         "CLIENT": {
#             "host": os.getenv("MONGODB_URI")
#         }
#     }
# }


# # ================================
# # PASSWORD VALIDATION
# # ================================

# AUTH_PASSWORD_VALIDATORS = [
#     {
#         'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
#     },
#     {
#         'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
#     },
#     {
#         'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
#     },
#     {
#         'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
#     },
# ]


# # ================================
# # INTERNATIONALIZATION
# # ================================

# LANGUAGE_CODE = 'en-us'

# TIME_ZONE = 'UTC'

# USE_I18N = True

# USE_TZ = True


# # ================================
# # STATIC FILES
# # ================================

# STATIC_URL = 'static/'
# STATIC_ROOT = os.path.join(BASE_DIR, "staticfiles")


# # ================================
# # DEFAULT PRIMARY KEY
# # ================================

# DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
# DATABASES = {
#     "default": {
#         "ENGINE": "djongo",
#         "NAME": "AI-ELIBRARY",
#         "CLIENT": {
#             "host": "mongodb+srv://ibrahimmunshi:Shihabudeen7@vehicleassistant.k4jryxz.mongodb.net/AI-ELIBRARY?retryWrites=true&w=majority"
#         }
#     }
# }
# """
# Django settings for config project.
# """

# from pathlib import Path
# import os
# from dotenv import load_dotenv

# BASE_DIR = Path(__file__).resolve().parent.parent

# # Load .env file
# load_dotenv()

# # ================================
# # SECURITY
# # ================================

# SECRET_KEY = os.getenv(
#     "DJANGO_SECRET_KEY",
#     "django-insecure-dev-key"
# )

# DEBUG = os.getenv("DEBUG", "True") == "True"

# ALLOWED_HOSTS = [
#     "localhost",
#     "127.0.0.1",
#     ".onrender.com"
# ]

# # Gemini API
# GEMINI_API_KEY = os.getenv("AIzaSyCkHGHsofIpGHo7KqD2bUurih_HLb8YKbo")

# # ================================
# # INSTALLED APPS
# # ================================

# INSTALLED_APPS = [
#     'django.contrib.admin',
#     'django.contrib.auth',
#     'django.contrib.contenttypes',
#     'django.contrib.sessions',
#     'django.contrib.messages',
#     'django.contrib.staticfiles',

#     'corsheaders',
#     'rest_framework',
#     'rest_framework_simplejwt',

#     'library',
# ]

# REST_FRAMEWORK = {
#     'DEFAULT_AUTHENTICATION_CLASSES': (
#         'rest_framework_simplejwt.authentication.JWTAuthentication',
#     )
# }


# # ================================
# # MIDDLEWARE
# # ================================

# MIDDLEWARE = [
#     'django.middleware.security.SecurityMiddleware',
#     'corsheaders.middleware.CorsMiddleware',

#     'django.contrib.sessions.middleware.SessionMiddleware',
#     'django.middleware.common.CommonMiddleware',

#     'django.middleware.csrf.CsrfViewMiddleware',
#     'django.contrib.auth.middleware.AuthenticationMiddleware',

#     'django.contrib.messages.middleware.MessageMiddleware',
#     'django.middleware.clickjacking.XFrameOptionsMiddleware',
# ]

# # ================================
# # CORS
# # ================================

# Moved to top
# CORS_ALLOW_ALL_ORIGINS = True

# # ================================
# # URLS
# # ================================

# ROOT_URLCONF = 'config.urls'

# # ================================
# # TEMPLATES
# # ================================

# TEMPLATES = [
#     {
#         'BACKEND': 'django.template.backends.django.DjangoTemplates',
#         'DIRS': [],
#         'APP_DIRS': True,
#         'OPTIONS': {
#             'context_processors': [
#                 'django.template.context_processors.request',
#                 'django.contrib.auth.context_processors.auth',
#                 'django.contrib.messages.context_processors.messages',
#             ],
#         },
#     },
# ]

# WSGI_APPLICATION = 'config.wsgi.application'

# Removed duplicate DATABASES config

# # ================================
# # PASSWORD VALIDATION
# # ================================

# AUTH_PASSWORD_VALIDATORS = [
#     {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
#     {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
#     {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
#     {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
# ]

# # ================================
# # INTERNATIONALIZATION
# # ================================

# LANGUAGE_CODE = 'en-us'

# TIME_ZONE = 'UTC'

# USE_I18N = True
# USE_TZ = True

# # ================================
# # STATIC FILES
# # ================================

# STATIC_URL = 'static/'
# STATIC_ROOT = os.path.join(BASE_DIR, "staticfiles")

# # ================================
# # DEFAULT PRIMARY KEY
# # ================================

# DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
"""
Django settings for config project.
"""

from pathlib import Path
import os
from dotenv import load_dotenv
import dj_database_url
import sys
from django.core.exceptions import ImproperlyConfigured
from django.core.management.utils import get_random_secret_key

BASE_DIR = Path(__file__).resolve().parent.parent

# Load environment variables
load_dotenv()

# ================================
# SECURITY
# ================================

configured_secret_key = os.getenv("DJANGO_SECRET_KEY")
debug_requested = os.getenv("DEBUG", "False") == "True"
test_or_dev_command = any(command in sys.argv for command in ("runserver", "test"))
known_insecure_secret_keys = {
    "django-insecure-dev-key",
    "some_random_secret_key",
}

if not configured_secret_key:
    if debug_requested and test_or_dev_command:
        configured_secret_key = get_random_secret_key()
    else:
        raise ImproperlyConfigured(
            "DJANGO_SECRET_KEY must be configured outside an explicit local development or test command."
        )

if (
    configured_secret_key in known_insecure_secret_keys
    or configured_secret_key.startswith("django-insecure-")
    or len(configured_secret_key) < 32
):
    raise ImproperlyConfigured(
        "DJANGO_SECRET_KEY must be a strong, deployment-provided secret."
    )

SECRET_KEY = configured_secret_key

DEBUG = os.getenv("DEBUG", "False") == "True"

if 'runserver' not in sys.argv:
    DEBUG = False

ALLOWED_HOSTS = [
    "localhost",
    "127.0.0.1",
    "ai-elibrary-backend.onrender.com",
    ".onrender.com",
    "*",
]

# ================================
# API KEYS
# ================================

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

# ================================
# CLOUDINARY CONFIG (FINAL)
# ================================

CLOUDINARY_STORAGE = {
    'CLOUD_NAME': os.getenv('CLOUDINARY_CLOUD_NAME'),
    'API_KEY': os.getenv('CLOUDINARY_API_KEY'),
    'API_SECRET': os.getenv('CLOUDINARY_API_SECRET'),
    'SECURE': True,
}

CLOUDINARY_URL = os.getenv("CLOUDINARY_URL")

DEFAULT_FILE_STORAGE = 'cloudinary_storage.storage.MediaCloudinaryStorage'

# ================================
# INSTALLED APPS
# ================================

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    'corsheaders',
    'rest_framework',
    'rest_framework_simplejwt',

    'library',

    'cloudinary',
    'cloudinary_storage',
]

# ================================
# REST FRAMEWORK
# ================================

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    )
}

# ================================
# MIDDLEWARE
# ================================

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',

    'corsheaders.middleware.CorsMiddleware',

    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',

    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',

    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

# ================================
# CORS & CSRF
# ================================

CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://ai-elibrary.vercel.app",
]

CSRF_TRUSTED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
    "https://ai-elibrary.vercel.app",
]

# ================================
# URLS
# ================================

ROOT_URLCONF = 'config.urls'

# ================================
# TEMPLATES
# ================================

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'

# ================================
# DATABASE
# ================================

database_url = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR / 'db.sqlite3'}")

DATABASES = {
    "default": dj_database_url.config(
        default=database_url,
        conn_max_age=600,
        ssl_require=database_url.startswith(("postgres://", "postgresql://")),
    )
}

# ================================
# PASSWORD VALIDATION
# ================================

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# ================================
# INTERNATIONALIZATION
# ================================

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# ================================
# STATIC FILES
# ================================

STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, "staticfiles")

STATICFILES_STORAGE = 'whitenoise.storage.CompressedStaticFilesStorage'

# ================================
# MEDIA FILES
# ================================

MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, "media")

# ================================
# SECURITY (RENDER)
# ================================

SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

# ================================
# DEFAULT PRIMARY KEY
# ================================

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'