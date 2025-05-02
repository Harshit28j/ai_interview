from django.contrib import admin
from .models import InterviewSession, Question

@admin.register(InterviewSession)
class InterviewSessionAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'category', 'started_at')
    list_filter = ('category', 'started_at')
    search_fields = ('user__email', 'category')

@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ('id', 'session', 'text', 'order')
    list_filter = ('session__category',)
    search_fields = ('text', 'session__user__email')
    ordering = ('session', 'order') 