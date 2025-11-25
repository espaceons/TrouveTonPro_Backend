# workers_api/admin.py
from django.contrib import admin
from .models import Worker

admin.site.register(Worker)