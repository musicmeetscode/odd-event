from rest_framework import serializers
from .models import User, Session, Question
from django.contrib.auth.models import Group


class AudienceRegistrationSerializer(serializers.Serializer):
    """
    Serializer for audience member registration with username and password
    """
    username = serializers.CharField(max_length=150)
    password = serializers.CharField(write_only=True, min_length=6)
    display_name = serializers.CharField(max_length=150, required=False)

    def validate_username(self, value):
        # Ensuring the username isn't already in use
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError(f"The username '{value}' is already taken. Please choose another.")
        return value

class SessionSerializer(serializers.ModelSerializer):
    """Serializer for Session model."""
    # Add a custom field to get speaker names
    speaker_names = serializers.SerializerMethodField()
    
    class Meta:
        model = Session
        # Include all fields the speaker or audience needs to see
        fields = ['id', 'title', 'start_time', 'room_location', 'speakers', 'speaker_names']
        # speakers is read-only since it's a many-to-many field
        read_only_fields = ['speakers'] 

    def get_speaker_names(self, obj):
        """Return a list of speaker display names"""
        return [speaker.display_name or speaker.username for speaker in obj.speakers.all()]

class QuestionSerializer(serializers.ModelSerializer):
    """Serializer for Question model."""
    # Use StringRelatedField for readability or PrimaryKeyRelatedField for simple ID access
    member_name = serializers.CharField(source='member.display_name', read_only=True) 
    
    class Meta:
        model = Question
        # Include all fields relevant to Q&A display and management
        fields = ['id', 'session', 'member', 'member_name', 'content', 'created_at', 'is_answered', 'answer_text']
        # Audience members should not manually set the member or creation time
        # Note: is_answered is NOT in read_only_fields so speakers can update it via PATCH
        read_only_fields = ['member', 'created_at']

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # If the serializer is being used for a creation (POST), 
        # restrict these fields to prevent audience manipulation.
        # Check if context and request exist before accessing
        request = self.context.get('request')
        if request and request.method == 'POST':
             self.fields['is_answered'].read_only = True
             self.fields['answer_text'].read_only = True