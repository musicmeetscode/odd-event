import uuid
import re
from django.db import models
from django.contrib.auth.models import AbstractUser, UserManager
from django.conf import settings


class UserSoftDeleteManager(UserManager):
    def get_queryset(self):
        return super().get_queryset().filter(is_deleted=False)

class User(AbstractUser):
    ROLE_CHOICES = [
        ('attendee', 'Attendee'),
        ('judge', 'Judge'),
        ('admin', 'Admin'),
        ('speaker', 'Speaker'),
    ]
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='attendee')
    display_name = models.CharField(max_length=150, blank=True, null=True)
    name = models.CharField(max_length=255, blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    must_reset_password = models.BooleanField(default=False)
    bio = models.TextField(blank=True, help_text="Speaker/attendee bio")
    profession = models.CharField(max_length=150, blank=True, help_text="Job title or profession")
    avatar_url = models.URLField(blank=True, help_text="Profile photo URL")
    google_id = models.CharField(max_length=255, unique=True, null=True, blank=True, help_text="Google OAuth ID")
    is_deleted = models.BooleanField(default=False)
    is_flagged = models.BooleanField(default=False)

    objects = UserSoftDeleteManager()
    all_objects = models.Manager()

    def save(self, *args, **kwargs):
        # Auto-flag suspicious names
        name_to_check = self.display_name or self.name or ""
        if name_to_check:
            # 1. Contains a number
            has_number = any(char.isdigit() for char in name_to_check)
            # 2. Too short (< 3)
            too_short = len(name_to_check.strip()) < 3
            # 3. Repeating characters (3+ same in a row, e.g. "aaaa")
            has_repeats = bool(re.search(r'(.)\1\1', name_to_check))
            # 4. Unusual case (all lowercase or all uppercase longer than 3 chars)
            unusual_case = len(name_to_check) > 3 and (name_to_check.islower() or name_to_check.isupper())
            
            if has_number or too_short or has_repeats or unusual_case:
                self.is_flagged = True
        
        super().save(*args, **kwargs)

    groups = models.ManyToManyField(
        'auth.Group',
        verbose_name='groups',
        blank=True,
        help_text=(
            'The groups this user belongs to. A user will get all permissions '
            'granted to each of their groups.'
        ),
        related_name="qna_app_user_groups",
        related_query_name="user",
    )

    user_permissions = models.ManyToManyField(
        'auth.Permission',
        verbose_name='user permissions',
        blank=True,
        help_text='Specific permissions for this user.',
        related_name="qna_app_user_permissions",
        related_query_name="user",
    )

    def __str__(self):
        return self.display_name or self.username


# ─── Events ────────────────────────────────────────────────────

class Event(models.Model):
    RECURRENCE_CHOICES = [
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
        ('monthly', 'Monthly'),
    ]

    EVENT_TYPE_CHOICES = [
        ('hackathon', 'Hackathon'),
        ('meeting', 'Meeting'),
        ('competition', 'Competition'),
        ('conference', 'Conference'),
        ('workshop', 'Workshop'),
        ('other', 'Other'),
    ]

    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    event_type = models.CharField(max_length=20, choices=EVENT_TYPE_CHOICES, default='other')
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    location = models.CharField(max_length=255, blank=True)
    is_active = models.BooleanField(default=True)
    max_attendees = models.PositiveIntegerField(null=True, blank=True)
    allow_teams = models.BooleanField(default=False, help_text="Allow team-based submissions")
    max_team_size = models.PositiveIntegerField(default=5, help_text="Max members per team")
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='events_created'
    )
    
    # Recurrence Fields
    is_recurring = models.BooleanField(default=False)
    recurrence_type = models.CharField(max_length=20, choices=RECURRENCE_CHOICES, null=True, blank=True)
    recurrence_end_date = models.DateTimeField(null=True, blank=True)
    recurrence_group_id = models.UUIDField(null=True, blank=True, help_text="ID to group all events in a recurring series")
    certificates_released = models.BooleanField(default=False, help_text="Whether certificates are available for download")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-start_date']

    def __str__(self):
        return f"{self.title} ({self.get_event_type_display()})"

    @property
    def is_competition(self):
        return self.event_type in ('competition', 'hackathon')

    @property
    def attendee_count(self):
        return self.registrations.count()


class EventRegistration(models.Model):
    STATUS_CHOICES = [
        ('registered', 'Registered'),
        ('checked_in', 'Checked In'),
        ('cancelled', 'Cancelled'),
    ]

    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='registrations')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='event_registrations')
    registered_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='registered')

    class Meta:
        unique_together = ['event', 'user']
        ordering = ['-registered_at']

    def __str__(self):
        return f"{self.user} → {self.event.title}"


# ─── Teams ──────────────────────────────────────────────────────

class Team(models.Model):
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='teams')
    name = models.CharField(max_length=255)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='teams_created'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['event', 'name']
        ordering = ['name']

    def __str__(self):
        return f"{self.name} @ {self.event.title}"

    @property
    def member_count(self):
        return self.members.count()


class TeamMember(models.Model):
    ROLE_CHOICES = [
        ('leader', 'Leader'),
        ('member', 'Member'),
    ]
    team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='members')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='team_memberships')
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='member')
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['team', 'user']

    def __str__(self):
        return f"{self.user} ({self.role}) in {self.team.name}"


# ─── Q&A ──────────────────────────────────────────────────────

class Session(models.Model):
    SESSION_TYPE_CHOICES = [
        ('talk', 'Talk'),
        ('workshop', 'Workshop'),
        ('panel', 'Panel'),
        ('break', 'Break'),
        ('keynote', 'Keynote'),
        ('other', 'Other'),
    ]
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='sessions', null=True, blank=True)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    session_type = models.CharField(max_length=20, choices=SESSION_TYPE_CHOICES, default='talk')
    start_time = models.DateTimeField()
    end_time = models.DateTimeField(null=True, blank=True)
    room_location = models.CharField(max_length=100, blank=True)
    speakers = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        through='SpeakerSession',
        related_name='sessions_speaking_at',
        blank=True,
    )

    class Meta:
        ordering = ['start_time']

    def __str__(self):
        return f"{self.title} @ {self.event.title if self.event else 'No event'}"


class SpeakerSession(models.Model):
    speaker = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    session = models.ForeignKey(Session, on_delete=models.CASCADE)

    class Meta:
        unique_together = ['speaker', 'session']

    def __str__(self):
        return f"{self.speaker} → {self.session}"


class Question(models.Model):
    session = models.ForeignKey(Session, on_delete=models.CASCADE, related_name='questions')
    member = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    is_answered = models.BooleanField(default=False)
    answer_text = models.TextField(blank=True, null=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.content[:60]


class Answer(models.Model):
    question = models.OneToOneField(Question, on_delete=models.CASCADE, primary_key=True)
    speaker = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='answers_given'
    )
    content = models.TextField()
    answered_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Answer to: {self.question.content[:40]}"


# ─── Competition / Judging ──────────────────────────────────────

class Submission(models.Model):
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='submissions')
    submitted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='submissions'
    )
    team = models.ForeignKey(
        Team, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='submissions',
        help_text="If team submission, link to team"
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    repo_url = models.URLField(blank=True)
    demo_url = models.URLField(blank=True)
    submitted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-submitted_at']

    def __str__(self):
        return f"{self.title} by {self.submitted_by}"

    @property
    def total_weighted_score(self):
        """Calculate weighted score across all judges and criteria."""
        scores = self.scores.all()
        if not scores.exists():
            return 0
        total = 0
        for score in scores:
            total += score.score * score.criteria.weight
        return round(total, 2)


class JudgingCriteria(models.Model):
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='judging_criteria')
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    max_score = models.PositiveIntegerField(default=10)
    weight = models.FloatField(default=1.0, help_text="Weight multiplier for this criteria")

    class Meta:
        verbose_name_plural = "Judging criteria"
        ordering = ['name']

    def __str__(self):
        return f"{self.name} (max {self.max_score}, weight {self.weight})"


class JudgeAssignment(models.Model):
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='judge_assignments')
    judge = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='judge_assignments',
        limit_choices_to={'role': 'judge'}
    )

    class Meta:
        unique_together = ['event', 'judge']

    def __str__(self):
        return f"Judge {self.judge} → {self.event.title}"


class Score(models.Model):
    submission = models.ForeignKey(Submission, on_delete=models.CASCADE, related_name='scores')
    criteria = models.ForeignKey(JudgingCriteria, on_delete=models.CASCADE, related_name='scores')
    judge = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='scores_given',
        limit_choices_to={'role': 'judge'}
    )
    score = models.FloatField()
    comment = models.TextField(blank=True)
    scored_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['submission', 'criteria', 'judge']
        ordering = ['-scored_at']

    def __str__(self):
        return f"{self.judge} scored {self.submission.title}: {self.score}/{self.criteria.max_score}"

    def clean(self):
        from django.core.exceptions import ValidationError
        if self.score < 0 or self.score > self.criteria.max_score:
            raise ValidationError(
                f"Score must be between 0 and {self.criteria.max_score}"
            )
