import os
import django
from django.conf import settings
from django.urls import get_resolver

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

print(f"Django Version: {django.get_version()}")
print(f"Current Directory: {os.getcwd()}")
print(f"BASE_DIR: {settings.BASE_DIR}")
print(f"DEBUG: {settings.DEBUG}")
print(f"STATIC_URL: {settings.STATIC_URL}")
print(f"STATIC_ROOT: {settings.STATIC_ROOT}")

# Trying to get url patterns
try:
    resolver = get_resolver()
    for pattern in resolver.url_patterns:
        print(f"Pattern: {pattern}")
except Exception as e:
    print(f"Error getting resolver: {e}")
