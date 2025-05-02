from rest_framework import serializers
from .models import InterviewSession, Question

class QuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Question
        fields = ['id', 'text', 'order']

class InterviewSessionSerializer(serializers.ModelSerializer):
    questions = QuestionSerializer(many=True, read_only=True)
    
    class Meta:
        model = InterviewSession
        fields = ['id', 'category', 'started_at', 'questions']
        read_only_fields = ['started_at']

class QuestionGenerationRequestSerializer(serializers.Serializer):
    category = serializers.CharField()

class QuestionGenerationResponseSerializer(serializers.Serializer):
    session_id = serializers.IntegerField()
    questions = QuestionSerializer(many=True) 