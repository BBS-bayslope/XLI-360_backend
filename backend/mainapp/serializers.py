from rest_framework import serializers
from .models import Case, Patent, CasePatent, CustomUser

from .models import Report

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = CustomUser
        fields = ['email', 'password']

    def create(self, validated_data):
        user = CustomUser.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
        )
        return user

class CaseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Case
        fields = '__all__'

class PatentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Patent
        fields = '__all__'

class CasePatentSerializer(serializers.ModelSerializer):
    class Meta:
        model = CasePatent
        fields = '__all__'



class ReportSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = Report
        fields = ['id', 'file_url', 'year']

    def get_file_url(self, obj):
        return obj.file.url