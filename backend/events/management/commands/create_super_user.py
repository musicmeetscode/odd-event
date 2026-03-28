import os
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

class Command(BaseCommand):
    help = 'Create a superuser automatically based on environment variables'

    def handle(self, *args, **options):
        User = get_user_model()
        
        # Read from environment variables with safe defaults
        username = os.environ.get('DJANGO_SUPERUSER_USERNAME', 'admin')
        email = os.environ.get('DJANGO_SUPERUSER_EMAIL', 'nahabwe.edwin12@gmail.com')
        password = os.environ.get('DJANGO_SUPERUSER_PASSWORD', '@@!!admin123234SDF')

        # Check if user already exists
        if User.objects.filter(username=username).exists():
            self.stdout.write(self.style.WARNING(f'Superuser "{username}" already exists.'))
            return

        # Create the superuser
        try:
            User.objects.create_superuser(
                username=username,
                email=email,
                password=password,
                first_name="Nahabwe",
                last_name="Edwin",
            )
            self.stdout.write(self.style.SUCCESS(f'Successfully created superuser "{username}".'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Failed to create superuser: {e}'))
