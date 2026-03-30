from django.contrib import admin
from import_export.admin import ImportExportModelAdmin
from .models import (
    User, Event, EventRegistration, Session, SpeakerSession,
    Question, Answer, Submission, JudgingCriteria, JudgeAssignment, Score,
    Team, TeamMember,
)


# ─── User ───────────────────────────────────────────────────────

@admin.register(User)
class UserAdmin(ImportExportModelAdmin):
    list_display = ('username', 'display_name', 'role', 'email', 'phone', 'is_deleted', 'is_staff')
    list_filter = ('role', 'is_deleted', 'is_staff', 'is_active', 'must_reset_password')
    search_fields = ('username', 'display_name', 'name', 'email', 'phone')
    list_editable = ('role', 'is_deleted')

    def get_queryset(self, request):
        return User.all_objects.all()


# ─── Events ─────────────────────────────────────────────────────

class JudgingCriteriaInline(admin.TabularInline):
    model = JudgingCriteria
    extra = 1


class JudgeAssignmentInline(admin.TabularInline):
    model = JudgeAssignment
    extra = 1


@admin.register(Event)
class EventAdmin(ImportExportModelAdmin):
    list_display = ('title', 'event_type', 'start_date', 'end_date', 'is_active', 'attendee_count_display')
    list_filter = ('event_type', 'is_active', 'start_date')
    search_fields = ('title', 'description')
    inlines = [JudgingCriteriaInline, JudgeAssignmentInline]

    def attendee_count_display(self, obj):
        return obj.attendee_count
    attendee_count_display.short_description = 'Attendees'


@admin.register(EventRegistration)
class EventRegistrationAdmin(ImportExportModelAdmin):
    list_display = ('user', 'event', 'status', 'registered_at')
    list_filter = ('status', 'event')
    search_fields = ('user__username', 'event__title')


# ─── Q&A ────────────────────────────────────────────────────────

@admin.register(Session)
class SessionAdmin(ImportExportModelAdmin):
    list_display = ('title', 'event', 'start_time', 'room_location', 'speaker_list')
    list_filter = ('event', 'start_time')
    search_fields = ('title', 'room_location')

    def speaker_list(self, obj):
        return ", ".join([str(s) for s in obj.speakers.all()])
    speaker_list.short_description = 'Speakers'


@admin.register(SpeakerSession)
class SpeakerSessionAdmin(ImportExportModelAdmin):
    list_display = ('session', 'speaker')
    list_filter = ('session', 'speaker')


@admin.register(Question)
class QuestionAdmin(ImportExportModelAdmin):
    list_display = ('content_short', 'session', 'member', 'created_at', 'is_answered')
    list_filter = ('is_answered', 'session')
    search_fields = ('content', 'member__username')

    def content_short(self, obj):
        return obj.content[:60]
    content_short.short_description = 'Question'


@admin.register(Answer)
class AnswerAdmin(ImportExportModelAdmin):
    list_display = ('question_title', 'speaker', 'answered_at')
    list_filter = ('speaker',)
    search_fields = ('content', 'speaker__username')

    def question_title(self, obj):
        return obj.question.content[:50] + '...'
    question_title.short_description = 'Question'


# ─── Competition / Judging ──────────────────────────────────────

class ScoreInline(admin.TabularInline):
    model = Score
    extra = 0
    readonly_fields = ('judge', 'criteria', 'score', 'scored_at')


@admin.register(Submission)
class SubmissionAdmin(ImportExportModelAdmin):
    list_display = ('title', 'event', 'submitted_by', 'submitted_at')
    list_filter = ('event',)
    search_fields = ('title', 'submitted_by__username')
    inlines = [ScoreInline]

# Customize Admin Site Headers
admin.site.site_header = "Blue Ox Events Admin"
admin.site.site_title = "Blue Ox Events Admin Portal"
admin.site.index_title = "Welcome to the Blue Ox Events Portal"


@admin.register(JudgingCriteria)
class JudgingCriteriaAdmin(ImportExportModelAdmin):
    list_display = ('name', 'event', 'max_score', 'weight')
    list_filter = ('event',)


@admin.register(JudgeAssignment)
class JudgeAssignmentAdmin(ImportExportModelAdmin):
    list_display = ('judge', 'event')
    list_filter = ('event',)


@admin.register(Score)
class ScoreAdmin(ImportExportModelAdmin):
    list_display = ('submission', 'criteria', 'judge', 'score', 'scored_at')
    list_filter = ('submission__event', 'judge', 'criteria')
    search_fields = ('submission__title', 'judge__username')


# ─── Teams ──────────────────────────────────────────────────────

class TeamMemberInline(admin.TabularInline):
    model = TeamMember
    extra = 1


@admin.register(Team)
class TeamAdmin(ImportExportModelAdmin):
    list_display = ('name', 'event', 'created_by', 'member_count_display', 'created_at')
    list_filter = ('event',)
    search_fields = ('name',)
    inlines = [TeamMemberInline]

    def member_count_display(self, obj):
        return obj.member_count
    member_count_display.short_description = 'Members'


@admin.register(TeamMember)
class TeamMemberAdmin(ImportExportModelAdmin):
    list_display = ('user', 'team', 'role', 'joined_at')
    list_filter = ('role', 'team__event')