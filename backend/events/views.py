import re
import uuid
import csv
import io
from django.db.models import Sum, F, FloatField, Count, Avg
from django.db.models.functions import Coalesce
from django.db import IntegrityError
from django.http import HttpResponse
from django.conf import settings
from django.core.exceptions import ValidationError
from rest_framework import status, viewsets
from rest_framework.authtoken.models import Token
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.permissions import IsAuthenticated, AllowAny

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny, BasePermission
from rest_framework import status, viewsets, generics
from rest_framework.decorators import action
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

from .models import (    User, Event, EventRegistration, Session, Question,

    Submission, JudgingCriteria, JudgeAssignment, Score,
    Team, TeamMember, SpeakerSession, Partner, Signatory,
    BrandingConfiguration, BuddyGroup,
)
from .serializers import (
    RegistrationSerializer, UserSerializer,
    EventListSerializer, EventDetailSerializer, EventRegistrationSerializer,
    SessionSerializer, QuestionSerializer,
    SubmissionSerializer, SubmissionDetailSerializer,
    ScoreSerializer, JudgingCriteriaSerializer,
    LeaderboardEntrySerializer, JudgeAssignmentSerializer,
    TeamSerializer, TeamMemberSerializer,
    PartnerSerializer, SignatorySerializer,
    BrandingSerializer, BuddyGroupSerializer,
)
from .permissions import IsAdminOrReadOnly, IsJudge, IsAdminUser, IsJudgeOrAdmin
from .google_auth import verify_google_token

def resolve_event(identifier):
    try:
        return Event.objects.get(uuid=identifier)
    except (ValidationError, ValueError, TypeError, Event.DoesNotExist):
        pass
    try:
        return Event.objects.get(pk=identifier)
    except (ValidationError, ValueError, TypeError, Event.DoesNotExist):
        return None

def resolve_user(identifier):
    try:
        return User.objects.get(uuid=identifier)
    except (ValidationError, ValueError, TypeError, User.DoesNotExist):
        pass
    try:
        return User.objects.get(pk=identifier)
    except (ValidationError, ValueError, TypeError, User.DoesNotExist):
        return None



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
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            token_key = response.data.get('token')
            try:
                token = Token.objects.get(key=token_key)
                user = token.user
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
    permission_classes = [IsAuthenticated]
    def post(self, request):
        if request.auth:
            request.auth.delete()
            return Response({"detail": "Successfully logged out."}, status=status.HTTP_200_OK)
        return Response({"detail": "No active token found."}, status=status.HTTP_400_BAD_REQUEST)


class GoogleLoginView(APIView):
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

        if request.user.is_authenticated:
            existing_user = User.objects.filter(google_id=google_id).exclude(id=request.user.id).first()
            if existing_user:
                return Response({'error': 'This Google account is already linked to another user.'}, status=status.HTTP_400_BAD_REQUEST)
            user = request.user
            user.google_id = google_id
            if not user.avatar_url:
                user.avatar_url = picture
            user.save()
            return Response({'detail': 'Google account connected successfully.'}, status=status.HTTP_200_OK)

        event_id = request.data.get('event_id')
        user = User.objects.filter(google_id=google_id).first()
        if not user:
            user = User.objects.filter(email=email).first()
            if user:
                user.google_id = google_id
                user.save()
            else:
                username = email.split('@')[0]
                base_username = username
                counter = 1
                while User.objects.filter(username=username).exists():
                    username = f"{base_username}_{counter}"
                    counter += 1
                user = User.objects.create_user(
                    username=username,
                    email=email,
                    password=token,
                    display_name=name,
                    google_id=google_id,
                    avatar_url=picture,
                    role='attendee',
                )
        
        check_in_result = None
        if event_id:
            event = resolve_event(event_id)
            if event and event.is_active:
                reg, created = EventRegistration.objects.get_or_create(
                    user=user, event=event, 
                    defaults={'status': 'checked_in'}
                )
                if not created:
                    reg.status = 'checked_in'
                    reg.save()
                check_in_result = {
                    'event_title': event.title,
                    'status': reg.status,
                    'account_created': False # Google users are just linked
                }

        token_obj, _ = Token.objects.get_or_create(user=user)
        return Response({
            'token': token_obj.key,
            'username': user.username,
            'display_name': user.display_name or user.username,
            'role': user.role,
            'avatar_url': user.avatar_url,
            'check_in_result': check_in_result,
        }, status=status.HTTP_200_OK)


class MeView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)


class CheckInView(APIView):
    permission_classes = []
    def post(self, request):
        event_id = request.data.get('event_id')
        name = request.data.get('name', '').strip()
        profession = request.data.get('profession', '').strip()
        email = request.data.get('email', '').strip()
        phone = request.data.get('phone', '').strip()
        if not name or not profession:
            return Response({'error': 'Name and Profession are required.'}, status=status.HTTP_400_BAD_REQUEST)
        safe_pattern = re.compile(r"^[a-zA-Z0-9\s\.\-]+$")
        if not safe_pattern.match(name) or not safe_pattern.match(profession):
            return Response({'error': 'Name and Profession can only contain alphanumeric characters, spaces, dots, and hyphens.'}, status=status.HTTP_400_BAD_REQUEST)
        if not event_id:
            return Response({'error': 'Event ID is required.'}, status=status.HTTP_400_BAD_REQUEST)
        event = resolve_event(event_id)
        if not event or not event.is_active:
            return Response({'error': 'Event not found.'}, status=status.HTTP_404_NOT_FOUND)
        base_username = name.lower().replace(' ', '_')[:30]
        username = base_username
        user = None
        if email: user = User.objects.filter(email=email).first()
        if not user: user = User.objects.filter(username=username).first()
        default_password = 'blueox2026'
        created = False
        if not user:
            counter = 1
            while User.objects.filter(username=username).exists():
                username = f'{base_username}_{counter}'
                counter += 1
            user = User.objects.create_user(
                username=username, password=default_password, display_name=name, name=name,
                profession=profession, email=email or '', phone=phone or '', role='attendee', must_reset_password=True,
            )
            created = True
        registration, reg_created = EventRegistration.objects.get_or_create(user=user, event=event, defaults={'status': 'checked_in'})
        if not reg_created:
            registration.status = 'checked_in'
            registration.save()
        return Response({
            'detail': f'Checked in successfully as {user.display_name or user.username}!',
            'username': user.username, 'display_name': user.display_name, 'event_title': event.title,
            'account_created': created, 'default_password': default_password if created else None,
        }, status=status.HTTP_200_OK)


class ResetPasswordView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        new_password = request.data.get('new_password', '').strip()
        if not new_password or len(new_password) < 6:
            return Response({'error': 'Password must be at least 6 characters.'}, status=status.HTTP_400_BAD_REQUEST)
        user = request.user
        user.set_password(new_password)
        user.must_reset_password = False
        user.save()
        Token.objects.filter(user=user).delete()
        token = Token.objects.create(user=user)
        return Response({'detail': 'Password updated successfully.', 'token': token.key})


# ─── Events ─────────────────────────────────────────────────────

class EventViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdminOrReadOnly]
    def get_queryset(self):
        return Event.objects.all().order_by('start_date')
    def get_serializer_class(self):
        if self.action == 'list': return EventListSerializer
        return EventDetailSerializer
    def get_object(self):
        lookup_value = self.kwargs[self.lookup_url_kwarg or self.lookup_field]
        queryset = self.filter_queryset(self.get_queryset())
        try:
            obj = queryset.get(uuid=lookup_value)
        except (ValueError, TypeError, queryset.model.DoesNotExist):
            try:
                obj = queryset.get(pk=lookup_value)
            except (ValueError, TypeError, queryset.model.DoesNotExist):
                from rest_framework.exceptions import NotFound
                raise NotFound("Event not found.")
        self.check_object_permissions(self.request, obj)
        return obj
    def perform_create(self, serializer):
        event = serializer.save(created_by=self.request.user)
        self._handle_recurrence(event)
    def perform_update(self, serializer):
        old_instance = self.get_object()
        fields_changed = (
            old_instance.is_recurring != serializer.validated_data.get('is_recurring', old_instance.is_recurring) or
            old_instance.recurrence_type != serializer.validated_data.get('recurrence_type', old_instance.recurrence_type) or
            old_instance.recurrence_end_date != serializer.validated_data.get('recurrence_end_date', old_instance.recurrence_end_date) or
            old_instance.recurrence_day_of_week != serializer.validated_data.get('recurrence_day_of_week', old_instance.recurrence_day_of_week) or
            old_instance.recurrence_day_of_month != serializer.validated_data.get('recurrence_day_of_month', old_instance.recurrence_day_of_month)
        )
        event = serializer.save()
        if fields_changed:
            if event.recurrence_group_id:
                Event.objects.filter(recurrence_group_id=event.recurrence_group_id, start_date__gt=event.start_date).delete()
            self._handle_recurrence(event)
    def _handle_recurrence(self, event):
        if event.is_recurring and event.recurrence_type and event.recurrence_end_date:
            from datetime import timedelta
            from dateutil.relativedelta import relativedelta, MO, TU, WE, TH, FR, SA, SU
            
            days_map = [MO, TU, WE, TH, FR, SA, SU]

            if not event.recurrence_group_id:
                event.recurrence_group_id = uuid.uuid4()
                event.save(update_fields=['recurrence_group_id'])
            
            current_start, current_end = event.start_date, event.end_date
            duration = current_end - current_start
            
            while True:
                if event.recurrence_type == 'daily':
                    current_start += timedelta(days=1)
                elif event.recurrence_type == 'weekly':
                    if event.recurrence_day_of_week is not None and event.recurrence_day_of_week < 7:
                        # Find next occurrence of that specific day
                        current_start += relativedelta(weeks=1, weekday=days_map[event.recurrence_day_of_week])
                    else:
                        current_start += timedelta(weeks=1)
                elif event.recurrence_type == 'monthly':
                    if event.recurrence_day_of_month is not None:
                        current_start += relativedelta(months=1, day=event.recurrence_day_of_month)
                    else:
                        current_start += relativedelta(months=1)
                else:
                    break
                
                current_end = current_start + duration
                if current_start > event.recurrence_end_date:
                    break
                    
                Event.objects.create(
                    title=event.title, description=event.description, event_type=event.event_type,
                    start_date=current_start, end_date=current_end, location=event.location,
                    created_by=event.created_by, max_attendees=event.max_attendees, allow_teams=event.allow_teams,
                    max_team_size=event.max_team_size, is_active=event.is_active, is_recurring=False,
                    recurrence_group_id=event.recurrence_group_id
                )
    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def release_certificates(self, request, pk=None):
        event = self.get_object()
        event.certificates_released = True
        event.save()
        return Response({'detail': 'Certificates released successfully.'})
    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def unrelease_certificates(self, request, pk=None):
        event = self.get_object()
        event.certificates_released = False
        event.save()
        return Response({'detail': 'Certificates unreleased.'})

    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def generate_buddy_groups(self, request, pk=None):
        """Generates buddy groups for checked-in attendees with funny catchy names."""
        event = self.get_object()
        registrations = event.registrations.filter(status='checked_in', buddy_group__isnull=True)
        
        if not registrations.exists():
            return Response({'detail': 'No checked-in attendees without groups found.'}, status=status.HTTP_400_BAD_REQUEST)

        import random
        # Funny Catchy Names
        ADJECTIVES = ['Quantum', 'Sassy', 'Wobbly', 'Electric', 'Stealthy', 'Caffeinated', 'Dancing', 'Brilliant', 'Infinite', 'Grumpy', 'Funky', 'Zesty', 'Groovy', 'Sonic', 'Spicy', 'Cyber', 'Neon', 'Golden', 'Epic', 'Wild']
        NOUNS = ['Narwhals', 'Pixels', 'Builders', 'Pioneers', 'Capybaras', 'Ninjas', 'Coders', 'Architects', 'Unicorns', 'Wizards', 'Hobbits', 'Penguins', 'Dragons', 'Martians', 'Bunnies', 'Hackers', 'Sharks', 'Wolves', 'Tigers', 'Titans']

        reg_list = list(registrations)
        random.shuffle(reg_list)

        group_size = event.buddy_group_size or 5
        num_groups = (len(reg_list) + group_size - 1) // group_size

        created_count = 0
        
        for i in range(num_groups):
            # Generate funny name
            adj = random.choice(ADJECTIVES)
            noun = random.choice(NOUNS)
            group_name = f"{adj} {noun}"
            
            # Simple collision avoidance
            if event.buddy_groups.filter(name=group_name).exists():
                group_name = f"{group_name} {random.randint(1, 99)}"

            group = BuddyGroup.objects.create(event=event, name=group_name)
            
            chunk = reg_list[i*group_size : (i+1)*group_size]
            for reg in chunk:
                reg.buddy_group = group
                reg.save()
            
            created_count += 1

        return Response({
            'detail': f'Created {created_count} buddy groups with catchy names!',
            'groups_created': created_count
        })

    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def clear_buddy_groups(self, request, pk=None):
        event = self.get_object()
        event.buddy_groups.all().delete()
        event.registrations.update(buddy_group=None)
        return Response({'detail': 'All buddy groups cleared for this event.'})

    @action(detail=True, methods=['get'], permission_classes=[IsAdminUser])
    def get_buddy_groups(self, request, pk=None):
        event = self.get_object()
        groups = event.buddy_groups.all()
        data = []
        for g in groups:
            members = g.members.all()
            data.append({
                'id': g.id,
                'name': g.name,
                'created_at': g.created_at,
                'members': [
                    {
                        'id': m.user.id, 
                        'name': m.user.display_name or m.user.username, 
                        'profession': m.user.profession,
                        'phone': m.user.phone,
                        'avatar_url': m.user.avatar_url
                    }
                    for m in members
                ]
            })
        return Response(data)


class EventRegistrationView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request, event_id):
        event = resolve_event(event_id)
        if not event or not event.is_active: 
            return Response({"error": "Event not found or inactive."}, status=status.HTTP_404_NOT_FOUND)
        if event.max_attendees and event.attendee_count >= event.max_attendees:
            return Response({"error": "Event is full."}, status=status.HTTP_400_BAD_REQUEST)
        reg, created = EventRegistration.objects.get_or_create(event=event, user=request.user, defaults={'status': 'registered'})
        if not created:
            if reg.status == 'cancelled':
                reg.status = 'registered'
                reg.save()
            else: return Response({"detail": "Already registered."}, status=status.HTTP_200_OK)
        return Response(EventRegistrationSerializer(reg).data, status=status.HTTP_201_CREATED)
    def delete(self, request, event_id):
        try:
            reg = EventRegistration.objects.get(event_id=event_id, user=request.user)
            reg.status = 'cancelled'
            reg.save()
            return Response({"detail": "Registration cancelled."}, status=status.HTTP_200_OK)
        except EventRegistration.DoesNotExist: return Response({"error": "Not registered for this event."}, status=status.HTTP_404_NOT_FOUND)


class MyEventsView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        registrations = EventRegistration.objects.filter(user=request.user, status__in=['registered', 'checked_in']).select_related('event')
        events = [reg.event for reg in registrations if reg.event.is_recurring or reg.event.recurrence_group_id is None]
        return Response(EventListSerializer(events, many=True, context={'request': request}).data)


# ─── Q&A Sessions ───────────────────────────────────────────────

class SessionViewSet(viewsets.ModelViewSet):
    serializer_class = SessionSerializer
    permission_classes = [IsAdminOrReadOnly]
    def get_queryset(self):
        event_id = self.kwargs.get('event_id')
        if event_id:
            event = resolve_event(event_id)
            return Session.objects.filter(event=event) if event else Session.objects.none()
        return Session.objects.all()
    def perform_create(self, serializer):
        event = resolve_event(self.kwargs.get('event_id'))
        if event:
            serializer.save(event=event)


class QuestionViewSet(viewsets.ModelViewSet):
    serializer_class = QuestionSerializer
    permission_classes = [IsAuthenticated]
    def get_queryset(self):
        session_id = self.request.query_params.get('session')
        return Question.objects.filter(session_id=session_id) if session_id else Question.objects.all()
    def perform_create(self, serializer):
        new_question = serializer.save(member=self.request.user)
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(f'session_{new_question.session.id}', {'type': 'new_question', 'data': QuestionSerializer(new_question).data})
    def perform_update(self, serializer):
        updated = serializer.save()
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(f'session_{updated.session.id}', {'type': 'question_answered', 'data': QuestionSerializer(updated).data})


# ─── Submissions ────────────────────────────────────────────────

class SubmissionViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    def get_serializer_class(self):
        return SubmissionDetailSerializer if self.action == 'retrieve' else SubmissionSerializer
    def get_queryset(self):
        event_id = self.kwargs.get('event_id')
        if event_id:
            event = resolve_event(event_id)
            return Submission.objects.filter(event=event) if event else Submission.objects.none()
        return Submission.objects.all()
    def perform_create(self, serializer):
        event = resolve_event(self.kwargs.get('event_id'))
        if not event or not event.is_competition:
            from rest_framework.exceptions import ValidationError
            raise ValidationError("Submissions are only for competition events.")
        serializer.save(submitted_by=self.request.user, event=event)


# ─── Judging ────────────────────────────────────────────────────

class JudgeDashboardView(APIView):
    permission_classes = [IsJudgeOrAdmin]
    def get(self, request):
        events = Event.objects.all() if request.user.role == 'admin' else [a.event for a in JudgeAssignment.objects.filter(judge=request.user).select_related('event')]
        data = []
        for event in events:
            scored_count = Score.objects.filter(judge=request.user, submission__event=event).values('submission').distinct().count()
            data.append({
                'event_id': event.uuid, 'event_title': event.title, 'event_type': event.event_type,
                'total_submissions': Submission.objects.filter(event=event).count(), 'scored_submissions': scored_count,
                'criteria': JudgingCriteriaSerializer(event.judging_criteria.all(), many=True).data,
            })
        return Response(data)


class ScoreView(APIView):
    permission_classes = [IsJudgeOrAdmin]
    def post(self, request):
        submission_id, scores_data = request.data.get('submission'), request.data.get('scores', [])
        if not submission_id or not scores_data: return Response({"error": "submission and scores are required."}, status=status.HTTP_400_BAD_REQUEST)
        try: submission = Submission.objects.get(pk=submission_id)
        except Submission.DoesNotExist: return Response({"error": "Submission not found."}, status=status.HTTP_404_NOT_FOUND)
        if request.user.role != 'admin' and not JudgeAssignment.objects.filter(judge=request.user, event=submission.event).exists():
            return Response({"error": "You are not assigned to judge this event."}, status=status.HTTP_403_FORBIDDEN)
        saved_scores = []
        for entry in scores_data:
            criteria_id, score_val, comment = entry.get('criteria'), entry.get('score'), entry.get('comment', '')
            try: criteria = JudgingCriteria.objects.get(pk=criteria_id, event=submission.event)
            except JudgingCriteria.DoesNotExist: continue
            if score_val is None or float(score_val) < 0 or float(score_val) > criteria.max_score: continue
            score_obj, created = Score.objects.update_or_create(submission=submission, criteria=criteria, judge=request.user, defaults={'score': float(score_val), 'comment': comment})
            saved_scores.append(ScoreSerializer(score_obj).data)
        self._broadcast_leaderboard(submission.event)
        return Response({'detail': f'{len(saved_scores)} scores saved.', 'scores': saved_scores}, status=status.HTTP_200_OK)
    def _broadcast_leaderboard(self, event):
        try:
            channel_layer = get_channel_layer()
            async_to_sync(channel_layer.group_send)(f'event_{event.uuid}', {'type': 'leaderboard_update', 'data': self._compute_leaderboard(event)})
        except Exception: pass
    def _compute_leaderboard(self, event):
        submissions = Submission.objects.filter(event=event)
        entries = []
        for sub in submissions:
            total = Score.objects.filter(submission=sub).aggregate(total=Coalesce(Sum(F('score') * F('criteria__weight'), output_field=FloatField()), 0.0))['total']
            entries.append({'submission_id': sub.id, 'title': sub.title, 'submitted_by': sub.submitted_by.display_name or sub.submitted_by.username, 'total_score': round(total, 2)})
        entries.sort(key=lambda x: x['total_score'], reverse=True)
        for i, entry in enumerate(entries, 1): entry['rank'] = i
        return entries


class LeaderboardView(APIView):
    permission_classes = [AllowAny]
    def get(self, request, event_id):
        event = resolve_event(event_id)
        if not event: return Response({"error": "Event not found."}, status=status.HTTP_404_NOT_FOUND)
        if not event.is_competition: return Response({"error": "Leaderboard is only for competition events."}, status=status.HTTP_400_BAD_REQUEST)
        submissions = Submission.objects.filter(event=event)
        entries = []
        for sub in submissions:
            total = Score.objects.filter(submission=sub).aggregate(total=Coalesce(Sum(F('score') * F('criteria__weight'), output_field=FloatField()), 0.0))['total']
            entries.append({'rank': 0, 'submission_id': sub.id, 'title': sub.title, 'submitted_by': sub.submitted_by.display_name or sub.submitted_by.username, 'total_score': round(total, 2)})
        entries.sort(key=lambda x: x['total_score'], reverse=True)
        for i, entry in enumerate(entries, 1): entry['rank'] = i
        return Response(LeaderboardEntrySerializer(entries, many=True).data)


# ─── Admin Management ───────────────────────────────────────────

class PartnerViewSet(viewsets.ModelViewSet):
    queryset = Partner.objects.all()
    serializer_class = PartnerSerializer
    permission_classes = [IsAdminOrReadOnly]

class SignatoryViewSet(viewsets.ModelViewSet):
    queryset = Signatory.objects.all()
    serializer_class = SignatorySerializer
    permission_classes = [IsAdminOrReadOnly]

class JudgingCriteriaViewSet(viewsets.ModelViewSet):
    serializer_class = JudgingCriteriaSerializer
    permission_classes = [IsAdminUser]
    def get_queryset(self): 
        event = resolve_event(self.kwargs.get('event_id'))
        return JudgingCriteria.objects.filter(event=event) if event else JudgingCriteria.objects.none()
    def perform_create(self, serializer): 
        event = resolve_event(self.kwargs.get('event_id'))
        if event: serializer.save(event=event)

class JudgeAssignmentView(APIView):
    permission_classes = [IsAdminUser]
    def get(self, request, event_id):
        event = resolve_event(event_id)
        assignments = JudgeAssignment.objects.filter(event=event).select_related('judge') if event else []
        return Response([{'id': a.id, 'judge_id': a.judge.uuid, 'judge_username': a.judge.username, 'judge_name': a.judge.display_name or a.judge.username} for a in assignments])
    def post(self, request, event_id):
        judge_id = request.data.get('judge_id')
        event = resolve_event(event_id)
        if not event: return Response({'error': 'Event not found.'}, status=status.HTTP_404_NOT_FOUND)
        judge = resolve_user(judge_id)
        if not judge or judge.role not in ['judge', 'admin']: 
            return Response({'error': 'Judge not found.'}, status=status.HTTP_404_NOT_FOUND)
        JudgeAssignment.objects.get_or_create(event=event, judge=judge)
        return Response({'detail': 'Judge assigned.'}, status=status.HTTP_201_CREATED)
    def delete(self, request, event_id):
        judge_id = request.data.get('judge_id')
        event, judge = resolve_event(event_id), resolve_user(judge_id)
        if event and judge: JudgeAssignment.objects.filter(event=event, judge=judge).delete()
        return Response({'detail': 'Judge removed.'}, status=status.HTTP_200_OK)

class TeamViewSet(viewsets.ModelViewSet):
    serializer_class = TeamSerializer
    permission_classes = [IsAuthenticated]
    def get_queryset(self): 
        event = resolve_event(self.kwargs.get('event_id'))
        return Team.objects.filter(event=event) if event else Team.objects.none()
    def perform_create(self, serializer): 
        event = resolve_event(self.kwargs.get('event_id'))
        if event: serializer.save(event=event, created_by=self.request.user)
    @action(detail=True, methods=['post'])
    def join(self, request, event_id=None, pk=None):
        team = self.get_object()
        if team.members.count() >= team.event.max_team_size: return Response({'error': 'Team is full.'}, status=status.HTTP_400_BAD_REQUEST)
        TeamMember.objects.get_or_create(team=team, user=request.user)
        return Response({'detail': 'Joined team.'})

class UserListView(APIView):
    permission_classes = [IsAdminUser]
    def get(self, request):
        role, search = request.query_params.get('role'), request.query_params.get('search')
        users = User.objects.all()
        if role: users = users.filter(role=role)
        if search: users = users.filter(re.Q(username__icontains=search) | re.Q(display_name__icontains=search) | re.Q(email__icontains=search))
        return Response(UserSerializer(users, many=True).data)

class UserDetailView(APIView):
    permission_classes = [IsAdminUser]
    def patch(self, request, user_id):
        user = resolve_user(user_id)
        if not user: 
            return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
        user.role = request.data.get('role', user.role)
        user.is_flagged = request.data.get('is_flagged', user.is_flagged)
        user.save()
        return Response(UserSerializer(user).data)

    def delete(self, request, user_id):
        user = resolve_user(user_id)
        if not user:
            return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
        
        # Safety check: prevent self-deletion
        if user.id == request.user.id:
            return Response({'error': 'You cannot delete your own account.'}, status=status.HTTP_400_BAD_REQUEST)
            
        user.is_deleted = True
        user.save()
        return Response({'detail': 'User deleted successfully.'}, status=status.HTTP_204_NO_CONTENT)

class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request): return Response({'id': request.user.id, 'username': request.user.username, 'display_name': request.user.display_name, 'bio': request.user.bio, 'profession': request.user.profession, 'avatar_url': request.user.avatar_url, 'email': request.user.email, 'is_google_connected': bool(request.user.google_id)})
    def put(self, request):
        user = request.user
        user.display_name, user.bio, user.profession, user.avatar_url = request.data.get('display_name', user.display_name), request.data.get('bio', user.bio), request.data.get('profession', user.profession), request.data.get('avatar_url', user.avatar_url)
        user.save()
        return Response({'detail': 'Profile updated.', 'display_name': user.display_name, 'bio': user.bio, 'profession': user.profession, 'avatar_url': user.avatar_url})


# ─── Certificate & Sharing ──────────────────────────────────────

class CertificateView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request, event_id):
        event = resolve_event(event_id)
        if not event: return Response({'error': 'Event not found.'}, status=status.HTTP_404_NOT_FOUND)
        reg = EventRegistration.objects.filter(event=event, user=request.user).first()
        is_admin_preview = request.user.role == 'admin' and not reg
        if not reg and not is_admin_preview:
            return Response({'error': 'You are not registered for this event.'}, status=status.HTTP_403_FORBIDDEN)
        
        cert_type, rank = 'Attendance', None
        submission = Submission.objects.filter(event=event, submitted_by=request.user).first()
        if event.is_competition and submission:
            leaderboard = self._compute_leaderboard(event)
            user_rank = next((item['rank'] for item in leaderboard if item['submission_id'] == submission.id), None)
            if user_rank == 1: cert_type, rank = 'Excellence (Winner)', 1
            elif user_rank == 2: cert_type, rank = 'Excellence (1st Runner Up)', 2
            elif user_rank == 3: cert_type, rank = 'Excellence (2nd Runner Up)', 3
            else: cert_type = 'Participation'
        
        return Response({
            'event': EventDetailSerializer(event).data,
            'attendee_name': request.user.display_name or request.user.username,
            'certificate_type': cert_type, 'rank': rank,
            'submission': SubmissionSerializer(submission).data if submission else None,
            'sharing_url': f"{settings.FRONTEND_URL}/verify/{submission.id}" if submission else None,
        })
    def _compute_leaderboard(self, event):
        submissions = Submission.objects.filter(event=event)
        entries = []
        for sub in submissions:
            total = Score.objects.filter(submission=sub).aggregate(total=Coalesce(Sum(F('score') * F('criteria__weight'), output_field=FloatField()), 0.0))['total']
            entries.append({'submission_id': sub.id, 'total_score': round(total, 2)})
        entries.sort(key=lambda x: x['total_score'], reverse=True)
        for i, entry in enumerate(entries, 1): entry['rank'] = i
        return entries

class PublicSubmissionView(APIView):
    permission_classes = [AllowAny]
    def get(self, request, pk):
        try: sub = Submission.objects.get(pk=pk)
        except Submission.DoesNotExist: return Response({'error': 'Submission not found.'}, status=status.HTTP_404_NOT_FOUND)
        event = sub.event
        total = Score.objects.filter(submission=sub).aggregate(total=Coalesce(Sum(F('score') * F('criteria__weight'), output_field=FloatField()), 0.0))['total']
        scores = Score.objects.filter(submission=sub).select_related('criteria', 'judge')
        
        rank = None
        if event.is_competition:
            # Simple leaderboard compute
            all_subs = Submission.objects.filter(event=event)
            entries = []
            for s in all_subs:
                s_total = Score.objects.filter(submission=s).aggregate(t=Coalesce(Sum(F('score') * F('criteria__weight'), output_field=FloatField()), 0.0))['t']
                entries.append({'id': s.id, 'score': s_total})
            entries.sort(key=lambda x: x['score'], reverse=True)
            rank = next((i+1 for i, e in enumerate(entries) if e['id'] == sub.id), None)

        return Response({
            'event_title': event.title, 'submission_title': sub.title, 'submitted_by': sub.submitted_by.display_name or sub.submitted_by.username,
            'total_score': round(total, 2), 'rank': rank, 'scores': ScoreSerializer(scores, many=True).data, 'is_competition': event.is_competition
        })


class WallOfFameView(APIView):
    permission_classes = [AllowAny]
    def get(self, request, event_id):
        event = resolve_event(event_id)
        if not event: return Response({'error': 'Event not found.'}, status=status.HTTP_404_NOT_FOUND)
        submissions = Submission.objects.filter(event=event)
        entries = []
        for sub in submissions:
            total = Score.objects.filter(submission=sub).aggregate(total=Coalesce(Sum(F('score') * F('criteria__weight'), output_field=FloatField()), 0.0))['total']
            entries.append({'submission_id': sub.id, 'title': sub.title, 'submitted_by': sub.submitted_by.display_name or sub.submitted_by.username, 'bio': sub.submitted_by.bio, 'avatar_url': sub.submitted_by.avatar_url, 'total_score': round(total, 2)})
        entries.sort(key=lambda x: x['total_score'], reverse=True)
        top_entries = entries[:3]
        for i, entry in enumerate(top_entries, 1): entry['rank'] = i
        return Response(top_entries)
class GlobalWallOfFameView(APIView):
    permission_classes = [AllowAny]
    def get(self, request):
        # Fetch all events with competition results
        events = Event.objects.filter(is_active=True).prefetch_related('submissions', 'submissions__submitted_by')
        global_winners = []
        
        for event in events:
            submissions = event.submissions.all()
            if not submissions.exists():
                continue
                
            # Compute top 3 for this event
            entries = []
            for sub in submissions:
                total = Score.objects.filter(submission=sub).aggregate(
                    total=Coalesce(Sum(F('score') * F('criteria__weight'), output_field=FloatField()), 0.0)
                )['total']
                entries.append({
                    'submission_id': sub.id, 
                    'title': sub.title, 
                    'submitted_by': sub.submitted_by.display_name or sub.submitted_by.username, 
                    'avatar_url': sub.submitted_by.avatar_url,
                    'event_title': event.title,
                    'total_score': round(total, 2)
                })
            
            entries.sort(key=lambda x: x['total_score'], reverse=True)
            # Add top 3 to global list
            global_winners.extend(entries[:3])
            
        # Optional: Sort global winners by score or recency
        global_winners.sort(key=lambda x: x['total_score'], reverse=True)
            
        return Response(global_winners[:12]) # Show top 12 global performers

class ProfileDownloadView(APIView):
    permission_classes = [AllowAny]
    def get(self, request, event_id, user_id=None):
        event = resolve_event(event_id)
        if not event: return Response({'error': 'Event not found.'}, status=status.HTTP_404_NOT_FOUND)
        target_user = resolve_user(user_id) if user_id else (request.user if request.user.is_authenticated else None)
        if not target_user: return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
        is_judge = JudgeAssignment.objects.filter(event=event, judge=target_user).exists()
        return Response({'event_title': event.title, 'name': target_user.display_name or target_user.username, 'role': target_user.get_role_display(), 'profession': target_user.profession, 'bio': target_user.bio, 'avatar_url': target_user.avatar_url, 'is_judge': is_judge})


# ─── Admin Dashboard & Misc ─────────────────────────────────────

class AdminDashboardView(APIView):
    permission_classes = [IsAdminUser]
    def get(self, request):
        from django.db.models.functions import TruncMonth
        from django.db.models import Count, Avg, F
        from datetime import datetime, timedelta
        
        # Total Stats
        total_events = Event.objects.count()
        total_users = User.objects.count()
        total_submissions = Submission.objects.count()
        avg_rating = Score.objects.aggregate(avg=Avg('score'))['avg'] or 0.0
        
        # Registration Activity (Last 6 Months)
        six_months_ago = datetime.now() - timedelta(days=180)
        activity_qs = EventRegistration.objects.filter(registered_at__gte=six_months_ago)\
            .annotate(month=TruncMonth('registered_at'))\
            .values('month')\
            .annotate(val=Count('id'))\
            .order_by('month')
            
        registration_activity = [
            {'name': item['month'].strftime('%b').upper(), 'val': item['val']}
            for item in activity_qs
        ] or [{'name': datetime.now().strftime('%b').upper(), 'val': 0}]
        
        # Event Distribution (By Type)
        dist_qs = Event.objects.values('event_type').annotate(value=Count('id'))
        event_distribution = [
            {'name': item['event_type'].capitalize(), 'value': item['value']}
            for item in dist_qs
        ] or [{'name': 'No Events', 'value': 0}]
        
        # Engagement Data (Mock/Placeholder for now as we don't track daily active users explicitly yet)
        engagement_data = [
            {'name': (datetime.now() - timedelta(days=i)).strftime('%a'), 'uv': 10+i, 'pv': 15+i}
            for i in range(5, 0, -1)
        ]
        
        return Response({
            'total_events': total_events,
            'active_users': total_users,
            'total_submissions': total_submissions,
            'avg_rating': round(avg_rating, 1),
            'registration_activity': registration_activity,
            'event_distribution': event_distribution,
            'engagement_data': engagement_data,
            'recent_registrations': EventRegistrationSerializer(EventRegistration.objects.order_by('-registered_at')[:10], many=True).data
        })

class AdminPasswordResetView(APIView):
    permission_classes = [IsAdminUser]
    def post(self, request):
        user_id, new_password = request.data.get('user_id'), request.data.get('new_password')
        try:
            user = User.objects.get(id=user_id)
            user.set_password(new_password); user.save()
            return Response({'detail': 'Password reset by admin.'})
        except User.DoesNotExist: return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

class EventAttendeesView(APIView):
    permission_classes = [IsAdminUser]
    def get(self, request, event_id):
        event = resolve_event(event_id)
        return Response(EventRegistrationSerializer(EventRegistration.objects.filter(event=event), many=True).data) if event else Response([])

class EventAnalyticsView(APIView):
    permission_classes = [IsAdminUser]
    def get(self, request, event_id):
        event = resolve_event(event_id)
        if not event: return Response({'error': 'Event not found.'}, status=status.HTTP_404_NOT_FOUND)
            
        total_registered = EventRegistration.objects.filter(event=event).count()
        checked_in = EventRegistration.objects.filter(event=event, status='checked_in').count()
        
        # Registration timeline (last 7 days or all time)
        from django.db.models.functions import TruncDate
        timeline_qs = EventRegistration.objects.filter(event=event)\
            .annotate(date=TruncDate('registered_at'))\
            .values('date')\
            .annotate(count=Count('id'))\
            .order_by('date')
            
        timeline = [{'date': str(item['date']), 'count': item['count']} for item in timeline_qs]
        
        return Response({
            'total_registered': total_registered,
            'checked_in': checked_in,
            'check_in_rate': round((checked_in / total_registered * 100), 1) if total_registered > 0 else 0,
            'sessions_count': Session.objects.filter(event=event).count(),
            'submissions_count': Submission.objects.filter(event=event).count(),
            'teams_count': Team.objects.filter(event=event).count(),
            'judges_count': JudgeAssignment.objects.filter(event=event).count(),
            'average_score': round(Score.objects.filter(submission__event=event).aggregate(avg=Avg('score'))['avg'] or 0.0, 1),
            'registration_timeline': timeline
        })

class ExportView(APIView):
    permission_classes = [IsAdminUser]
    def get(self, request, event_id):
        event = resolve_event(event_id)
        if not event: return Response({'error': 'Event not found.'}, status=status.HTTP_404_NOT_FOUND)
        registrations = EventRegistration.objects.filter(event=event).select_related('user')
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(['Username', 'Display Name', 'Email', 'Role', 'Status'])
        for r in registrations: writer.writerow([r.user.username, r.user.display_name, r.user.email, r.user.role, r.status])
        response = HttpResponse(output.getvalue(), content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="attendees_{event.id}.csv"'
        return response

class SpeakerListView(APIView):
    permission_classes = [AllowAny]
    def get(self, request, event_id):
        event = resolve_event(event_id)
        return Response(UserSerializer(User.objects.filter(role='speaker', speaker_sessions__session__event=event).distinct(), many=True).data) if event else Response([])

class SpeakerProfileView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request): return Response(UserSerializer(request.user).data)
    def put(self, request):
        user = request.user
        for attr, value in request.data.items():
            if hasattr(user, attr): setattr(user, attr, value)
        user.save()
        return Response(UserSerializer(user).data)
class BrandingView(generics.RetrieveUpdateAPIView):
    queryset = BrandingConfiguration.objects.all()
    serializer_class = BrandingSerializer

    def get_object(self):
        return BrandingConfiguration.get_solo()

    def get_permissions(self):
        from rest_framework import permissions
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.AllowAny()]
        return [IsAuthenticated(), IsAdminUser()]
