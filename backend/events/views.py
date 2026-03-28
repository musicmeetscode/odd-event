import re
from django.db.models import Sum, F, FloatField, Count, Avg
from django.db.models.functions import Coalesce
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, viewsets
from rest_framework.authtoken.models import Token
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.decorators import action
from django.db import IntegrityError
from django.http import HttpResponse
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
import csv
import io

from .models import (
    User, Event, EventRegistration, Session, Question,
    Submission, JudgingCriteria, JudgeAssignment, Score,
    Team, TeamMember, SpeakerSession,
)
from .serializers import (
    RegistrationSerializer, UserSerializer,
    EventListSerializer, EventDetailSerializer, EventRegistrationSerializer,
    SessionSerializer, QuestionSerializer,
    SubmissionSerializer, SubmissionDetailSerializer,
    ScoreSerializer, JudgingCriteriaSerializer,
    LeaderboardEntrySerializer, JudgeAssignmentSerializer,
    TeamSerializer, TeamMemberSerializer,
)
from .permissions import IsAdminOrReadOnly, IsJudge, IsAdminUser, IsJudgeOrAdmin
from .google_auth import verify_google_token


# ─── Auth ───────────────────────────────────────────────────────

class RegisterView(APIView):
    """Register a new attendee account."""
    permission_classes = []

    def post(self, request):
        serializer = RegistrationSerializer(data=request.data)
        if serializer.is_valid():
            username = serializer.validated_data['username']
            password = serializer.validated_data['password']
            display_name = serializer.validated_data.get('display_name', username)

            try:
                user = User.objects.create_user(
                    username=username,
                    password=password,
                    display_name=display_name,
                    role='attendee',
                )
                token, _ = Token.objects.get_or_create(user=user)
                return Response({
                    'token': token.key,
                    'username': user.username,
                    'display_name': user.display_name,
                    'role': user.role,
                }, status=status.HTTP_201_CREATED)
            except IntegrityError:
                return Response(
                    {"error": "Username already exists."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(ObtainAuthToken):
    """
    Unified login — accepts username + password, returns token + role.
    Frontend routes intelligently based on role.
    """

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            token_key = response.data.get('token')
            try:
                token = Token.objects.get(key=token_key)
                user = token.user

                # Auto-promote superusers/staff to admin role
                effective_role = user.role
                if (user.is_superuser or user.is_staff) and user.role != 'admin':
                    user.role = 'admin'
                    user.save(update_fields=['role'])
                    effective_role = 'admin'

                return Response({
                    'token': token_key,
                    'username': user.username,
                    'display_name': user.display_name or user.username,
                    'role': effective_role,
                    'must_reset_password': user.must_reset_password,
                })
            except Token.DoesNotExist:
                return Response(
                    {"error": "Authentication failed"},
                    status=status.HTTP_401_UNAUTHORIZED,
                )
        return response


class LogoutView(APIView):
    """Delete auth token, logging the user out."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if request.auth:
            request.auth.delete()
            return Response(
                {"detail": "Successfully logged out."},
                status=status.HTTP_200_OK,
            )
        return Response(
            {"detail": "No active token found."},
            status=status.HTTP_400_BAD_REQUEST,
        )


class GoogleLoginView(APIView):
    """
    Handles Google OAuth2 token verification and login/registration.
    If already authenticated, it links the Google account.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        token = request.data.get('token')
        if not token:
            return Response({'error': 'Token is required.'}, status=status.HTTP_400_BAD_REQUEST)

        idinfo = verify_google_token(token)
        if not idinfo:
            return Response({'error': 'Invalid token.'}, status=status.HTTP_401_UNAUTHORIZED)

        google_id = idinfo['sub']
        email = idinfo['email']
        name = idinfo.get('name', '')
        picture = idinfo.get('picture', '')

        # CASE 1: Authenticated user connecting their Google account
        if request.user.is_authenticated:
            # Check if this google_id is already linked to another account
            existing_user = User.objects.filter(google_id=google_id).exclude(id=request.user.id).first()
            if existing_user:
                return Response({'error': 'This Google account is already linked to another user.'}, status=status.HTTP_400_BAD_REQUEST)
            
            user = request.user
            user.google_id = google_id
            if not user.avatar_url:
                user.avatar_url = picture
            user.save()
            return Response({'detail': 'Google account connected successfully.'}, status=status.HTTP_200_OK)

        # CASE 2: Login or Register via Google
        user = User.objects.filter(google_id=google_id).first()
        if not user:
            # Try to link by email if no google_id match
            user = User.objects.filter(email=email).first()
            if user:
                user.google_id = google_id
                user.save()
            else:
                # Create a new user
                # We use the token as a temporary password placeholder (as requested)
                # but securely hashed via create_user
                username = email.split('@')[0]
                base_username = username
                counter = 1
                while User.objects.filter(username=username).exists():
                    username = f"{base_username}_{counter}"
                    counter += 1

                user = User.objects.create_user(
                    username=username,
                    email=email,
                    password=token, # Placeholder as requested
                    display_name=name,
                    google_id=google_id,
                    avatar_url=picture,
                    role='attendee',
                )

        # Generate auth token
        token_obj, _ = Token.objects.get_or_create(user=user)
        
        return Response({
            'token': token_obj.key,
            'username': user.username,
            'display_name': user.display_name or user.username,
            'role': user.role,
        }, status=status.HTTP_200_OK)


class MeView(APIView):
    """Return current authenticated user profile."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)


class CheckInView(APIView):
    """
    Public event check-in. Creates user if they don't exist
    (with a default password). Registers them for the event.
    """
    permission_classes = []

    def post(self, request):
        event_id = request.data.get('event_id')
        name = request.data.get('name', '').strip()
        profession = request.data.get('profession', '').strip()
        email = request.data.get('email', '').strip()
        phone = request.data.get('phone', '').strip()

        if not name or not profession:
            return Response({'error': 'Name and Profession are required.'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Regex to prevent injection and limit special characters
        # Allows alphanumeric, spaces, dots, and hyphens only
        safe_pattern = re.compile(r"^[a-zA-Z0-9\s\.\-]+$")
        if not safe_pattern.match(name) or not safe_pattern.match(profession):
            return Response(
                {'error': 'Name and Profession can only contain alphanumeric characters, spaces, dots, and hyphens.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not event_id:
            return Response({'error': 'Event ID is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            event = Event.objects.get(id=event_id, is_active=True)
        except Event.DoesNotExist:
            return Response({'error': 'Event not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Generate a username from name
        base_username = name.lower().replace(' ', '_')[:30]
        username = base_username

        # Check if user already exists by email or username
        user = None
        if email:
            user = User.objects.filter(email=email).first()
        if not user:
            user = User.objects.filter(username=username).first()

        default_password = 'blueox2026'
        created = False

        if not user:
            # Find unique username
            counter = 1
            while User.objects.filter(username=username).exists():
                username = f'{base_username}_{counter}'
                counter += 1

            user = User.objects.create_user(
                username=username,
                password=default_password,
                display_name=name,
                name=name,
                profession=profession,
                email=email or '',
                phone=phone or '',
                role='attendee',
                must_reset_password=True,
            )
            created = True

        # Register for event (or update status to checked_in)
        registration, reg_created = EventRegistration.objects.get_or_create(
            user=user,
            event=event,
            defaults={'status': 'checked_in'},
        )
        if not reg_created:
            registration.status = 'checked_in'
            registration.save()

        return Response({
            'detail': f'Checked in successfully as {user.display_name or user.username}!',
            'username': user.username,
            'display_name': user.display_name,
            'event_title': event.title,
            'account_created': created,
            'default_password': default_password if created else None,
        }, status=status.HTTP_200_OK)


class ResetPasswordView(APIView):
    """User resets their password after check-in auto-creation."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        new_password = request.data.get('new_password', '').strip()
        if not new_password or len(new_password) < 6:
            return Response(
                {'error': 'Password must be at least 6 characters.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = request.user
        user.set_password(new_password)
        user.must_reset_password = False
        user.save()

        # Delete old token, create new one
        Token.objects.filter(user=user).delete()
        token = Token.objects.create(user=user)

        return Response({
            'detail': 'Password updated successfully.',
            'token': token.key,
        })


# ─── Events ─────────────────────────────────────────────────────

class EventViewSet(viewsets.ModelViewSet):
    """
    List/retrieve for everyone.  Create/update/delete for admins.
    """
    def get_queryset(self):
        """
        By default, we filter for 'unique' series entries:
        Standalone events OR events marked as 'is_recurring=True'.
        This prevents the list from being cluttered with series instances.
        """
        from django.db.models import Q
        return Event.objects.filter(Q(is_recurring=True) | Q(recurrence_group_id__isnull=True))

    permission_classes = [IsAdminOrReadOnly]

    def get_serializer_class(self):
        if self.action == 'list':
            return EventListSerializer
        return EventDetailSerializer

    def perform_create(self, serializer):
        event = serializer.save(created_by=self.request.user)
        self._handle_recurrence(event)

    def perform_update(self, serializer):
        old_instance = self.get_object()
        # Track changes to recurrence fields
        fields_changed = (
            old_instance.is_recurring != serializer.validated_data.get('is_recurring', old_instance.is_recurring) or
            old_instance.recurrence_type != serializer.validated_data.get('recurrence_type', old_instance.recurrence_type) or
            old_instance.recurrence_end_date != serializer.validated_data.get('recurrence_end_date', old_instance.recurrence_end_date)
        )
        
        event = serializer.save()
        
        if fields_changed:
            # Delete future instances if this was a recurring series
            if event.recurrence_group_id:
                Event.objects.filter(
                    recurrence_group_id=event.recurrence_group_id,
                    start_date__gt=event.start_date
                ).delete()
            
            # Re-handle recurrence (regenerate if now recurring)
            self._handle_recurrence(event)

    def _handle_recurrence(self, event):
        if event.is_recurring and event.recurrence_type and event.recurrence_end_date:
            import uuid
            from datetime import timedelta
            
            # Use existing group ID or create new one
            if not event.recurrence_group_id:
                group_id = uuid.uuid4()
                event.recurrence_group_id = group_id
                event.save(update_fields=['recurrence_group_id'])
            
            current_start = event.start_date
            current_end = event.end_date
            duration = current_end - current_start
            
            while True:
                if event.recurrence_type == 'daily':
                    current_start += timedelta(days=1)
                elif event.recurrence_type == 'weekly':
                    current_start += timedelta(weeks=1)
                elif event.recurrence_type == 'monthly':
                    current_start += timedelta(days=30)
                else:
                    break
                
                current_end = current_start + duration
                
                if current_start > event.recurrence_end_date:
                    break
                
                # Clone event for the series
                Event.objects.create(
                    title=event.title,
                    description=event.description,
                    event_type=event.event_type,
                    start_date=current_start,
                    end_date=current_end,
                    location=event.location,
                    created_by=event.created_by,
                    max_attendees=event.max_attendees,
                    allow_teams=event.allow_teams,
                    max_team_size=event.max_team_size,
                    is_active=event.is_active,
                    is_recurring=False, # Instances are not masters
                    recurrence_group_id=event.recurrence_group_id
                )

    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def release_certificates(self, request, pk=None):
        """Release certificates for the event."""
        event = self.get_object()
        event.certificates_released = True
        event.save()
        return Response({'detail': 'Certificates released successfully.'})

    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def unrelease_certificates(self, request, pk=None):
        """Unrelease certificates for the event."""
        event = self.get_object()
        event.certificates_released = False
        event.save()
        return Response({'detail': 'Certificates unreleased.'})

class EventRegistrationView(APIView):
    """POST to register, DELETE to unregister."""
    permission_classes = [IsAuthenticated]

    def post(self, request, event_id):
        try:
            event = Event.objects.get(pk=event_id, is_active=True)
        except Event.DoesNotExist:
            return Response(
                {"error": "Event not found or inactive."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if event.max_attendees and event.attendee_count >= event.max_attendees:
            return Response(
                {"error": "Event is full."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        reg, created = EventRegistration.objects.get_or_create(
            event=event, user=request.user,
            defaults={'status': 'registered'},
        )
        if not created:
            if reg.status == 'cancelled':
                reg.status = 'registered'
                reg.save()
            else:
                return Response(
                    {"detail": "Already registered."},
                    status=status.HTTP_200_OK,
                )

        serializer = EventRegistrationSerializer(reg)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def delete(self, request, event_id):
        try:
            reg = EventRegistration.objects.get(
                event_id=event_id, user=request.user,
            )
            reg.status = 'cancelled'
            reg.save()
            return Response(
                {"detail": "Registration cancelled."},
                status=status.HTTP_200_OK,
            )
        except EventRegistration.DoesNotExist:
            return Response(
                {"error": "Not registered for this event."},
                status=status.HTTP_404_NOT_FOUND,
            )


class MyEventsView(APIView):
    """List events the current user is registered for."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        registrations = EventRegistration.objects.filter(
            user=request.user, status='registered',
        ).select_related('event')
        
        # Consolidate by series if they are recurring
        # For simplicity, filter for unique events in the series or standing alone
        from django.db.models import Q
        events = [reg.event for reg in registrations if reg.event.is_recurring or reg.event.recurrence_group_id is None]
        
        serializer = EventListSerializer(events, many=True, context={'request': request})
        return Response(serializer.data)


# ─── Q&A Sessions ───────────────────────────────────────────────

class SessionViewSet(viewsets.ModelViewSet):
    """Sessions scoped to an event. Anyone can view, admins can create."""
    serializer_class = SessionSerializer
    permission_classes = [IsAdminOrReadOnly]

    def get_queryset(self):
        event_id = self.kwargs.get('event_id')
        if event_id:
            return Session.objects.filter(event_id=event_id)
        return Session.objects.all()

    def perform_create(self, serializer):
        event_id = self.kwargs.get('event_id')
        event = Event.objects.get(pk=event_id)
        serializer.save(event=event)


class QuestionViewSet(viewsets.ModelViewSet):
    """Questions within a session. Kept from original Q&A system."""
    serializer_class = QuestionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Question.objects.all()
        session_id = self.request.query_params.get('session')
        if session_id:
            queryset = queryset.filter(session_id=session_id)
        return queryset

    def perform_create(self, serializer):
        new_question = serializer.save(member=self.request.user)

        # Broadcast via WebSocket
        channel_layer = get_channel_layer()
        session_group = f'session_{new_question.session.id}'
        broadcast_data = QuestionSerializer(new_question).data

        async_to_sync(channel_layer.group_send)(
            session_group,
            {'type': 'new_question', 'data': broadcast_data},
        )

    def perform_update(self, serializer):
        updated = serializer.save()

        channel_layer = get_channel_layer()
        session_group = f'session_{updated.session.id}'
        broadcast_data = QuestionSerializer(updated).data

        async_to_sync(channel_layer.group_send)(
            session_group,
            {'type': 'question_answered', 'data': broadcast_data},
        )


# ─── Submissions ────────────────────────────────────────────────

class SubmissionViewSet(viewsets.ModelViewSet):
    """Submissions for competition events."""
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return SubmissionDetailSerializer
        return SubmissionSerializer

    def get_queryset(self):
        event_id = self.kwargs.get('event_id')
        if event_id:
            return Submission.objects.filter(event_id=event_id)
        return Submission.objects.all()

    def perform_create(self, serializer):
        event_id = self.kwargs.get('event_id')
        event = Event.objects.get(pk=event_id)
        if not event.is_competition:
            from rest_framework.exceptions import ValidationError
            raise ValidationError("Submissions are only for competition events.")
        serializer.save(submitted_by=self.request.user, event=event)


# ─── Judging ────────────────────────────────────────────────────

class JudgeDashboardView(APIView):
    """Show events assigned to the current judge with submission counts."""
    permission_classes = [IsJudgeOrAdmin]

    def get(self, request):
        if request.user.role == 'admin':
            events = Event.objects.all()
        else:
            assignments = JudgeAssignment.objects.filter(
                judge=request.user,
            ).select_related('event')
            events = [a.event for a in assignments]

        data = []
        for event in events:
            submissions = Submission.objects.filter(event=event)
            scored_count = Score.objects.filter(
                judge=request.user,
                submission__event=event,
            ).values('submission').distinct().count()

            data.append({
                'event_id': event.id,
                'event_title': event.title,
                'event_type': event.event_type,
                'total_submissions': submissions.count(),
                'scored_submissions': scored_count,
                'criteria': JudgingCriteriaSerializer(
                    event.judging_criteria.all(), many=True
                ).data,
            })

        return Response(data)


class ScoreView(APIView):
    """Judge submits / updates scores for a submission."""
    permission_classes = [IsJudgeOrAdmin]

    def post(self, request):
        """
        Expects: { submission: id, scores: [{ criteria: id, score: float, comment: "" }, ...] }
        """
        submission_id = request.data.get('submission')
        scores_data = request.data.get('scores', [])

        if not submission_id or not scores_data:
            return Response(
                {"error": "submission and scores are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            submission = Submission.objects.get(pk=submission_id)
        except Submission.DoesNotExist:
            return Response(
                {"error": "Submission not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Verify judge is assigned to this event
        if request.user.role != 'admin' and not JudgeAssignment.objects.filter(
            judge=request.user, event=submission.event,
        ).exists():
            return Response(
                {"error": "You are not assigned to judge this event."},
                status=status.HTTP_403_FORBIDDEN,
            )

        saved_scores = []
        for entry in scores_data:
            criteria_id = entry.get('criteria')
            score_val = entry.get('score')
            comment = entry.get('comment', '')

            try:
                criteria = JudgingCriteria.objects.get(
                    pk=criteria_id, event=submission.event,
                )
            except JudgingCriteria.DoesNotExist:
                continue

            if score_val is None or float(score_val) < 0 or float(score_val) > criteria.max_score:
                continue

            score_obj, created = Score.objects.update_or_create(
                submission=submission,
                criteria=criteria,
                judge=request.user,
                defaults={'score': float(score_val), 'comment': comment},
            )
            saved_scores.append(ScoreSerializer(score_obj).data)

        # Broadcast leaderboard update
        self._broadcast_leaderboard(submission.event)

        return Response({
            'detail': f'{len(saved_scores)} scores saved.',
            'scores': saved_scores,
        }, status=status.HTTP_200_OK)

    def _broadcast_leaderboard(self, event):
        """Send updated leaderboard to WebSocket group."""
        try:
            channel_layer = get_channel_layer()
            leaderboard = self._compute_leaderboard(event)
            async_to_sync(channel_layer.group_send)(
                f'event_{event.id}',
                {'type': 'leaderboard_update', 'data': leaderboard},
            )
        except Exception:
            pass  # Don't fail scoring if broadcast fails

    def _compute_leaderboard(self, event):
        submissions = Submission.objects.filter(event=event)
        entries = []
        for sub in submissions:
            total = Score.objects.filter(submission=sub).aggregate(
                total=Coalesce(
                    Sum(F('score') * F('criteria__weight'), output_field=FloatField()),
                    0.0,
                )
            )['total']
            entries.append({
                'submission_id': sub.id,
                'title': sub.title,
                'submitted_by': sub.submitted_by.display_name or sub.submitted_by.username,
                'total_score': round(total, 2),
            })

        entries.sort(key=lambda x: x['total_score'], reverse=True)
        for i, entry in enumerate(entries, 1):
            entry['rank'] = i
        return entries


class LeaderboardView(APIView):
    """Public leaderboard for a competition event."""
    permission_classes = [AllowAny]

    def get(self, request, event_id):
        try:
            event = Event.objects.get(pk=event_id)
        except Event.DoesNotExist:
            return Response(
                {"error": "Event not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if not event.is_competition:
            return Response(
                {"error": "Leaderboard is only for competition events."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        submissions = Submission.objects.filter(event=event)
        entries = []
        for sub in submissions:
            total = Score.objects.filter(submission=sub).aggregate(
                total=Coalesce(
                    Sum(F('score') * F('criteria__weight'), output_field=FloatField()),
                    0.0,
                )
            )['total']
            entries.append({
                'rank': 0,
                'submission_id': sub.id,
                'title': sub.title,
                'submitted_by': sub.submitted_by.display_name or sub.submitted_by.username,
                'total_score': round(total, 2),
            })

        entries.sort(key=lambda x: x['total_score'], reverse=True)
        for i, entry in enumerate(entries, 1):
            entry['rank'] = i

        serializer = LeaderboardEntrySerializer(entries, many=True)
        return Response(serializer.data)


# ─── Admin Management ───────────────────────────────────────────

class JudgingCriteriaViewSet(viewsets.ModelViewSet):
    """Admin: CRUD judging criteria for an event."""
    serializer_class = JudgingCriteriaSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        event_id = self.kwargs.get('event_id')
        return JudgingCriteria.objects.filter(event_id=event_id)

    def perform_create(self, serializer):
        event_id = self.kwargs.get('event_id')
        event = Event.objects.get(id=event_id)
        serializer.save(event=event)


class JudgeAssignmentView(APIView):
    """Admin: assign/remove judges for an event."""
    permission_classes = [IsAdminUser]

    def get(self, request, event_id):
        """List judges assigned to event."""
        assignments = JudgeAssignment.objects.filter(event_id=event_id).select_related('judge')
        data = [{
            'id': a.id,
            'judge_id': a.judge.id,
            'judge_username': a.judge.username,
            'judge_name': a.judge.display_name or a.judge.username,
        } for a in assignments]
        return Response(data)

    def post(self, request, event_id):
        """Assign a judge to event."""
        judge_id = request.data.get('judge_id')
        try:
            judge = User.objects.get(id=judge_id, role='judge')
        except User.DoesNotExist:
            return Response({'error': 'Judge not found.'}, status=status.HTTP_404_NOT_FOUND)

        assignment, created = JudgeAssignment.objects.get_or_create(
            judge=judge, event_id=event_id,
        )
        if not created:
            return Response({'detail': 'Judge already assigned.'}, status=status.HTTP_200_OK)
        return Response({'detail': f'{judge.display_name or judge.username} assigned as judge.'}, status=status.HTTP_201_CREATED)

    def delete(self, request, event_id):
        """Remove a judge from event."""
        judge_id = request.data.get('judge_id')
        deleted, _ = JudgeAssignment.objects.filter(judge_id=judge_id, event_id=event_id).delete()
        if deleted:
            return Response({'detail': 'Judge removed.'})
        return Response({'error': 'Assignment not found.'}, status=status.HTTP_404_NOT_FOUND)


class UserListView(APIView):
    """Admin: list or create users."""
    permission_classes = [IsAdminUser]

    def get(self, request):
        role = request.query_params.get('role')
        users = User.objects.all()
        if role:
            users = users.filter(role=role)
        data = [{
            'id': u.id,
            'username': u.username,
            'display_name': u.display_name or u.username,
            'role': u.role,
            'email': u.email,
        } for u in users[:100]]
        return Response(data)

    def post(self, request):
        """Create a new user (typically judge). Returns the created user."""
        username = request.data.get('username', '').strip()
        display_name = request.data.get('display_name', '').strip()
        password = request.data.get('password', 'blueox2026')
        role = request.data.get('role', 'judge')
        email = request.data.get('email', '')

        if not username:
            return Response(
                {'error': 'Username is required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if User.objects.filter(username=username).exists():
            return Response(
                {'error': f'Username "{username}" is already taken.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = User.objects.create_user(
            username=username,
            password=password,
            display_name=display_name or username,
            role=role,
            email=email,
            must_reset_password=True,
        )
        return Response({
            'id': user.id,
            'username': user.username,
            'display_name': user.display_name,
            'role': user.role,
            'default_password': password,
        }, status=status.HTTP_201_CREATED)


class AdminDashboardView(APIView):
    """Admin/Dashboard: system-wide analytics for the frontend dashboard."""
    permission_classes = [IsAdminUser]

    def get(self, request):
        from django.db.models import Avg, Count, Q
        from django.db.models.functions import TruncMonth
        
        # Total Events = Unique standalone events + Total unique series
        total_unique_events = Event.objects.filter(Q(is_recurring=True) | Q(recurrence_group_id__isnull=True)).count()
        active_users = User.objects.count()
        total_submissions = Submission.objects.count()
        
        avg_score = Score.objects.aggregate(avg=Avg('score'))['avg']
        avg_rating = round(avg_score, 1) if avg_score else 0.0

        # Unique events for distribution metrics
        unique_events = Event.objects.filter(Q(is_recurring=True) | Q(recurrence_group_id__isnull=True))
        event_types = unique_events.values('event_type').annotate(count=Count('id'))
        distribution = []
        for et in event_types:
            name = et['event_type'].capitalize() if et['event_type'] else "Other"
            distribution.append({'name': name, 'value': et['count']})

        # Registration Activity (Users joining per month)
        # For simplicity, we'll just group by the `date_joined` month
        registrations = User.objects.annotate(
            month=TruncMonth('date_joined')
        ).values('month').annotate(c=Count('id')).order_by('month')
        
        activity = []
        for reg in registrations:
            if reg['month']:
                month_name = reg['month'].strftime("%b").upper()
                activity.append({'name': month_name, 'val': reg['c']})

        # If data is sparse, ensure we have some output for visual purposes
        if not activity:
            activity = [{'name': "JAN", 'val': 0}]
        if not distribution:
            distribution = [{'name': "No Events", 'value': 1}]

        # Engagement Profile Data (Last 5 days)
        from datetime import datetime, timedelta
        engagement_data = []
        now = datetime.now()
        
        for i in range(4, -1, -1):
            day = now - timedelta(days=i)
            day_str = f"Day {5-i}"
            
            # Count registrations that day
            reg_count = User.objects.filter(
                date_joined__year=day.year,
                date_joined__month=day.month,
                date_joined__day=day.day
            ).count()
            
            # Count submissions that day
            sub_count = Submission.objects.filter(
                submitted_at__year=day.year,
                submitted_at__month=day.month,
                submitted_at__day=day.day
            ).count()
            
            engagement_data.append({
                'name': day_str,
                'uv': sub_count, 
                'pv': reg_count
            })

        return Response({
            'total_events': total_unique_events,
            'active_users': active_users,
            'total_submissions': total_submissions,
            'avg_rating': avg_rating,
            'event_distribution': distribution,
            'registration_activity': activity,
            'engagement_data': engagement_data,
        })


class UserDetailView(APIView):
    """Admin: update user role or details."""
    permission_classes = [IsAdminUser]

    def put(self, request, user_id):
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

        role = request.data.get('role')
        # Only check against role choices loosely since not imported
        valid_roles = ['attendee', 'judge', 'admin', 'speaker']
        if role and role in valid_roles:
            user.role = role
            user.save()
            return Response({'detail': f"Role updated to {role}."})
        return Response({'error': 'Invalid role.'}, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, user_id):
        try:
            # We use all_objects to find even if partially deleted
            user = User.all_objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

        user.is_deleted = True
        user.is_active = False # Also prevent login
        user.save()
        return Response({'message': 'User soft-deleted successfully.'})


class AdminPasswordResetView(APIView):
    """Admin: reset password for a user."""
    permission_classes = [IsAdminUser]

    def post(self, request):
        user_id = request.data.get('user_id')
        new_password = request.data.get('new_password', '').strip()

        if not user_id or len(new_password) < 6:
            return Response(
                {'error': 'User ID and password (min 6 chars) are required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            user = User.objects.get(id=user_id)
            user.set_password(new_password)
            user.must_reset_password = True
            user.save()
            Token.objects.filter(user=user).delete() # Log out all devices
            return Response({'detail': f'Password for {user.username} reset successfully to default.'})
        except User.DoesNotExist:
            return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)


class EventAttendeesView(APIView):
    """Admin/public: list attendees for an event. Admin can update status or remove."""
    permission_classes = []

    def get(self, request, event_id):
        registrations = EventRegistration.objects.filter(
            event_id=event_id,
        ).select_related('user').order_by('-registered_at')
        data = [{
            'id': r.id,
            'user_id': r.user.id,
            'name': r.user.display_name or r.user.username,
            'username': r.user.username,
            'email': r.user.email or '',
            'profession': r.user.profession or '',
            'status': r.status,
            'is_flagged': r.user.is_flagged,
            'registered_at': r.registered_at.isoformat(),
        } for r in registrations]
        return Response(data)

    def patch(self, request, event_id):
        """Admin: update an attendee's registration status."""
        if not request.user.is_authenticated or request.user.role != 'admin':
            return Response({'error': 'Admin access required.'}, status=status.HTTP_403_FORBIDDEN)

        registration_id = request.data.get('registration_id')
        new_status = request.data.get('status')

        if new_status not in ('registered', 'checked_in', 'cancelled'):
            return Response({'error': 'Invalid status.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            reg = EventRegistration.objects.get(id=registration_id, event_id=event_id)
        except EventRegistration.DoesNotExist:
            return Response({'error': 'Registration not found.'}, status=status.HTTP_404_NOT_FOUND)

        reg.status = new_status
        reg.save()
        return Response({
            'detail': f'Status updated to {new_status}.',
            'id': reg.id,
            'status': reg.status,
        })

    def delete(self, request, event_id):
        """Admin: remove an attendee registration entirely."""
        if not request.user.is_authenticated or request.user.role != 'admin':
            return Response({'error': 'Admin access required.'}, status=status.HTTP_403_FORBIDDEN)

        registration_id = request.data.get('registration_id')
        try:
            reg = EventRegistration.objects.get(id=registration_id, event_id=event_id)
        except EventRegistration.DoesNotExist:
            return Response({'error': 'Registration not found.'}, status=status.HTTP_404_NOT_FOUND)

        name = reg.user.display_name or reg.user.username
        reg.delete()
        return Response({'detail': f'{name} removed from event.'})


# ─── Teams ──────────────────────────────────────────────────────

class TeamViewSet(viewsets.ModelViewSet):
    serializer_class = TeamSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        event_id = self.kwargs.get('event_id')
        return Team.objects.filter(event_id=event_id).prefetch_related('members__user')

    def perform_create(self, serializer):
        event = Event.objects.get(id=self.kwargs['event_id'])
        team = serializer.save(event=event, created_by=self.request.user)
        # Auto-add creator as leader
        TeamMember.objects.create(team=team, user=self.request.user, role='leader')

    @action(detail=True, methods=['post'])
    def join(self, request, event_id=None, pk=None):
        """Join a team."""
        team = self.get_object()
        event = team.event
        if team.members.count() >= event.max_team_size:
            return Response({'error': 'Team is full.'}, status=status.HTTP_400_BAD_REQUEST)
        if TeamMember.objects.filter(team=team, user=request.user).exists():
            return Response({'error': 'Already in this team.'}, status=status.HTTP_400_BAD_REQUEST)
        # Remove from other teams in same event
        TeamMember.objects.filter(team__event=event, user=request.user).delete()
        TeamMember.objects.create(team=team, user=request.user, role='member')
        return Response({'detail': f'Joined team {team.name}.'}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def leave(self, request, event_id=None, pk=None):
        """Leave a team."""
        team = self.get_object()
        TeamMember.objects.filter(team=team, user=request.user).delete()
        return Response({'detail': 'Left the team.'}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def add_member(self, request, event_id=None, pk=None):
        """Admin/leader: add a user to a team."""
        team = self.get_object()
        user_id = request.data.get('user_id')
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
        if team.members.count() >= team.event.max_team_size:
            return Response({'error': 'Team is full.'}, status=status.HTTP_400_BAD_REQUEST)
        TeamMember.objects.filter(team__event=team.event, user=user).delete()
        TeamMember.objects.create(team=team, user=user, role='member')
        return Response({'detail': f'{user.display_name or user.username} added.'}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def remove_member(self, request, event_id=None, pk=None):
        """Admin/leader: remove a user from a team."""
        team = self.get_object()
        user_id = request.data.get('user_id')
        TeamMember.objects.filter(team=team, user_id=user_id).delete()
        return Response({'detail': 'Member removed.'}, status=status.HTTP_200_OK)


# ─── Analytics ────────────────────────────────────────────────

class EventAnalyticsView(APIView):
    """Admin: detailed analytics for an event."""
    permission_classes = [IsAdminUser]

    def get(self, request, event_id):
        try:
            event = Event.objects.get(id=event_id)
        except Event.DoesNotExist:
            return Response({'error': 'Event not found.'}, status=status.HTTP_404_NOT_FOUND)

        regs = event.registrations.all()
        total_registered = regs.count()
        checked_in = regs.filter(status='checked_in').count()
        sessions_count = event.sessions.count()
        submissions_count = event.submissions.count()
        teams_count = event.teams.count()

        # Scoring summary
        scores = Score.objects.filter(submission__event=event)
        avg_score = scores.aggregate(avg=Avg('score'))['avg'] or 0
        judges_count = event.judge_assignments.count()

        # Registration timeline (by date)
        from django.db.models.functions import TruncDate
        timeline = (
            regs.annotate(date=TruncDate('registered_at'))
            .values('date')
            .annotate(count=Count('id'))
            .order_by('date')
        )

        return Response({
            'total_registered': total_registered,
            'checked_in': checked_in,
            'check_in_rate': round(checked_in / total_registered * 100, 1) if total_registered else 0,
            'sessions_count': sessions_count,
            'submissions_count': submissions_count,
            'teams_count': teams_count,
            'judges_count': judges_count,
            'average_score': round(avg_score, 2),
            'registration_timeline': [
                {'date': entry['date'].isoformat() if entry['date'] else None, 'count': entry['count']}
                for entry in timeline
            ],
        })


# ─── Export ───────────────────────────────────────────────────

class ExportView(APIView):
    """Admin: export event data as CSV."""
    permission_classes = [IsAdminUser]

    def get(self, request, event_id):
        export_type = request.query_params.get('type', 'attendees')
        try:
            event = Event.objects.get(id=event_id)
        except Event.DoesNotExist:
            return Response({'error': 'Event not found.'}, status=status.HTTP_404_NOT_FOUND)

        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="{event.title}_{export_type}.csv"'
        writer = csv.writer(response)

        if export_type == 'attendees':
            writer.writerow(['Name', 'Username', 'Email', 'Phone', 'Status', 'Registered At'])
            for r in event.registrations.select_related('user').order_by('-registered_at'):
                writer.writerow([
                    r.user.display_name or r.user.username,
                    r.user.username,
                    r.user.email,
                    r.user.phone or '',
                    r.status,
                    r.registered_at.isoformat(),
                ])

        elif export_type == 'submissions':
            writer.writerow(['Title', 'Submitted By', 'Team', 'Description', 'Repo URL', 'Demo URL', 'Total Score', 'Submitted At'])
            for s in event.submissions.select_related('submitted_by', 'team').order_by('-submitted_at'):
                writer.writerow([
                    s.title,
                    s.submitted_by.display_name or s.submitted_by.username,
                    s.team.name if s.team else '',
                    s.description[:200],
                    s.repo_url,
                    s.demo_url,
                    s.total_weighted_score,
                    s.submitted_at.isoformat(),
                ])

        elif export_type == 'scores':
            writer.writerow(['Submission', 'Criteria', 'Judge', 'Score', 'Max', 'Comment', 'Scored At'])
            for sc in Score.objects.filter(submission__event=event).select_related(
                'submission', 'criteria', 'judge'
            ).order_by('submission__title', 'criteria__name'):
                writer.writerow([
                    sc.submission.title,
                    sc.criteria.name,
                    sc.judge.display_name or sc.judge.username,
                    sc.score,
                    sc.criteria.max_score,
                    sc.comment,
                    sc.scored_at.isoformat(),
                ])

        elif export_type == 'teams':
            writer.writerow(['Team Name', 'Leader', 'Members', 'Created At'])
            for t in event.teams.prefetch_related('members__user').order_by('name'):
                members = ', '.join([
                    f"{m.user.display_name or m.user.username} ({m.role})"
                    for m in t.members.all()
                ])
                leader = next(
                    (m.user.display_name or m.user.username for m in t.members.all() if m.role == 'leader'),
                    ''
                )
                writer.writerow([t.name, leader, members, t.created_at.isoformat()])

        return response


# ─── Speakers ────────────────────────────────────────────────

class SpeakerListView(APIView):
    """List speakers for an event."""
    permission_classes = []

    def get(self, request, event_id):
        speaker_ids = SpeakerSession.objects.filter(
            session__event_id=event_id
        ).values_list('speaker_id', flat=True).distinct()
        speakers = User.objects.filter(id__in=speaker_ids)
        data = [{
            'id': u.id,
            'display_name': u.display_name or u.username,
            'profession': u.profession,
            'bio': u.bio,
            'avatar_url': u.avatar_url,
            'sessions': [
                {'id': s.id, 'title': s.title, 'session_type': s.session_type, 'start_time': s.start_time.isoformat()}
                for s in Session.objects.filter(
                    speakersession__speaker=u, event_id=event_id
                )
            ],
        } for u in speakers]
        return Response(data)


class SpeakerProfileView(APIView):
    """Get/update speaker profile (own profile)."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({
            'id': request.user.id,
            'username': request.user.username,
            'display_name': request.user.display_name,
            'bio': request.user.bio,
            'profession': request.user.profession,
            'avatar_url': request.user.avatar_url,
            'email': request.user.email,
            'is_google_connected': bool(request.user.google_id),
        })

    def put(self, request):
        user = request.user
        user.display_name = request.data.get('display_name', user.display_name)
        user.bio = request.data.get('bio', user.bio)
        user.profession = request.data.get('profession', user.profession)
        user.avatar_url = request.data.get('avatar_url', user.avatar_url)
        user.save()
        return Response({
            'detail': 'Profile updated.',
            'display_name': user.display_name,
            'bio': user.bio,
            'profession': user.profession,
            'avatar_url': user.avatar_url,
        })


# ─── Certificate ─────────────────────────────────────────────

class CertificateView(APIView):
    """Generate certificate data for an attendee."""
    permission_classes = [IsAuthenticated]

    def get(self, request, event_id):
        try:
            event = Event.objects.get(id=event_id)
        except Event.DoesNotExist:
            return Response({'error': 'Event not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Check if user attended
        reg = EventRegistration.objects.filter(
            event=event, user=request.user
        ).first()

        if not reg:
            return Response({'error': 'You are not registered for this event.'}, status=status.HTTP_403_FORBIDDEN)

        # Check if user has a submission (for competition events)
        submission = Submission.objects.filter(event=event, submitted_by=request.user).first()

        return Response({
            'event_title': event.title,
            'event_type': event.get_event_type_display(),
            'event_date': event.start_date.strftime('%B %d, %Y'),
            'event_location': event.location,
            'attendee_name': request.user.display_name or request.user.username,
            'attendee_profession': request.user.profession,
            'status': reg.status,
            'registered_at': reg.registered_at.isoformat(),
            'submission': {
                'title': submission.title,
                'score': submission.total_weighted_score,
            } if submission else None,
        })
class WallOfFameView(APIView):
    """Public view for top performers in an event."""
    permission_classes = [AllowAny]

    def get(self, request, event_id):
        try:
            event = Event.objects.get(id=event_id)
        except Event.DoesNotExist:
            return Response({'error': 'Event not found.'}, status=status.HTTP_404_NOT_FOUND)

        submissions = Submission.objects.filter(event=event)
        entries = []
        for sub in submissions:
            total = Score.objects.filter(submission=sub).aggregate(
                total=Coalesce(
                    Sum(F('score') * F('criteria__weight'), output_field=FloatField()),
                    0.0,
                )
            )['total']
            entries.append({
                'submission_id': sub.id,
                'title': sub.title,
                'submitted_by': sub.submitted_by.display_name or sub.submitted_by.username,
                'bio': sub.submitted_by.bio,
                'avatar_url': sub.submitted_by.avatar_url,
                'total_score': round(total, 2),
            })

        entries.sort(key=lambda x: x['total_score'], reverse=True)
        # return top 3
        top_entries = entries[:3]
        for i, entry in enumerate(top_entries, 1):
            entry['rank'] = i

        return Response(top_entries)


class ProfileDownloadView(APIView):
    """Data for profile card. Accessible to authenticated users for themselves or public if shared."""
    permission_classes = [AllowAny] # We check logic inside

    def get(self, request, event_id, user_id=None):
        try:
            event = Event.objects.get(id=event_id)
        except Event.DoesNotExist:
            return Response({'error': 'Event not found.'}, status=status.HTTP_404_NOT_FOUND)

        target_user = None
        if user_id:
            target_user = User.objects.filter(id=user_id).first()
        elif request.user.is_authenticated:
            target_user = request.user
        
        if not target_user:
            return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Check link to event
        role_label = target_user.role
        is_judge = JudgeAssignment.objects.filter(event=event, judge=target_user).exists()
        is_attendee = EventRegistration.objects.filter(event=event, user=target_user).exists()

        if not is_judge and not is_attendee:
            role_label = "Visitor" # Or restrict access

        return Response({
            'event_title': event.title,
            'name': target_user.display_name or target_user.username,
            'role': target_user.get_role_display(),
            'profession': target_user.profession,
            'bio': target_user.bio,
            'avatar_url': target_user.avatar_url,
            'is_judge': is_judge,
        })
