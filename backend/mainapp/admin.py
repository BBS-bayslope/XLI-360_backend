from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.translation import gettext_lazy as _
from .models import (
    RawData, Case, CaseDetails, Patent, CasePatent, Report,
    CustomUser
)

class CustomUserAdmin(BaseUserAdmin):
    model = CustomUser
    ordering = ('email',)
    list_display = ('email', 'is_staff', 'is_superuser')
    list_filter = ('is_staff', 'is_superuser', 'is_active')

    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        (_('Permissions'), {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions'),
        }),
        (_('Important dates'), {'fields': ('last_login',)}),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'password1', 'password2', 'is_staff', 'is_superuser', 'is_active'),
        }),
    )

    search_fields = ('email',)

admin.site.register(CustomUser, CustomUserAdmin)

# Registering other models
admin.site.register(RawData)
admin.site.register(Case)
admin.site.register(CaseDetails)
admin.site.register(Patent)
admin.site.register(CasePatent)
admin.site.register(Report)
