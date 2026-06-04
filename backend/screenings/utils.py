import io
from email.mime.image import MIMEImage
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from screenings.qr import qr_encode

def send_ticket_email(instance, secret):
    email_user = instance.client
    data = {
        'id': instance.pk,
        'secret': secret,
    }
    qr_img = qr_encode(data)

    buffer = io.BytesIO()
    qr_img.save(buffer, format='PNG')
    buffer.seek(0)
    image_data = buffer.read()

    html_content = render_to_string(
        'ticket_mail.html', {'first_name': email_user.first_name}
    )
    text_content = strip_tags(html_content)

    msg = EmailMultiAlternatives(
        "Your Ticket", text_content, "from@example.com", [email_user.email]
    )
    msg.attach_alternative(html_content, "text/html")
    mime_image = MIMEImage(image_data)
    mime_image.add_header('Content-ID', '<ticket_qr>')
    msg.attach(mime_image)

    msg.send()
