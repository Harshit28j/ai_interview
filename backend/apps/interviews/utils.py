from io import BytesIO
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.units import inch

def generate_interview_pdf(questions, feedback_data):
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=72, leftMargin=72, topMargin=72, bottomMargin=72)
    
    # Styles
    styles = getSampleStyleSheet()
    title_style = styles['Heading1']
    heading_style = styles['Heading2']
    normal_style = styles['Normal']
    
    # Content elements
    elements = []
    
    # Title
    elements.append(Paragraph("Interview Transcript", title_style))
    elements.append(Spacer(1, 20))
    
    # Questions and Answers
    elements.append(Paragraph("Questions and Responses", heading_style))
    elements.append(Spacer(1, 12))
    
    for qa in questions:
        # Question
        question_text = f"Q{qa['order']}: {qa['question']}"
        elements.append(Paragraph(question_text, styles['Heading3']))
        
        # Response
        response_text = f"Response: {qa['response']}"
        elements.append(Paragraph(response_text, normal_style))
        
        # Add feedback for this question if available
        if 'question_analysis' in feedback_data:
            for analysis in feedback_data['question_analysis']:
                if analysis['question_number'] == qa['order']:
                    elements.append(Paragraph(f"Quality: {analysis['response_quality']}", normal_style))
                    elements.append(Paragraph(f"Feedback: {analysis['specific_feedback']}", normal_style))
                    if analysis.get('key_concepts_missed'):
                        elements.append(Paragraph(f"Key Concepts Missed: {', '.join(analysis['key_concepts_missed'])}", normal_style))
        
        elements.append(Spacer(1, 12))
    
    # Overall Feedback
    elements.append(Spacer(1, 20))
    elements.append(Paragraph("Overall Assessment", heading_style))
    elements.append(Spacer(1, 12))
    
    # Verdict
    elements.append(Paragraph(f"Verdict: {feedback_data.get('verdict', 'N/A')}", normal_style))
    
    # Strengths
    elements.append(Spacer(1, 12))
    elements.append(Paragraph("Strengths:", styles['Heading3']))
    for strength in feedback_data.get('strengths', []):
        elements.append(Paragraph(f"• {strength}", normal_style))
    
    # Areas for Improvement
    elements.append(Spacer(1, 12))
    elements.append(Paragraph("Areas for Improvement:", styles['Heading3']))
    for improvement in feedback_data.get('improvements', []):
        elements.append(Paragraph(f"• {improvement}", normal_style))
    
    # Overall Feedback
    elements.append(Spacer(1, 12))
    elements.append(Paragraph("Detailed Feedback:", styles['Heading3']))
    elements.append(Paragraph(feedback_data.get('overall_feedback', ''), normal_style))
    
    # Build PDF
    doc.build(elements)
    buffer.seek(0)
    return buffer 