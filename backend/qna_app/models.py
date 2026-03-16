import uuid
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.conf import settings


class User(AbstractUser):
    # Inherits: id (PK), username, password, email, is_staff, is_active, etc.
    is_speaker = models.BooleanField(default=False)
    display_name = models.CharField(max_length=150, blank=True, null=True)
    name = models.CharField(max_length=255, blank=True, null=True)
    # This is what we login a speaker with
    speaker_code = models.CharField(max_length=20, unique=True, blank=True, null=True)
    
    # --- FIX for the SystemCheckError ---
    # Override the groups field with a unique related_name
    groups = models.ManyToManyField(
        'auth.Group',
        verbose_name=('groups'),
        blank=True,
        help_text=(
            'The groups this user belongs to. A user will get all permissions '
            'granted to each of their groups.'
        ),
        # The unique related_name prevents the clash with the default User model
        related_name="qna_app_user_groups",
        related_query_name="user",
    )

    # Override the user_permissions field with a unique related_name
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        verbose_name=('user permissions'),
        blank=True,
        help_text=('Specific permissions for this user.'),
        # The unique related_name prevents the clash with the default User model
        related_name="qna_app_user_permissions",
        related_query_name="user",
    )
    def save(self, *args, **kwargs):
        if self.is_speaker and not self.speaker_code:
            # Generate short, unique code like SPC-AB123
            self.speaker_code = f"SPC-{uuid.uuid4().hex[:5].upper()}"
        super().save(*args, **kwargs)


# Session Model 
class Session(models.Model):
    title = models.CharField(max_length=255)
    start_time = models.DateTimeField()
    room_location = models.CharField(max_length=100)
    # Define the M2M relationship here, linking through the explicit table
    speakers = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        through='SpeakerSession',
        related_name='sessions_speaking_at',
        limit_choices_to={'is_speaker': True} # Optional: Constraint for clarity
    )


# 3. Intermediate Model for Speakers (SpeakerSession)
class SpeakerSession(models.Model):
    speaker = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    session = models.ForeignKey(Session, on_delete=models.CASCADE)

    # ...

# 4. Question Model
class Question(models.Model):
    session = models.ForeignKey(Session, on_delete=models.CASCADE)
    member = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    is_answered = models.BooleanField(default=False)
    answer_text = models.TextField(blank=True, null=True)

# 5. Answer Model
class Answer(models.Model):
    # One-to-one link to Question (ensuring each question has at most one Answer object)
    question = models.OneToOneField(Question, on_delete=models.CASCADE, primary_key=True)
    speaker = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='answers_given'
    )
    content = models.TextField()
    answered_at = models.DateTimeField(auto_now_add=True)
