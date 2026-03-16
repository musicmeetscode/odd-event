# from sqlite3 import IntegrityError
from datetime import timedelta
from django.shortcuts import render
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, viewsets
from rest_framework.authtoken.models import Token
from rest_framework.authtoken.views import ObtainAuthToken
from .models import User, Session, Question
from .serializers import AudienceRegistrationSerializer, SessionSerializer, QuestionSerializer
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.db import transaction, IntegrityError
from .permissions import IsSpeakerOrReadOnly
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

class AudienceRegistrationView(APIView):
    """
    Handles registration of audience members with username and password
    Creates a user account and issues a token
    """

    # Anyone can access this view
    permission_classes = []
    
    def post(self, request):
        serializer = AudienceRegistrationSerializer(data=request.data)

        if serializer.is_valid():
            username = serializer.validated_data['username'] # type: ignore
            password = serializer.validated_data['password'] # type: ignore
            display_name = serializer.validated_data.get('display_name', username) # type: ignore

            try:
                # Create user with password
                new_member = User.objects.create_user(
                    username=username,
                    password=password,
                    display_name=display_name,
                    is_speaker=False
                )

                print(f"DEBUG: Created attendee user: {new_member.username}")
 
                token, created = Token.objects.get_or_create(user=new_member) 

                return Response({
                    'token': token.key,
                    'username': new_member.username,
                    'display_name': new_member.display_name,
                    'is_speaker': False
                }, status=status.HTTP_201_CREATED)
                    
            except IntegrityError as e:
                # Username already exists
                print(f"Registration error: {e}") 
                return Response(
                    {"error": "Username already exists. Please choose a different username."}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        return Response(serializer.errors, status.HTTP_400_BAD_REQUEST)


class AudienceLoginView(ObtainAuthToken):
    """
    Login view for audience members
    Authenticates using username and password, returns token
    """
    
    def post(self, request, *args, **kwargs):
        # Call the base class to authenticate
        response = super().post(request, *args, **kwargs)
        
        # Check for successful authentication
        if response.status_code == 200:
            token_key = response.data.get('token')
            
            # Get the user from the token
            try:
                token = Token.objects.get(key=token_key)
                user = token.user
                
                # Check that user is NOT a speaker
                if not user.is_speaker:
                    return Response({
                        'token': token_key,
                        'username': user.username,
                        'display_name': user.display_name,
                        'is_speaker': False
                    })
                else:
                    # If a speaker tries to login as audience, deny
                    return Response(
                        {"error": "This account is registered as a speaker. Please use the speaker login."},
                        status=status.HTTP_403_FORBIDDEN
                    )
            except Token.DoesNotExist:
                return Response(
                    {"error": "Authentication failed"},
                    status=status.HTTP_401_UNAUTHORIZED
                )
        
        # If authentication failed, return the error from base class
        return response
class SpeakerCodeLoginView(APIView):
    """
    Simple login for speakers with just their code. Will enforce later
    
    """
    def post(self, request, *args, **kwargs):
        # Keeping the same request body and extracting to code
        code = request.data.get("username")
        if not code:
            return Response({"error": "Code is required."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            # Find the user by their speaker code
            user = User.objects.get(speaker_code=code, is_speaker=True)
        except User.DoesNotExist:
            return Response({"error": "Invalid or unauthorized code."}, status=status.HTTP_404_NOT_FOUND)

        # Create or get an authentication token
        token, created = Token.objects.get_or_create(user=user)
        return Response({
            "token": token.key,
            "username": user.username,
            "is_speaker": user.is_speaker
        }, status=status.HTTP_200_OK)
class SpeakerLoginView(ObtainAuthToken):
    """
    Custom view for Speaker login. 
    It ensures the authenticated user is marked as a speaker before issuing a token.
    """
    
    def post(self, request, *args, **kwargs):  
        # 1. Call the base class to authenticate and get the initial token response
        response = super().post(request, *args, **kwargs)
        
        # Check for successful authentication (200 OK)
        if response.status_code == 200:
            token_key = response.data.get('token')
            
            # Get the user from the token
            try:
                token = Token.objects.get(key=token_key)
                user = token.user
                
                # 2. Custom check for speaker status
                if user.is_speaker:
                    print(f"The username is {user.username}")
                    # Success: Return the desired custom payload and EXIT
                    return Response({
                        'token': token_key,
                        'username': user.username,
                        'is_speaker': user.is_speaker
                    }, status=status.HTTP_200_OK)
                else:
                    # 3. Deny non-speakers (403 Forbidden)
                    return Response(
                        {"non_field_errors": ["Access denied. Only speakers may log in here."]},
                        status=status.HTTP_403_FORBIDDEN
                    )
            except Token.DoesNotExist:
                return Response(
                    {"error": "Authentication failed"},
                    status=status.HTTP_401_UNAUTHORIZED
                )
        
        return response
    
class LogoutView(APIView):
    """
    Delete the auth token for authenticated user, thus logging them out
    Works for both speakers and audience members
    """

    # Require only logged in users to access this view
    permission_classes = [IsAuthenticated] 

    def post(self, request):
        if request.auth:
            request.auth.delete()
            return Response(
                {"detail: Successfully Logged Out."},
                status = status.HTTP_200_OK
            )

        return Response(
            {"No active token found for user."},
            status=status.HTTP_400_BAD_REQUEST
        )
    

class SessionViewSet(viewsets.ModelViewSet):
    """
    Allows speakers to manage sessions and allows general viewing by anyone.
    """
    queryset = Session.objects.all().order_by('start_time')
    serializer_class = SessionSerializer
    
    # You need a custom permission that allows GET/HEAD/OPTIONS for all, 
    # but requires IsAuthenticated AND IsSpeaker for POST/PUT/DELETE.
    permission_classes = [IsSpeakerOrReadOnly] 
    
    # Optional: Automatically assign the creator as a speaker
    def perform_create(self, serializer):
        # Assumes the authenticated user is a speaker
        # Save the session first, then add the speaker to the many-to-many relationship
        session = serializer.save()
        session.speakers.add(self.request.user)

    def get_queryset(self):
        if self.action == 'list':
            two_hours_ago = timezone.now() - timedelta(hours=2)
            return self.queryset.filter(start_time__gte=two_hours_ago).order_by('start_time')
        return super().get_queryset()


class QuestionViewSet(viewsets.ModelViewSet):
    """
    Allows audience members to create questions (POST) 
    and speakers to view questions (GET) and mark them answered (PUT).
    """
    queryset = Question.objects.all().order_by('-created_at')
    serializer_class = QuestionSerializer
    # Only authenticated users (audience or speaker) can create a question
    permission_classes = [IsAuthenticated] 
    
    # Filter the queryset based on session_id query parameter
    def get_queryset(self):  # type: ignore[override]
        queryset = Question.objects.all().order_by('-created_at')
        
        # Filter by session if session query parameter is provided
        session_id = self.request.query_params.get('session', None)
        if session_id is not None:
            queryset = queryset.filter(session_id=session_id)
        
        # user = self.request.user
        # if getattr(user, "is_speaker", False):
        #     return queryset.filter(session__speakers=user)
        
        # Audience members can see questions for the session they're viewing
        return queryset.filter()
    def perform_update(self, serializer):
        # 1. Save the updated Question object (synchronous)
        updated_question = serializer.save()

        # 2. Check if the user is a speaker. Only speakers should trigger the answer status change.
        if not self.request.user.is_speaker:
            # Prevent non-speakers from updating the answer status
            # This is a secondary check, as permissions should handle this, but it's safer.
            return 
        
        # 3. Serialize the updated object for broadcasting
        broadcast_serializer = self.get_serializer(updated_question)
        
        # 4. Get the Channel Layer and Group Name
        channel_layer = get_channel_layer()
        session_id = updated_question.session.id
        session_group_name = f'session_{session_id}'

        # 5. Send the message to the Channel Group
        async_to_sync(channel_layer.group_send)(
            session_group_name,
            {
                # Use a different type for answered questions so the frontend can react differently
                'type': 'question_answered', 
                'data': broadcast_serializer.data
            }
        )

    # Override create to inject the authenticated audience member/user
    def perform_create(self, serializer):
            # 1. Save the new Question object to the database (synchronous)
            new_question = serializer.save(member=self.request.user)
            
            # 2. Get the Channel Layer instance
            channel_layer = get_channel_layer()
            
            # 3. Define the session's channel group name
            session_id = new_question.session.id
            session_group_name = f'session_{session_id}'
            
            # 4. Serialize the saved object for broadcasting
            # Since the serializer is already defined for the model, we use it here.
            broadcast_serializer = QuestionSerializer(new_question)

            # 5. Send the message to the Channel Group (using async_to_sync)
            async_to_sync(channel_layer.group_send)(
                session_group_name,
                {
                    # This 'type' field MUST match the method name in your consumer (new_question)
                    'type': 'new_question', 
                    # The data payload to be sent to all subscribed clients
                    'data': broadcast_serializer.data 
                }
            )