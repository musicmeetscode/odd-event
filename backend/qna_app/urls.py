from django.urls import path, include
from . import views
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register(r'sessions', views.SessionViewSet, basename='session')
router.register(r'questions', views.QuestionViewSet, basename='question')

urlpatterns = [
    # Audience authentication
    path('auth/register-audience/', views.AudienceRegistrationView.as_view(), name='register-audience'),
    path('auth/login-audience/', views.AudienceLoginView.as_view(), name='login-audience'),

    # Speaker authentication (kept as 'login' for backwards compatibility)
    path('auth/login/', views.SpeakerLoginView.as_view(), name="speaker-login"),


    path('speakers/login/', views.SpeakerCodeLoginView.as_view(), name="speaker-code-login"),

    # Logout endpoint (works for both)
    path('auth/logout/', views.LogoutView.as_view(), name='api_logout'),

    # router urls for ModelViewSets
    path('', include(router.urls))
]