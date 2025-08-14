import os
from celery import Celery

# 'django' settings module set karein default Django app ke liye.
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "myapp.settings")

app = Celery("myapp")

# Celery config objects ko Django settings se load karein.
# Namespace='CELERY' ka matlab hai ki sabhi Celery settings keys
# 'CELERY_' prefix se shuru hongi.
app.config_from_object("django.conf:settings", namespace="CELERY")

# Installed apps mein se saare Celery tasks ko automatically load karein.
app.autodiscover_tasks()
