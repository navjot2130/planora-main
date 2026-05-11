# Email reminders

Planora sends email reminders for both scheduled tasks and manual reminders.

Emails are sent to the Firebase Auth email for the item owner. Each item can send:
- a lead-time email, based on `profile.preferences.reminderLeadMinutes`
- an exact-time email, at the task `dueDate` or reminder `remindAt`

Required backend environment variables:

```env
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-smtp-user
SMTP_PASS=your-smtp-password-or-app-password
SMTP_FROM=Planora <your-smtp-user@example.com>
```

Optional:

```env
EMAIL_REMINDERS_ENABLED=true
EMAIL_REMINDER_INTERVAL_MS=60000
EMAIL_REMINDER_WINDOW_MS=90000
```

For Gmail, use an app password and set:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
```
