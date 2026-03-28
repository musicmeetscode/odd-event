from rest_framework import serializers
from django.db.models import Sum, F
from .models import (
    User, Event, EventRegistration, Session, SpeakerSession,
    Question, Answer, Submission, JudgingCriteria, JudgeAssignment, Score,
    Team, TeamMember,
)


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'display_name', 'name', 'role', 'email', 'bio', 'profession', 'avatar_url']
        read_only_fields = ['id', 'role']


class RegistrationSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    password = serializers.CharField(write_only=True, min_length=6)
    display_name = serializers.CharField(max_length=150, required=False)

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError(
                f"The username '{value}' is already taken."
            )
        return value


# ─── Events ────────────────────────────────────────────────────

class JudgingCriteriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = JudgingCriteria
        fields = ['id', 'name', 'description', 'max_score', 'weight']
        read_only_fields = ['id']


class EventListSerializer(serializers.ModelSerializer):
    attendee_count = serializers.IntegerField(read_only=True)
    created_by_name = serializers.CharField(source='created_by.display_name', read_only=True)
    is_registered = serializers.SerializerMethodField()

    class Meta:
        model = Event
        fields = [
            'id', 'title', 'description', 'event_type', 'start_date',
            'end_date', 'location', 'is_active', 'max_attendees',
            'allow_teams', 'max_team_size',
            'attendee_count', 'created_by_name', 'is_registered',
            'is_competition', 'created_at',
        ]

    def get_is_registered(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.registrations.filter(
                user=request.user, status='registered'
            ).exists()
        return False


class EventDetailSerializer(serializers.ModelSerializer):
    attendee_count = serializers.IntegerField(read_only=True)
    created_by_name = serializers.CharField(source='created_by.display_name', read_only=True)
    judging_criteria = JudgingCriteriaSerializer(many=True, read_only=True)
    is_registered = serializers.SerializerMethodField()
    is_competition = serializers.BooleanField(read_only=True)

    class Meta:
        model = Event
        fields = [
            'id', 'title', 'description', 'event_type', 'start_date',
            'end_date', 'location', 'is_active', 'max_attendees',
            'allow_teams', 'max_team_size',
            'attendee_count', 'created_by', 'created_by_name',
            'judging_criteria', 'is_registered', 'is_competition',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['created_by', 'created_at', 'updated_at']

    def get_is_registered(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.registrations.filter(
                user=request.user, status='registered'
            ).exists()
        return False


class EventRegistrationSerializer(serializers.ModelSerializer):
    user_display = serializers.CharField(source='user.display_name', read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = EventRegistration
        fields = ['id', 'event', 'user', 'user_display', 'username', 'registered_at', 'status']
        read_only_fields = ['id', 'user', 'registered_at']


# ─── Q&A ────────────────────────────────────────────────────────

class SessionSerializer(serializers.ModelSerializer):
    speaker_names = serializers.SerializerMethodField()
    question_count = serializers.SerializerMethodField()

    class Meta:
        model = Session
        fields = [
            'id', 'event', 'title', 'description', 'session_type',
            'start_time', 'end_time', 'room_location',
            'speakers', 'speaker_names', 'question_count',
        ]
        read_only_fields = ['event', 'speakers']

    def get_speaker_names(self, obj):
        return [s.display_name or s.username for s in obj.speakers.all()]

    def get_question_count(self, obj):
        return obj.questions.count()


class QuestionSerializer(serializers.ModelSerializer):
    member_name = serializers.CharField(source='member.display_name', read_only=True)

    class Meta:
        model = Question
        fields = [
            'id', 'session', 'member', 'member_name', 'content',
            'created_at', 'is_answered', 'answer_text',
        ]
        read_only_fields = ['member', 'created_at']

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = self.context.get('request')
        if request and request.method == 'POST':
            self.fields['is_answered'].read_only = True
            self.fields['answer_text'].read_only = True


# ─── Submissions & Scoring ──────────────────────────────────────

class ScoreSerializer(serializers.ModelSerializer):
    judge_name = serializers.CharField(source='judge.display_name', read_only=True)
    criteria_name = serializers.CharField(source='criteria.name', read_only=True)
    max_score = serializers.IntegerField(source='criteria.max_score', read_only=True)

    class Meta:
        model = Score
        fields = [
            'id', 'submission', 'criteria', 'criteria_name', 'max_score',
            'judge', 'judge_name', 'score', 'comment', 'scored_at',
        ]
        read_only_fields = ['id', 'judge', 'scored_at']

    def validate_score(self, value):
        # Additional validation done in model.clean() but also check here
        if value < 0:
            raise serializers.ValidationError("Score cannot be negative.")
        return value


class SubmissionSerializer(serializers.ModelSerializer):
    submitted_by_name = serializers.CharField(source='submitted_by.display_name', read_only=True)
    team_name = serializers.CharField(source='team.name', read_only=True, default=None)

    class Meta:
        model = Submission
        fields = [
            'id', 'event', 'submitted_by', 'submitted_by_name',
            'team', 'team_name',
            'title', 'description', 'repo_url', 'demo_url',
            'submitted_at',
        ]
        read_only_fields = ['id', 'event', 'submitted_by', 'submitted_at']


class SubmissionDetailSerializer(serializers.ModelSerializer):
    submitted_by_name = serializers.CharField(source='submitted_by.display_name', read_only=True)
    scores = ScoreSerializer(many=True, read_only=True)
    total_weighted_score = serializers.FloatField(read_only=True)

    class Meta:
        model = Submission
        fields = [
            'id', 'event', 'submitted_by', 'submitted_by_name',
            'title', 'description', 'repo_url', 'demo_url',
            'submitted_at', 'scores', 'total_weighted_score',
        ]
        read_only_fields = ['id', 'event', 'submitted_by', 'submitted_at']


class LeaderboardEntrySerializer(serializers.Serializer):
    """Read‑only serializer for leaderboard rankings."""
    rank = serializers.IntegerField()
    submission_id = serializers.IntegerField()
    title = serializers.CharField()
    submitted_by = serializers.CharField()
    total_score = serializers.FloatField()


class JudgeAssignmentSerializer(serializers.ModelSerializer):
    judge_name = serializers.SerializerMethodField()

    class Meta:
        model = JudgeAssignment
        fields = ['id', 'judge', 'event', 'judge_name']

    def get_judge_name(self, obj):
        return obj.judge.display_name or obj.judge.username


# ─── Teams ──────────────────────────────────────────────────────

class TeamMemberSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.display_name', read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = TeamMember
        fields = ['id', 'team', 'user', 'user_name', 'username', 'role', 'joined_at']
        read_only_fields = ['id', 'team', 'joined_at']


class TeamSerializer(serializers.ModelSerializer):
    members = TeamMemberSerializer(many=True, read_only=True)
    member_count = serializers.IntegerField(read_only=True)
    created_by_name = serializers.CharField(source='created_by.display_name', read_only=True)

    class Meta:
        model = Team
        fields = ['id', 'event', 'name', 'created_by', 'created_by_name', 'members', 'member_count', 'created_at']
        read_only_fields = ['id', 'event', 'created_by', 'created_at']