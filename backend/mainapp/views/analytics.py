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
import openpyxl
from django.http import HttpResponse
from collections import Counter
from django.http import JsonResponse
from django.db.models import Count, F
from ..models import Case, Patent, PlaintiffDetails, DefendantDetails
from rest_framework.decorators import api_view

class CaseStatisticsView(APIView):
    def get(self, request):  # This method will handle GET requests
        try:
            # Use Django ORM aggregation to get case status counts efficiently
            case_status_counts = (
                Case.objects.values("case_status")
                .annotate(count=Count("case_status"))
            )

            # Normalize case statuses
            status_counts = {
                (item["case_status"].lower().strip() if item["case_status"] else "unknown"): item["count"]
                for item in case_status_counts
            }
            tech_areas = Patent.objects.values('tech_category').annotate(case_count=Count('cases')).order_by('-case_count')[:10]
            
            plaintiffs = PlaintiffDetails.objects.values('plaintiff').annotate(case_count=Count('case')).order_by('-case_count')[:25]
            plaw_firms = PlaintiffDetails.objects.values('plaintiff_law_firm').annotate(case_count=Count('case')).order_by('-case_count')[:25]
            
            defendants = DefendantDetails.objects.values('defendant').annotate(case_count=Count('case')).order_by('-case_count')[:25]
            dlaw_firms = DefendantDetails.objects.values('defendant_law_firm').annotate(case_count=Count('case')).order_by('-case_count')[:25]
    
            
            response_data = {
                "total_cases": Case.objects.count(),
                "case_status_counts": status_counts,
                "top_defendants": defendants,
                "top_defendant_law_firms": dlaw_firms,
                "top_plaintiffs": plaintiffs,
                "top_plaintiff_law_firms": plaw_firms,
                "tech_area":tech_areas
                
            }

            return Response({"data": response_data}, status=status.HTTP_200_OK)
        
        except Exception as e:
            return Response(
                {"error": f"Error processing request: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class PlaintiffTypeCountView(APIView):
    def get(self, request):
        try:
            # Aggregate count of unique plaintiff_type_and_size values from CaseDetails
            plaintiff_counts = (
                CaseDetails.objects.values("plaintiff_type_and_size")
                .annotate(count=Count("plaintiff_type_and_size"))
            )

            # Normalize plaintiff types
            plaintiff_type_counts = {
                (item["plaintiff_type_and_size"].strip().lower() if item["plaintiff_type_and_size"] else "unknown"): item["count"]
                for item in plaintiff_counts
            }

            response_data = {
                "plaintiff_type_counts": plaintiff_type_counts
            }

            return Response({"data": response_data}, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {"error": f"Error processing request: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class IndustryStats(APIView):
    def get(self,request):
        try:
        # Fetch unique cases per industry
            industry_case_count = (
                Patent.objects
                .values('industry')  # Get industry field
                .annotate(unique_case_count=Count('cases', distinct=True))  # Count unique cases
                .order_by('-unique_case_count')
            )
            
            # Convert query result to a dictionary
            result = {entry['industry']: entry['unique_case_count'] for entry in industry_case_count if entry['industry']}
            
            return Response({"data":result}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {"error": f"Error processing request: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class CaseEntityListing(APIView):
    
    def get(self,request):
    # Create an Excel workbook
        try:
            wb = openpyxl.Workbook()

            # Sheet 1: Cases (Case Numbers)
            ws_cases = wb.active
            ws_cases.title = "Cases"
            ws_cases.append(["Case Number"])
            for case_no in Case.objects.values_list('case_no', flat=True):
                ws_cases.append([case_no])

            # Sheet 2: Patents (Patent No, Title, Case Count)
            ws_patents = wb.create_sheet(title="Patents")
            ws_patents.append(["Patent Number", "Patent Title", "Case Count"])
            patents = Patent.objects.all()
            for patent in patents:
                case_count = patent.cases.count()
                ws_patents.append([patent.patent_no, patent.patent_title, case_count])

            # Sheet 3: Plaintiffs (Plaintiff Name, Case Count)
            ws_plaintiffs = wb.create_sheet(title="Plaintiffs")
            ws_plaintiffs.append(["Plaintiff Name", "Case Count"])
            plaintiff_counts = Counter(PlaintiffDetails.objects.values_list('plaintiff', flat=True))
            for plaintiff, count in plaintiff_counts.items():
                ws_plaintiffs.append([plaintiff, count])

            # Sheet 4: Defendants (Defendant Name, Case Count)
            ws_defendants = wb.create_sheet(title="Defendants")
            ws_defendants.append(["Defendant Name", "Case Count"])
            defendant_counts = Counter(DefendantDetails.objects.values_list('defendant', flat=True))
            for defendant, count in defendant_counts.items():
                ws_defendants.append([defendant, count])

            # Sheet 5: Defendant Law Firms (Law Firm, Case Count)
            ws_def_law_firms = wb.create_sheet(title="Defendant Law Firms")
            ws_def_law_firms.append(["Defendant Law Firm", "Case Count"])
            def_law_firm_counts = Counter(DefendantDetails.objects.values_list('defendant_law_firm', flat=True))
            for law_firm, count in def_law_firm_counts.items():
                ws_def_law_firms.append([law_firm, count])

            # Sheet 6: Plaintiff Law Firms (Law Firm, Case Count)
            ws_plaintiff_law_firms = wb.create_sheet(title="Plaintiff Law Firms")
            ws_plaintiff_law_firms.append(["Plaintiff Law Firm", "Case Count"])
            plaintiff_law_firm_counts = Counter(PlaintiffDetails.objects.values_list('plaintiff_law_firm', flat=True))
            for law_firm, count in plaintiff_law_firm_counts.items():
                ws_plaintiff_law_firms.append([law_firm, count])

            # Create response
            response = HttpResponse(content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
            response['Content-Disposition'] = 'attachment; filename="cases_report.xlsx"'

            # Save workbook to response
            wb.save(response)

            return response

        except Exception as e:
            return Response(
                {"error": f"Error processing request: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
            

@api_view(['GET'])
def most_sued_tech_areas(request):
    """Returns the top 10 most sued tech categories based on case count."""
    tech_areas = Patent.objects.values('tech_category').annotate(case_count=Count('cases')).order_by('-case_count')[:10]
    return Response(tech_areas)

@api_view(['GET'])
def top_defendants(request):
    """Returns the top 25 defendants and their law firms based on case count."""
    defendants = DefendantDetails.objects.values('defendant').annotate(case_count=Count('case')).order_by('-case_count')[:25]
    law_firms = DefendantDetails.objects.values('defendant_law_firm').annotate(case_count=Count('case')).order_by('-case_count')[:25]
    
    return Response({
        "top_defendants": defendants,
        "top_defendant_law_firms": law_firms
    })

@api_view(['GET'])
def top_plaintiffs(request):
    """Returns the top 25 plaintiffs and their law firms based on case count."""
    plaintiffs = PlaintiffDetails.objects.values('plaintiff').annotate(case_count=Count('case')).order_by('-case_count')[:25]
    law_firms = PlaintiffDetails.objects.values('plaintiff_law_firm').annotate(case_count=Count('case')).order_by('-case_count')[:25]
    
    return Response({
        "top_plaintiffs": plaintiffs,
        "top_plaintiff_law_firms": law_firms
    })
