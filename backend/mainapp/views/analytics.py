from django.shortcuts import render

# Create your views here.
import pandas as pd
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework import status
from ..models import RawData, Case, Patent, CasePatent, CaseDetails
from django.core.exceptions import ValidationError
from django.utils.dateparse import parse_date
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor, as_completed
from django.db import transaction
from django.db.models import Q
from ..serializers import CaseSerializer

