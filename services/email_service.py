from email.message import EmailMessage
import smtplib

from core.config import settings


class EmailDeliveryError(Exception):
    pass


def send_email(to_email: str, subject: str, body: str) -> None:
    missing_settings = [
        name
        for name, value in {
            "SMTP_HOST": settings.SMTP_HOST,
            "SMTP_USERNAME": settings.SMTP_USERNAME,
            "SMTP_PASSWORD": settings.SMTP_PASSWORD,
            "EMAIL_FROM": settings.EMAIL_FROM,
        }.items()
        if not value
    ]
    if missing_settings:
        raise EmailDeliveryError(
            f"Missing email configuration: {', '.join(missing_settings)}"
        )

    message = EmailMessage()
    message["From"] = settings.EMAIL_FROM
    message["To"] = to_email
    message["Subject"] = subject
    message.set_content(body)

    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as smtp:
            if settings.SMTP_USE_TLS:
                smtp.starttls()
            smtp.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
            smtp.send_message(message)
    except smtplib.SMTPException as exc:
        raise EmailDeliveryError("Email provider rejected the message") from exc
    except OSError as exc:
        raise EmailDeliveryError("Could not connect to email provider") from exc
