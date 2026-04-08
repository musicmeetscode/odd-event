from django.urls import path, include
from . import views
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register(r'events', views.EventViewSet, basename='event')
router.register(r'questions', views.QuestionViewSet, basename='question')
router.register(r'partners', views.PartnerViewSet, basename='partner')
router.register(r'signatories', views.SignatoryViewSet, basename='signatory')

urlpatterns = [
    # Auth
    path('auth/register/', views.RegisterView.as_view(), name='register'),
    path('auth/login/', views.LoginView.as_view(), name='login'),
    path('auth/google/', views.GoogleLoginView.as_view(), name='google-login'),
    path('auth/logout/', views.LogoutView.as_view(), name='logout'),
    path('auth/me/', views.MeView.as_view(), name='me'),
    path('auth/reset-password/', views.ResetPasswordView.as_view(), name='reset-password'),

    # Public check-in (no auth required)
    path('check-in/', views.CheckInView.as_view(), name='check-in'),

    # Event registration
    path('events/<str:event_id>/register/', views.EventRegistrationView.as_view(), name='event-register'),

    # Event attendees
    path('events/<str:event_id>/attendees/', views.EventAttendeesView.as_view(), name='event-attendees'),

    # Sessions (Q&A) scoped to event
    path('events/<str:event_id>/sessions/', views.SessionViewSet.as_view({
        'get': 'list', 'post': 'create',
    }), name='event-sessions'),
    path('events/<str:event_id>/sessions/<int:pk>/', views.SessionViewSet.as_view({
        'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy',
    }), name='event-session-detail'),

    # Submissions scoped to event
    path('events/<str:event_id>/submissions/', views.SubmissionViewSet.as_view({
        'get': 'list', 'post': 'create',
    }), name='event-submissions'),
    path('events/<str:event_id>/submissions/<int:pk>/', views.SubmissionViewSet.as_view({
        'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy',
    }), name='event-submission-detail'),

    # Leaderboard & Wall of Fame
    path('events/<str:event_id>/leaderboard/', views.LeaderboardView.as_view(), name='event-leaderboard'),
    path('events/<str:event_id>/wall-of-fame/', views.WallOfFameView.as_view(), name='event-wall-of-fame'),
    path('global-wall-of-fame/', views.GlobalWallOfFameView.as_view(), name='global-wall-of-fame'),

    # Admin: judging criteria management
    path('events/<str:event_id>/criteria/', views.JudgingCriteriaViewSet.as_view({
        'get': 'list', 'post': 'create',
    }), name='event-criteria'),
    path('events/<str:event_id>/criteria/<int:pk>/', views.JudgingCriteriaViewSet.as_view({
        'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy',
    }), name='event-criteria-detail'),

    # Admin: judge assignment
    path('events/<str:event_id>/judges/', views.JudgeAssignmentView.as_view(), name='event-judges'),

    # Teams
    path('events/<str:event_id>/teams/', views.TeamViewSet.as_view({
        'get': 'list', 'post': 'create',
    }), name='event-teams'),
    path('events/<str:event_id>/teams/<int:pk>/', views.TeamViewSet.as_view({
        'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy',
    }), name='event-team-detail'),
    path('events/<str:event_id>/teams/<int:pk>/join/', views.TeamViewSet.as_view({
        'post': 'join',
    }), name='event-team-join'),
    path('events/<str:event_id>/teams/<int:pk>/leave/', views.TeamViewSet.as_view({
        'post': 'leave',
    }), name='event-team-leave'),
    path('events/<str:event_id>/teams/<int:pk>/add_member/', views.TeamViewSet.as_view({
        'post': 'add_member',
    }), name='event-team-add-member'),
    path('events/<str:event_id>/teams/<int:pk>/remove_member/', views.TeamViewSet.as_view({
        'post': 'remove_member',
    }), name='event-team-remove-member'),

    # Analytics
    path('events/<str:event_id>/analytics/', views.EventAnalyticsView.as_view(), name='event-analytics'),

    # Export
    path('events/<str:event_id>/export/', views.ExportView.as_view(), name='event-export'),

    # Speakers
    path('events/<str:event_id>/speakers/', views.SpeakerListView.as_view(), name='event-speakers'),

    # Speaker profile
    path('profile/', views.SpeakerProfileView.as_view(), name='speaker-profile'),

    # Certificate & Sharing
    path('events/<str:event_id>/certificate/', views.CertificateView.as_view(), name='event-certificate'),
    path('public/submission/<int:pk>/', views.PublicSubmissionView.as_view(), name='public-submission'),
    
    # Profile cards
    path('events/<str:event_id>/profile/', views.ProfileDownloadView.as_view(), name='user-profile'),
    path('events/<str:event_id>/profile/<str:user_id>/', views.ProfileDownloadView.as_view(), name='user-profile-shared'),

    # Admin: user management
    path('users/', views.UserListView.as_view(), name='user-list'),
    path('users/<str:user_id>/', views.UserDetailView.as_view(), name='user-detail'),
    path('users/reset-password/', views.AdminPasswordResetView.as_view(), name='admin-reset-password'),

    # Admin: Dashboard stats
    path('dashboard/stats/', views.AdminDashboardView.as_view(), name='admin-dashboard-stats'),

    # Judge
    path('judge/dashboard/', views.JudgeDashboardView.as_view(), name='judge-dashboard'),
    path('judge/score/', views.ScoreView.as_view(), name='judge-score'),

    # Branding
    path('branding/', views.BrandingView.as_view(), name='branding'),

    # Router URLs
    path('', include(router.urls)),
]