from rest_framework import serializers
from .models import Case, Patent, CasePatent

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
