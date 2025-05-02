from django.urls import path
from . import views

app_name = 'interviews'

urlpatterns = [
    path('generate-questions/', views.generate_questions, name='generate-questions'),
    path('sessions/<int:session_id>/next-question/<int:current_order>/', views.get_next_question, name='next-question'),
    path('sessions/<int:session_id>/', views.get_session_info, name='session-info'),
    path('submit-response/<int:session_id>/<int:question_id>/', views.submit_response, name='submit-response'),
    path('sessions/<int:session_id>/feedback/', views.get_feedback_summary, name='feedback-summary'),
    path('sessions/<int:session_id>/feedback/pdf/', views.download_feedback_pdf, name='feedback-pdf'),
] 