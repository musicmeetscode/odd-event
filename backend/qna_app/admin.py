from django.contrib import admin
from import_export.admin import ImportExportModelAdmin
from .models import User, Session, Question, Answer, SpeakerSession
# Assuming your models are in the 'models.py' file in the same directory

# 1. User Admin
@admin.register(User)
class UserAdmin(ImportExportModelAdmin):
    # Display important fields in the change list view
    list_display = ('username', 'name', 'is_speaker', 'email', 'is_staff','speaker_code')
    # Allow filtering by status
    list_filter = ('is_speaker', 'is_staff', 'is_active')
    # Fields that can be searched
    search_fields = ('username', 'name', 'email')


# 2. Session Admin
@admin.register(Session)
class SessionAdmin(ImportExportModelAdmin):
    list_display = ('title', 'start_time', 'room_location', 'speaker_list')
    list_filter = ('room_location', 'start_time')
    search_fields = ('title', 'room_location')
    
    # Custom method to display speakers in the list view
    def speaker_list(self, obj):
        return ", ".join([str(s) for s in obj.speakers.all()])
    speaker_list.short_description = 'Speakers'


# 3. Question Admin
@admin.register(Question)
class QuestionAdmin(ImportExportModelAdmin):
    list_display = ('content', 'session', 'member', 'created_at', 'is_answered')
    list_filter = ('is_answered', 'session')
    search_fields = ('content', 'member__username')
    # Read-only fields if an answer is present (to prevent accidental overwrite)
    readonly_fields = ('answer_text',)
    # Fieldsets can help organize the form
    fieldsets = (
        (None, {'fields': ('session', 'member', 'content')}),
        ('Status', {'fields': ('is_answered', 'answer_text')}),
    )


# 4. Answer Admin
@admin.register(Answer)
class AnswerAdmin(ImportExportModelAdmin):
    list_display = ('question_title', 'speaker', 'answered_at')
    list_filter = ('speaker',)
    search_fields = ('content', 'speaker__username', 'question__content')
    
    # Custom method to display the question's content/title
    def question_title(self, obj):
        return obj.question.content[:50] + '...'
    question_title.short_description = 'Question'


# 5. SpeakerSession Admin (Intermediate Model)
@admin.register(SpeakerSession)
class SpeakerSessionAdmin(ImportExportModelAdmin):
    list_display = ('session', 'speaker')
    list_filter = ('session', 'speaker')