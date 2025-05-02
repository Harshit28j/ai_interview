from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
import json

from .models import InterviewSession, Question
from .serializers import (
    QuestionGenerationRequestSerializer,
    QuestionGenerationResponseSerializer,
    QuestionSerializer,
    InterviewSessionSerializer
)
from .services.gemini_question_generator import get_question_generator

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_questions(request):
    serializer = QuestionGenerationRequestSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    category = serializer.validated_data['category']
    
    # Create new interview session
    session = InterviewSession.objects.create(
        user=request.user,
        category=category
    )

    # Generate questions using Gemini
    question_generator = get_question_generator()
    questions_text = question_generator.generate_questions(category)

    # Save questions to database
    saved_questions = []
    for i, question_text in enumerate(questions_text, 1):
        question = Question.objects.create(
            session=session,
            text=question_text,
            order=i
        )
        saved_questions.append(question)

    response_data = {
        'session_id': session.id,
        'questions': saved_questions
    }
    
    response_serializer = QuestionGenerationResponseSerializer(response_data)
    return Response(response_serializer.data, status=status.HTTP_201_CREATED)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_next_question(request, session_id, current_order):
    try:
        session = InterviewSession.objects.get(id=session_id, user=request.user)
        next_question = Question.objects.filter(
            session=session,
            order__gt=current_order
        ).order_by('order').first()
        
        if not next_question:
            return Response(
                {'message': 'No more questions available'},
                status=status.HTTP_404_NOT_FOUND
            )
            
        serializer = QuestionSerializer(next_question)
        return Response(serializer.data)
        
    except InterviewSession.DoesNotExist:
        return Response(
            {'error': 'Interview session not found'},
            status=status.HTTP_404_NOT_FOUND
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_session_info(request, session_id):
    try:
        session = InterviewSession.objects.get(id=session_id, user=request.user)
        serializer = InterviewSessionSerializer(session)
        return Response(serializer.data)
        
    except InterviewSession.DoesNotExist:
        return Response(
            {'error': 'Interview session not found'},
            status=status.HTTP_404_NOT_FOUND
        )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def submit_response(request):
    session_id = request.data.get('session_id')
    question_id = request.data.get('question_id')
    response_text = request.data.get('response')

    try:
        session = InterviewSession.objects.get(id=session_id, user=request.user)
        question = Question.objects.get(id=question_id, session=session)

        # Analyze response using Gemini
        question_generator = get_question_generator()
        prompt = f"""You are an expert interview evaluator. Analyze this interview response:

        Question: {question.text}
        Response: {response_text}

        IMPORTANT EVALUATION RULES:
        1. If the response describes a real debugging scenario with:
           - Problem identification
           - Investigation steps
           - Solution implementation
           Then it is automatically a STRONG answer.

        2. If the response includes specific technical details like:
           - System components
           - Tools used
           - Actual solutions implemented
           Then it is automatically a STRONG answer.

        3. Brief but technically accurate answers showing real experience
           should be scored as good answers (low vagueness).

        Evaluate based on:
        1. Technical accuracy
        2. Real-world experience demonstrated
        3. Problem-solving approach
        4. Solution effectiveness

        Return your analysis in this exact JSON format, with no extra text or markdown:
        {{
            "vagueness_score": <0-30 for good answers with real experience, 31-60 for decent answers needing detail, 61-100 for unclear answers>,
            "feedback": "<specific, constructive feedback highlighting strengths and any areas for elaboration>",
            "cross_question": "<a follow-up question to explore the scenario further>",
            "shows_real_experience": <true/false>,
            "concepts_demonstrated": <list of technical concepts shown>
        }}

        SCORING RULES:
        - ANY answer showing real debugging/system experience MUST get a score under 30
        - Answers with specific technical details MUST get a score under 30
        - Only give high scores (>60) if the answer shows no technical understanding

        Ensure the output is valid JSON with no additional text, markdown, or comments.
        """

        try:
            analysis = question_generator.model.generate_content(prompt)
            raw_text = analysis.text
            print("Raw Gemini output:", raw_text)

            # Clean up the output if necessary
            cleaned_text = raw_text.strip()
            if cleaned_text.startswith("```json") and cleaned_text.endswith("```"):
                cleaned_text = cleaned_text[7:-3].strip()

            analysis_data = json.loads(cleaned_text)
            print("Parsed analysis:", analysis_data)
        except json.JSONDecodeError as e:
            print("JSON Decode Error:", str(e), "Raw text:", raw_text)
            analysis_data = {
                "vagueness_score": 30,
                "feedback": "Unable to parse model response. Please provide more details.",
                "cross_question": "Could you elaborate on your answer?",
                "shows_real_experience": False,
                "concepts_demonstrated": []
            }
        except Exception as e:
            print("Gemini API Error:", str(e))
            analysis_data = {
                "vagueness_score": 30,
                "feedback": "Unable to analyze response due to model error.",
                "cross_question": "Could you clarify your answer?",
                "shows_real_experience": False,
                "concepts_demonstrated": []
            }

        # Save the response
        question.response = response_text
        question.save()

        # Simplified evaluation logic
        vagueness_score = analysis_data.get('vagueness_score', 75)
        shows_real_experience = analysis_data.get('shows_real_experience', False)
        concepts = analysis_data.get('concepts_demonstrated', [])

        if shows_real_experience or len(concepts) >= 2:
            return Response({
                'feedback': analysis_data.get('feedback'),
                'cross_question': analysis_data.get('cross_question'),
                'is_learning_opportunity': False
            })

        if len(response_text.split()) < 15 and not shows_real_experience and not concepts:
            return Response({
                'feedback': "Could you provide more details about your experience with this?",
                'cross_question': "Would you like me to provide some examples?",
                'is_learning_opportunity': True
            })

        is_learning_opportunity = vagueness_score >= 60 and not shows_real_experience
        return Response({
            'feedback': analysis_data.get('feedback'),
            'cross_question': analysis_data.get('cross_question'),
            'is_learning_opportunity': is_learning_opportunity
        })

    except (InterviewSession.DoesNotExist, Question.DoesNotExist) as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': f'An error occurred: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def get_feedback_summary(request, session_id):
    try:
        session = InterviewSession.objects.get(id=session_id, user=request.user)
        questions = Question.objects.filter(session=session).order_by('order')
        
        # Generate summary using Gemini
        question_generator = get_question_generator()
        
        # Format all questions and responses
        qa_pairs = [f"Q: {q.text}\nA: {q.response if hasattr(q, 'response') else 'No response'}"
                   for q in questions]
        
        prompt = f"""Analyze this interview transcript and provide a comprehensive feedback summary:

        {'\n\n'.join(qa_pairs)}
        
        Return a JSON with:
        1. verdict (Accepted/Rejected)
        2. strengths (list of strengths)
        3. improvements (list of areas needing improvement)
        4. overall_feedback (detailed paragraph)
        """
        
        analysis = question_generator.model.generate_content(prompt)
        feedback_data = eval(analysis.text)  # Convert string to dict
        
        return Response(feedback_data)
            
    except InterviewSession.DoesNotExist:
        return Response(
            {'error': 'Session not found'},
            status=status.HTTP_404_NOT_FOUND
        ) 