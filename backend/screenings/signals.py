from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from .models import Purchase
from .hashing import generate_secret_salt_and_hash
from .utils import send_ticket_email

@receiver(pre_save, sender=Purchase)
def track_purchase_status_change(sender, instance, **kwargs):
    if instance.pk:
        try:
            old_instance = Purchase.objects.get(pk=instance.pk)
            instance._old_status = old_instance.status
        except Purchase.DoesNotExist:
            instance._old_status = None
    else:
        instance._old_status = None

@receiver(post_save, sender=Purchase)
def send_emails_on_paid(sender, instance, created, **kwargs):
    old_status = getattr(instance, '_old_status', None)
    
    # If the purchase just became PAID
    if instance.status == Purchase.Status.PAID and (created or old_status != Purchase.Status.PAID):
        for ticket in instance.tickets.all():
            # Generate new secret for each ticket to be safe and consistent
            secret, salt, s_hash = generate_secret_salt_and_hash()
            ticket.salt = salt
            ticket.secret_hash = s_hash
            ticket.save()
            
            send_ticket_email(ticket, secret)
