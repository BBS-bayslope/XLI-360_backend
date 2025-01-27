from django.contrib import admin
from .models import RawData, Case, CaseDetails, Patent, CasePatent
# Register your models here.

admin.site.register(RawData)
admin.site.register(Case)
admin.site.register(Patent)
admin.site.register(CaseDetails)
admin.site.register(CasePatent)