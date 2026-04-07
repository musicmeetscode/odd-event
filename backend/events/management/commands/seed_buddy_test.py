import random
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from events.models import Event, EventRegistration

User = get_user_model()

class Command(BaseCommand):
    help = 'Seeds attendees for testing buddy groups. Ensures they are checked in.'

    def add_arguments(self, parser):
        parser.add_argument('--event_id', type=int, help='ID of the event to seed attendees for')
        parser.add_argument('--count', type=int, default=15, help='Number of new attendees to create')
        parser.add_argument('--check_in_existing', action='store_true', help='Check in all existing registered users')

    def handle(self, *args, **options):
        event_id = options.get('event_id')
        count = options.get('count')
        check_in_existing = options.get('check_in_existing')

        if event_id:
            try:
                event = Event.objects.get(id=event_id)
            except Event.DoesNotExist:
                self.stdout.write(self.style.ERROR(f"Event with ID {event_id} does not exist"))
                return
        else:
            event = Event.objects.order_by('-created_at').first()
            if not event:
                self.stdout.write(self.style.ERROR("No events found. Please create an event first."))
                return
        
        self.stdout.write(self.style.SUCCESS(f"Target event: {event.title}"))

        if check_in_existing:
            regs = EventRegistration.objects.filter(event=event)
            updated = regs.update(status='checked_in')
            self.stdout.write(self.style.SUCCESS(f"Checked in {updated} existing participants."))

        if count > 0:
            self.stdout.write(self.style.SUCCESS(f"Seeding {count} new attendees..."))
            names = [
                ("Alice", "Tech Lead"), ("Bob", "Frontend DEV"), ("Charlie", "Data Scientist"),
                ("Diana", "Product Manager"), ("Edward", "Designer"), ("Fiona", "QA Engineer"),
                ("George", "Cloud Architect"), ("Hannah", "Mobile Developer"), ("Ian", "DevOps"),
                ("Jane", "CTO"), ("Kevin", "Software Engineer"), ("Laura", "UX Designer"),
                ("Mike", "Fullstack Developer"), ("Nora", "Security Specialist"), ("Oscar", "Marketing Lead"),
                ("Paul", "CEO"), ("Quinn", "Operations"), ("Rachel", "Sales Engineer"),
                ("Steve", "Founder"), ("Tina", "Consultant")
            ]

            created_count = 0
            for i in range(count):
                name_tuple = names[i % len(names)]
                first_name = name_tuple[0]
                profession = name_tuple[1]
                username = f"{first_name.lower()}_{random.randint(100, 999)}_{i}_test"
                phone = f"+2547{random.randint(10000000, 99999999)}"
                
                user, created = User.objects.get_or_create(
                    username=username,
                    defaults={
                        'first_name': first_name,
                        'display_name': f"{first_name} Test",
                        'profession': profession,
                        'phone': phone,
                        'email': f"{username}@example.com"
                    }
                )
                
                if created:
                    user.set_password('password123')
                    user.save()

                # Register for event and ensure they are checked in
                reg, _ = EventRegistration.objects.get_or_create(event=event, user=user)
                reg.status = 'checked_in'
                reg.save()
                
                created_count += 1

            self.stdout.write(self.style.SUCCESS(f"Successfully seeded {created_count} attendees and checked them in."))
