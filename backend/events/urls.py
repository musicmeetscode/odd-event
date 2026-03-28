from django.urls import path, include
from . import views
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register(r'events', views.EventViewSet, basename='event')
router.register(r'questions', views.QuestionViewSet, basename='question')

urlpatterns = [
    # Auth
    path('auth/register/', views.RegisterView.as_view(), name='register'),
    path('auth/login/', views.LoginView.as_view(), name='login'),
    path('auth/logout/', views.LogoutView.as_view(), name='logout'),
    path('auth/me/', views.MeView.as_view(), name='me'),
    path('auth/reset-password/', views.ResetPasswordView.as_view(), name='reset-password'),

    # Public check-in (no auth required)
    path('check-in/', views.CheckInView.as_view(), name='check-in'),

    # Event registration
    path('events/<int:event_id>/register/', views.EventRegistrationView.as_view(), name='event-register'),

    # Event attendees
    path('events/<int:event_id>/attendees/', views.EventAttendeesView.as_view(), name='event-attendees'),

    # Sessions (Q&A) scoped to event
    path('events/<int:event_id>/sessions/', views.SessionViewSet.as_view({
        'get': 'list', 'post': 'create',
    }), name='event-sessions'),
    path('events/<int:event_id>/sessions/<int:pk>/', views.SessionViewSet.as_view({
        'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy',
    }), name='event-session-detail'),

    # Submissions scoped to event
    path('events/<int:event_id>/submissions/', views.SubmissionViewSet.as_view({
        'get': 'list', 'post': 'create',
    }), name='event-submissions'),
    path('events/<int:event_id>/submissions/<int:pk>/', views.SubmissionViewSet.as_view({
        'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy',
    }), name='event-submission-detail'),

    # Leaderboard
    path('events/<int:event_id>/leaderboard/', views.LeaderboardView.as_view(), name='event-leaderboard'),

    # Admin: judging criteria management
    path('events/<int:event_id>/criteria/', views.JudgingCriteriaViewSet.as_view({
        'get': 'list', 'post': 'create',
    }), name='event-criteria'),
    path('events/<int:event_id>/criteria/<int:pk>/', views.JudgingCriteriaViewSet.as_view({
        'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy',
    }), name='event-criteria-detail'),

    # Admin: judge assignment
    path('events/<int:event_id>/judges/', views.JudgeAssignmentView.as_view(), name='event-judges'),

    # Teams
    path('events/<int:event_id>/teams/', views.TeamViewSet.as_view({
        'get': 'list', 'post': 'create',
    }), name='event-teams'),
    path('events/<int:event_id>/teams/<int:pk>/', views.TeamViewSet.as_view({
        'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy',
    }), name='event-team-detail'),
    path('events/<int:event_id>/teams/<int:pk>/join/', views.TeamViewSet.as_view({
        'post': 'join',
    }), name='event-team-join'),
    path('events/<int:event_id>/teams/<int:pk>/leave/', views.TeamViewSet.as_view({
        'post': 'leave',
    }), name='event-team-leave'),
    path('events/<int:event_id>/teams/<int:pk>/add_member/', views.TeamViewSet.as_view({
        'post': 'add_member',
    }), name='event-team-add-member'),
    path('events/<int:event_id>/teams/<int:pk>/remove_member/', views.TeamViewSet.as_view({
        'post': 'remove_member',
    }), name='event-team-remove-member'),

    # Analytics
    path('events/<int:event_id>/analytics/', views.EventAnalyticsView.as_view(), name='event-analytics'),

    # Export
    path('events/<int:event_id>/export/', views.ExportView.as_view(), name='event-export'),

    # Speakers
    path('events/<int:event_id>/speakers/', views.SpeakerListView.as_view(), name='event-speakers'),

    # Speaker profile
    path('profile/', views.SpeakerProfileView.as_view(), name='speaker-profile'),

    # Certificate
    path('events/<int:event_id>/certificate/', views.CertificateView.as_view(), name='event-certificate'),

    # Admin: user list
    path('users/', views.UserListView.as_view(), name='user-list'),
    path('users/<int:user_id>/', views.UserDetailView.as_view(), name='user-detail'),
    path('users/reset-password/', views.AdminPasswordResetView.as_view(), name='admin-reset-password'),

    # Admin: Dashboard stats
    path('dashboard/stats/', views.AdminDashboardView.as_view(), name='admin-dashboard-stats'),

    # Judge
    path('judge/dashboard/', views.JudgeDashboardView.as_view(), name='judge-dashboard'),
    path('judge/score/', views.ScoreView.as_view(), name='judge-score'),

    # My events
    path('my-events/', views.MyEventsView.as_view(), name='my-events'),

    # Router URLs (events CRUD)
    path('', include(router.urls)),
]