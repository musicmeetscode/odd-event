import uuid
from django.core.management.base import BaseCommand
from events.models import User, Event

class Command(BaseCommand):
    help = 'Generates unique UUIDs for existing Users and Events'

    def handle(self, *args, **options):
        # Update Users
        users = User.objects.all()
        count_users = 0
        for user in users:
            user.uuid = uuid.uuid4()
            user.save(update_fields=['uuid'])
            count_users += 1
        
        # Update Events
        events = Event.objects.all()
        count_events = 0
        for event in events:
            event.uuid = uuid.uuid4()
            event.save(update_fields=['uuid'])
            count_events += 1

        self.stdout.write(self.style.SUCCESS(f'Successfully generated UNIQUE UUIDs for {count_users} users and {count_events} events.'))
