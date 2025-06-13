from django.shortcuts import render
# Create your views here.

from django.views.decorators.clickjacking import xframe_options_exempt
from django.utils.decorators import method_decorator
import pandas as pd
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework import status
# from datetime import datetime
from ..models import RawData, Case, Patent, CasePatent, CaseDetails, PlaintiffDetails, DefendantDetails
from django.core.exceptions import ValidationError
from django.utils.dateparse import parse_date
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor, as_completed
from django.db import transaction
from django.db.models import Q
from ..serializers import CaseSerializer
from django.db.models.functions import Upper, Lower
from rest_framework.permissions import AllowAny, IsAuthenticated
import json

from mainapp.models import Report
from mainapp.serializers import ReportSerializer
from django.http import FileResponse

def MainPage(request):
    return render(request,'index.html') 

class FileUploadView(APIView):
    parser_classes = (MultiPartParser, FormParser)

    def process_chunk(self, rows):
        records = []
        required_columns = [
            'Case Number', 'Case Name', 'Case Status', 'Court Names',
            'Litigation Venues & Judicial Authorities', 'Related/Originating Cases',
            'Cause of Action', 'Accused Product', 'Judge', 'Number of Infringed Claims',
            '3rd Party Funding Involved', 'Case Strength Level', 'Recent Action',
            'Winning Amount', 'Winning Party', 'Other Possible Infringer', 'List of Prior Art',
            'Patent No', 'Type of Patent', 'Title', 'Original Assignee',
            'Current Assignee', 'Single Patent or Family Involved?',
            'Standard Essential Patent', 'Semiconductor Patent', 'Tech Centre',
            'Art Unit', 'Acquired Patent or Organic patent?', 'Assignee Timeline',
            'Industry', 'Technology Keywords', 'Tech Category', 'Reason of Allowance',
            'Plaintiff/Petitioner', 'Plaintiff Type & Size', 'Defendant',
            'Defendant Type & Size', 'Stage'
        ]

        for row in rows:
            try:
                missing_columns = [col for col in required_columns if col not in row]
                if missing_columns:
                    raise KeyError(f"Missing columns: {', '.join(missing_columns)}")

                complaint_date = pd.to_datetime(row.get('Case Complaint Date'), errors='coerce')
                case_closed_date = pd.to_datetime(row.get('Case Closed Date'), errors='coerce')
                issue_date = pd.to_datetime(row.get('Patent Issued Date'), errors='coerce')
                expiry_date = pd.to_datetime(row.get('Patent Expiry Date'), errors='coerce')

                complaint_date = complaint_date.strftime('%Y-%m-%d') if pd.notnull(complaint_date) else None
                case_closed_date = case_closed_date.strftime('%Y-%m-%d') if pd.notnull(case_closed_date) else None
                issue_date = issue_date.strftime('%Y-%m-%d') if pd.notnull(issue_date) else None
                expiry_date = expiry_date.strftime('%Y-%m-%d') if pd.notnull(expiry_date) else None

                raw_data_instance = RawData(
                    case_no=row.get('Case Number'),
                    complaint_date=complaint_date,
                    case_name=row['Case Name'],
                    case_status=row['Case Status'],
                    court_name=row['Court Names'],
                    litigation_venues=row['Litigation Venues & Judicial Authorities'],
                    related_cases=row.get('Related/Originating Cases', ''),
                    case_closed_date=case_closed_date,
                    cause_of_action=row['Cause of Action'],
                    accused_product=row['Accused Product'],
                    assigned_judge=row.get('Judge', None),
                    number_of_infringed_claims=row.get('Number of Infringed Claims', 0) or 0,
                    third_party_funding_involved=row['3rd Party Funding Involved'],
                    # type_of_infringement=row['Type of Infringement'],
                    case_strength_level=row['Case Strength Level'],
                    recent_action=row.get('Recent Action', None),
                    winning_amount=row.get('Winning Amount', None),
                    winning_party=row.get('Winning Party', None),
                    other_possible_infringer=row.get('Other Possible Infringer', None),
                    list_of_prior_art=row.get('List of Prior Art', None),
                    patent_no=row.get('Patent No', None),
                    patent_type=row.get('Type of Patent', None),
                    patent_title=row.get('Title', None),
                    original_assignee=row['Original Assignee'],
                    current_assignee=row.get('Current Assignee', None),
                    issue_date=issue_date,
                    expiry_date=expiry_date,
                    single_or_multiple=row['Single Patent or Family Involved?'],
                    standard_patent=row['Standard Essential Patent'],
                    semiconductor_patent=row['Semiconductor Patent'],
                    tech_center=row['Tech Centre'],
                    art_unit=row['Art Unit'],
                    acquisition_type=row['Acquired Patent or Organic patent?'],
                    assignee_timeline=row.get('Assignee Timeline', None),
                    industry=row['Industry'],
                    technology_keywords=row['Technology Keywords'],
                    tech_category=row['Tech Category'],
                    reason_of_allowance=row['Reason of Allowance'],
                    plaintiff=row.get('Plaintiff/Petitioner', None),
                    plaintiff_type_and_size=row['Plaintiff Type & Size'],
                    # plaintiff_law_firm=row.get('Plaintiff Law Firm Name', None),
                    # plaintiff_attorney_name=row.get('PA Name 1', None),
                    # plaintiff_contact=row.get('PA Phone 1', None),
                    # plaintiff_email=row.get('PA Email 1', None),
                    defendant=row.get('Defendant', None),
                    defendent_type_and_size=row['Defendant Type & Size'],
                    # defendant_law_firm=row.get('Defendant Law Firm Name', None),
                    # defendant_attorney_name=row.get('DA Name 1', None),
                    # defendant_phone=row.get('DA Phone 1', None),
                    # defendant_email=row.get('DA Email 1', None),
                    stage=row['Stage']
                )
                records.append(raw_data_instance)
            except KeyError as e:
                print(f"KeyError: {str(e)}")  # Log missing columns
                return e  # Returning KeyError causes an issue in the `post` method
            except Exception as e:
                print(f"Unexpected Error: {str(e)}")
                return e
        return records

    def post(self, request):
        file = request.FILES.get('file')
        if file:
            try:
                df = pd.read_excel(file, dtype=str)  # Read all as strings for easier handling
                rows = df.to_dict('records')
                chunk_size = 180
                chunks = [rows[i:i + chunk_size] for i in range(0, len(rows), chunk_size)]
                print("chunks created")
                records_to_create = []
                cnt=0
                with ThreadPoolExecutor(max_workers=4) as executor:
                    futures = [executor.submit(self.process_chunk, chunk) for chunk in chunks]
                    for future in as_completed(futures):
                        cnt=cnt+1
                        records_to_create.extend(future.result())
                        # print("see ",cnt)

                with transaction.atomic():
                    RawData.objects.bulk_create(records_to_create, batch_size=500)

                return Response({'message': 'File processed and data inserted successfully!'}, status=status.HTTP_200_OK)
            except Exception as e:
                return Response({'error': f'Error processing file: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({'error': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)

class ValidateRawDataAPIView(APIView):
    def get(self, request):
        try:
            # invalid_rows = RawData.objects.filter(
            #     Q(case_no__isnull=True) | Q(case_no='') |  Q(case_no='nan') |
            #     Q(case_name__isnull=True) | Q(case_name='') | Q(case_name='nan') |
            #     Q(complaint_date__isnull=True) |
            #     Q(plaintiff__isnull=True) | Q(plaintiff='') | Q(plaintiff='nan') |
            #     Q(defendant__isnull=True) | Q(defendant='') | Q(defendant='nan') |
            #     Q(patent_no__isnull=True) | Q(patent_no='') | Q(patent_no='nan')
            # )

            # invalid_rows.update(is_valid=False)

            # Mark the rest as valid
            # RawData.objects.exclude(id__in=invalid_rows.values_list('id', flat=True)).update(is_valid=True)
            split_and_process_bulk_with_threads()
            return Response(
                {'message': 'Data validation completed successfully!'},
                status=status.HTTP_200_OK
            )
        except Exception as e:
            return Response(
                {'error': f'Error during validation: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

from concurrent.futures import ThreadPoolExecutor
from django.db import connection

def prepare_case_objects(raw_data_batch):
    case_objects = []
    for raw_data in raw_data_batch:
        case_objects.append(
            Case(
                case_no=raw_data.case_no,
                complaint_date=raw_data.complaint_date,
                case_name=raw_data.case_name,
                court_name=raw_data.court_name,
                case_status=raw_data.case_status,
                litigation_venues=raw_data.litigation_venues
            )
        )
    return case_objects
def prepare_caseDetails_objects(raw_data_batch):
    case_objects = []
    for raw_data in raw_data_batch:
        try:
            case_instance = Case.objects.get(case_no=raw_data.case_no)

            # Handle multiple patent numbers (comma-separated)

            
            # Check if CasePatent entry already exists
            if not CaseDetails.objects.filter(case=case_instance).exists():
                # Create CasePatent object
                case_objects.append(
                    CaseDetails(
                        case=case_instance,
                        related_cases=raw_data.related_cases,
                        case_closed_date=raw_data.case_closed_date,
                        cause_of_action=raw_data.cause_of_action,
                        accused_product=raw_data.accused_product,
                        judge=raw_data.assigned_judge,
                        number_of_infringed_claims=raw_data.number_of_infringed_claims,
                        third_party_funding_involved=raw_data.third_party_funding_involved,
                        type_of_infringement=raw_data.type_of_infringement,
                        case_strength_level=raw_data.case_strength_level,
                        recent_action=raw_data.recent_action,
                        winning_amount=raw_data.winning_amount,
                        winning_party=raw_data.winning_party,
                        other_possible_infringer=raw_data.other_possible_infringer,
                        list_of_prior_art=raw_data.list_of_prior_art,
                        plaintiff = raw_data.plaintiff,
                        defendant = raw_data.defendant,
                        plaintiff_type_and_size = raw_data.plaintiff_type_and_size,
                        defendent_type_and_size = raw_data.defendent_type_and_size
                    )
                )
                
        except Case.DoesNotExist:
            print(f"Case with case_no {raw_data.case_no} does not exist. Skipping.")
    return case_objects

def prepare_patent_objects(raw_data_batch):
    try:
        
        patent_objects = []
        unique_patent_nos = set()  # To ensure unique patent numbers across the batch
        # print("its here")
        for raw_data in raw_data_batch:
            # Split the patent_no field by comma and strip whitespace from each entry
            # print("its herrrr")
            if raw_data.patent_no:
                patent_no=raw_data.patent_no
                # print(" look here too")
                if(patent_no=='0' or patent_no=='00:00:00' or patent_no=='REDACTED'):
                    continue
                # if Patent.objects.filter(patent_no=patent_no).exists():
                #     continue
                # Check if this patent_no is already processed
                # print("yha aagya")
                
                patent_objects.append(
                    Patent(
                        patent_no=patent_no,
                        patent_type=raw_data.patent_type,
                        patent_title=raw_data.patent_title,
                        original_assignee=raw_data.original_assignee,
                        current_assignee=raw_data.current_assignee,
                        issue_date = raw_data.issue_date,
                        expiry_date = raw_data.expiry_date,
                        single_or_multiple = raw_data.single_or_multiple,
                        standard_patent = raw_data.standard_patent,
                        semiconductor_patent = raw_data.semiconductor_patent,
                        tech_center = raw_data.tech_center,
                        art_unit = raw_data.art_unit,
                        acquisition_type = raw_data.acquisition_type,
                        assignee_timeline = raw_data.assignee_timeline,
                        industry = raw_data.industry,
                        technology_keywords = raw_data.technology_keywords,
                        tech_category = raw_data.tech_category,
                        reason_of_allowance = raw_data.reason_of_allowance
                    )
                )

        return patent_objects
    except Exception as e:
        return Response({'error': f'Error processing file: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


def prepare_case_patent_objects(raw_data_batch):
    try:
        # Get the case instance
        case_patent_objects = []
        # print("its here")
        for raw_data in raw_data_batch:
            try:
                case_instance = Case.objects.get(case_no=raw_data.case_no)

                # Handle multiple patent numbers (comma-separated)
                try:
                    patent_no=raw_data.patent_no.upper()
                    #validation check 
                    if(patent_no=='0' or patent_no=='00:00:00' or patent_no=='REDACTED'):
                        continue
                    # Get the patent instance
                    patent_instance = Patent.objects.get(patent_no=patent_no)

                    # Check if CasePatent entry already exists
                    if not CasePatent.objects.filter(case=case_instance, patent=patent_instance).exists():
                        # Create CasePatent object
                        case_patent_objects.append(
                            CasePatent(
                                case=case_instance,
                                patent=patent_instance
                            )
                        )
                except Patent.DoesNotExist:
                    print(f"Patent with patent_no {patent_no} does not exist. Skipping.")
            except Case.DoesNotExist:
                print(f"Case with case_no {raw_data.case_no} does not exist. Skipping.")
        return case_patent_objects
    except Exception as e:
        return Response({'error': f'Error processing file: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    # case_patent_objects = []
    # for raw_data in raw_data_batch:
    #     if raw_data.case_no in case_mapping and raw_data.patent_no in patent_mapping:
    #         case_patent_objects.append(
    #             CasePatent(
    #                 case=case_mapping[raw_data.case_no],
    #                 patent=patent_mapping[raw_data.patent_no]
    #             )
    #         )
    # return case_patent_objects

def process_batch_bulk(raw_data_batch):
    try:
    # Step 1: Prepare and bulk create `Case` objects
        # case_objects = prepare_case_objects(raw_data_batch)
        # Case.objects.bulk_create(case_objects, ignore_conflicts=True)
        
        case_objects = prepare_caseDetails_objects(raw_data_batch)
        CaseDetails.objects.bulk_create(case_objects, ignore_conflicts=True)
    
        # update_case_details(raw_data_batch)
    
        # Fetch the created cases for mapping
        # case_mapping = {case.case_no: case for case in Case.objects.filter(case_no__in=[raw.case_no for raw in raw_data_batch])}
        
        # Step 2: Prepare and bulk create `Patent` objects
        # patent_objects = prepare_patent_objects(raw_data_batch)
        # Patent.objects.bulk_create(patent_objects, ignore_conflicts=True)
        
        # Fetch the created patents for mapping
        # patent_mapping = {patent.patent_no: patent for patent in Patent.objects.filter(patent_no__in=[raw.patent_no for raw in raw_data_batch])}
        
        # Step 3: Prepare and bulk create `CasePatent` objects
        # case_patent_objects = prepare_case_patent_objects(raw_data_batch)
        # CasePatent.objects.bulk_create(case_patent_objects, ignore_conflicts=True)
    except Exception as e:
        return Response({'error': f'Error processing file: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

def update_case_details(data_chunk):
    """
    Function to process and update a chunk of data.
    """
    updates = []
    for raw_data in data_chunk:
        # Fetch or create the CaseDetails object
        try:
            case_detail = CaseDetails.objects.get(case__case_no=raw_data.case_no)

            # Update attributes from RawData
            case_detail.plaintiff = raw_data.plaintiff
            case_detail.defendant = raw_data.defendant
            case_detail.plaintiff_type_and_size = raw_data.plaintiff_type_and_size
            case_detail.defendent_type_and_size = raw_data.defendent_type_and_size

            # Append the updated object for bulk_update
            updates.append(case_detail)
        except CaseDetails.DoesNotExist:
            continue

    # Perform bulk update
    if updates:
        CaseDetails.objects.bulk_update(
            updates, 
            ["plaintiff", "defendant", "plaintiff_type_and_size", "defendent_type_and_size"]
        )


def split_and_process_bulk_with_threads():
    # Fetch all RawData entries
    try:
        # RawData.objects.all().update(patent_no=Upper('patent_no'))
        raw_data_entries = RawData.objects.filter(is_valid=True)
        distinct_entries=raw_data_entries.distinct('case_no')
        # distinct_entries= raw_data_entries.distinct('patent_no')
        # distinct_entries = raw_data_entries.annotate(upper_patent_no=Upper('patent_no')).distinct('upper_patent_no')
        # Define batch size

        # change this 1000->100
        batch_size = 100  # Larger batch size for bulk_create
        raw_data_batches = [distinct_entries[i:i + batch_size] for i in range(0, len(distinct_entries), batch_size)]
        
        # Use ThreadPoolExecutor for multithreading
        with ThreadPoolExecutor(max_workers=4) as executor:  
            executor.map(process_batch_bulk, raw_data_batches)
        
        # Close database connection for each thread
        connection.close()
    
    except Exception as e:
        return Response({'error': f'Error processing file: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class CaseDetailsView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            # Retrieve case number from the payload
            case_no = request.data.get("case_no")
            if not case_no:
                return Response({"error": "Case number is required"}, status=status.HTTP_400_BAD_REQUEST)

            # Fetch the case object
            case = Case.objects.get(case_no=case_no)
            if case is None:
                return Response({"error": "No data related to this case no"}, status=status.HTTP_400_BAD_REQUEST)

            # Serialize the case data
            case_data = {
                "case_no": case.case_no,
                "case_name": case.case_name,
                "complaint_date": case.complaint_date,
                "case_status": case.case_status,
                "court_name": case.court_name,
                "litigation_venues": case.litigation_venues,
            }
            # Fetch related case details
            case_details = CaseDetails.objects.filter(case=case).first()
            if case_details:
                case_details_data = {
                    "related_cases": case_details.related_cases,
                    "case_closed_date": case_details.case_closed_date,
                    "cause_of_action": case_details.cause_of_action,
                    "accused_product": case_details.accused_product,
                    "judge": case_details.judge,
                    "number_of_infringed_claims": case_details.number_of_infringed_claims,
                    "third_party_funding_involved": case_details.third_party_funding_involved,
                    "type_of_infringement": case_details.type_of_infringement,
                    "case_strength_level": case_details.case_strength_level,
                    "recent_action": case_details.recent_action,
                    "winning_amount": case_details.winning_amount,
                    "winning_party": case_details.winning_party,
                    "other_possible_infringer": case_details.other_possible_infringer,
                    "list_of_prior_art": case_details.list_of_prior_art,
                    "plaintiff": case_details.plaintiff,
                    "plaintiff_type": case_details.plaintiff_type,
                    "plaintiff_size": case_details.plaintiff_size,
                    "plaintiff_count": case_details.plaintiff_count,
                    "defendant": case_details.plaintiff,
                    "defendant_type": case_details.defendent_type,
                    "defendant_size": case_details.defendent_size,
                    "defendant_count": case_details.defendent_count,
                }
            else:
                case_details_data = {}

            # Fetch related patents
            patents = case.patents.all()
            patents_data = [
                {
                    "patent_no": patent.patent_no,
                    "patent_type": patent.patent_type,
                    "patent_title": patent.patent_title,
                    "original_assignee": patent.original_assignee,
                    "current_assignee": patent.current_assignee,
                    "issue_date": patent.issue_date,
                    "expiry_date": patent.expiry_date,
                    "single_or_multiple": patent.single_or_multiple,
                    "standard_patent": patent.standard_patent,
                    "semiconductor_patent": patent.semiconductor_patent,
                    "tech_center": patent.tech_center,
                    "art_unit": patent.art_unit,
                    "acquisition_type": patent.acquisition_type,
                    "assignee_timeline": json.loads(patent.assignee_timeline) if patent.assignee_timeline else {},
                    "industry": patent.industry,
                    "technology_keywords": patent.technology_keywords,
                    "tech_category": patent.tech_category,
                    "reason_of_allowance": patent.reason_of_allowance,
                }
                for patent in patents
            ]

            # Fetch plaintiff details (multiple entries possible)
            plaintiffs = PlaintiffDetails.objects.filter(case=case)
            plaintiffs_data = [
                {
                    "plaintiff": plaintiff.plaintiff,
                    "plaintiff_law_firm": plaintiff.plaintiff_law_firm,
                    "plaintiff_attorney_name": plaintiff.plaintiff_attorney_name,
                    "plaintiff_contact": plaintiff.plaintiff_contact,
                    "plaintiff_email": plaintiff.plaintiff_email,
                }
                for plaintiff in plaintiffs
            ]

            # Fetch defendant details (multiple entries possible)
            defendants = DefendantDetails.objects.filter(case=case)
            defendants_data = [
                {
                    "defendant": defendant.defendant,
                    "defendant_law_firm": defendant.defendant_law_firm,
                    "defendant_attorney_name": defendant.defendant_attorney_name,
                    "defendant_phone": defendant.defendant_phone,
                    "defendant_email": defendant.defendant_email,
                }
                for defendant in defendants
            ]

            # Construct the response
            response_data = {
                "case": case_data,
                "case_details": case_details_data,
                "patents": patents_data,
                "plaintiffs": plaintiffs_data,
                "defendants": defendants_data,
            }

            return Response(response_data, status=status.HTTP_200_OK)

        except Case.DoesNotExist:
            return Response({"error": "Case not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": f"An error occurred: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

import re
# from rest_framework.views import APIView
# from rest_framework.response import Response
# from rest_framework import status
# from rest_framework.permissions import IsAuthenticated
# from .models import Case
# from .serializers import CaseSerializer

import logging
logger = logging.getLogger(__name__)

class CaseListView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        logger.debug(f"Request headers: {request.headers}")
        try:
            # Extract filter params
            case_name = request.data.get("case_name", "")
            case_number = request.data.get("case_number", "")
            params_offset = int(request.data.get("offset", 0))
            params_limit = int(request.data.get("limit", 10))

            queryset = Case.objects.all()

            # Apply filters
            if case_name or case_number:
                if case_number and len(case_number) == 3 and case_number.isdigit():
                    queryset = queryset.annotate(
                        last_3_digits=Right("case_no", 3)
                    ).filter(last_3_digits=case_number)
                else:
                    search_term = case_name or case_number
                    queryset = queryset.filter(
                        Q(case_name__icontains=search_term) | Q(case_no__icontains=search_term)
                    )

            offset = params_offset * params_limit
            total_count = queryset.count()
            limited_queryset = list(queryset[offset:offset + params_limit])

            if not limited_queryset:
                return Response({"data": [], "total_count": total_count})

            limited_case_ids = [case.id for case in limited_queryset]

            # Fetch CaseDetails in bulk
            all_case_ids = limited_case_ids
            candidate_queryset = (
                Case.objects.exclude(id__in=limited_case_ids)
                .prefetch_related("patents")
                .order_by("-id")[:100]
            )
            candidates = list(candidate_queryset)
            all_case_ids += [c.id for c in candidates]

            case_details_map = {
                d.case_id: d for d in CaseDetails.objects.filter(case_id__in=all_case_ids)
            }

            # Pre-fetch patents with tech_category for all relevant cases
            patents = (
                Case.objects.filter(id__in=all_case_ids)
                .prefetch_related("patents")
            )

            tech_map = {}
            for case in patents:
                tech_set = set(case.patents.exclude(
                    Q(tech_category__isnull=True) |
                    Q(tech_category__exact='') |
                    Q(tech_category__iexact='not found')
                ).values_list('tech_category', flat=True))
                tech_map[case.id] = tech_set

            response_data = []

            for case in limited_queryset:
                current_data = CaseSerializer(case).data
                case_detail = case_details_map.get(case.id)

                if not case_detail:
                    current_data["similar_cases"] = []
                    response_data.append(current_data)
                    continue

                plaintiff = (case_detail.plaintiff or "").strip()
                defendant = (case_detail.defendant or "").strip()
                judge = (case_detail.judge or "").strip()
                case_tech = tech_map.get(case.id, set())

                similar_cases = []

                for other in candidates:
                    other_detail = case_details_map.get(other.id)
                    if not other_detail:
                        continue

                    score = 0
                    reasons = []

                    if plaintiff and (other_detail.plaintiff or "").strip() == plaintiff:
                        score += 3
                        reasons.append("plaintiff")

                    if defendant and (other_detail.defendant or "").strip() == defendant:
                        score += 3
                        reasons.append("defendant")

                    if judge and (other_detail.judge or "").strip() == judge:
                        score += 2
                        reasons.append("judge")

                    if case_tech & tech_map.get(other.id, set()):
                        score += 1
                        reasons.append("tech_category")

                    if score > 0:
                        similar_cases.append({
                            "case_no": other.case_no,
                            "match_reasons": reasons,
                            "score": score
                        })

                current_data["similar_cases"] = sorted(similar_cases, key=lambda x: -x["score"])[:5]
                response_data.append(current_data)

            return Response({
                "data": response_data,
                "total_count": total_count
            })

        except Exception as e:
            import traceback
            logger.error(f"Error in CaseListView: {traceback.format_exc()}")
            return Response(
                {'error': f'Internal Server Error: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class FilterDataView(APIView):
    permission_classes=[IsAuthenticated]
    def get(self, request):
        try:
            # Retrieve distinct case_status values, excluding null or blank values
            unique_statuses = (
                Case.objects.values_list("case_status", flat=True)
                .distinct()
                .exclude(case_status__isnull=True)
                .exclude(case_status__exact="")
            )
            # Convert to a list for JSON response
            unique_statuses_list = list(unique_statuses)
            
            # Fetch all unique litigation venues from the Case table
            litigation_venues = Case.objects.values_list("litigation_venues", flat=True).distinct()

            # Filter out null or blank entries and split if venues are comma-separated
            unique_venues = set()
            for venue in litigation_venues:
                if venue:  # Skip blank or None values
                    # Split by comma if multiple venues are stored in a single field
                    unique_venues.update([v.strip() for v in venue.split(",")])

            
            unique_court_names = Case.objects.values_list('court_name', flat=True).distinct()
            unique_patent_types = Case.objects.filter(patents__isnull=False).values_list('patents__patent_type', flat=True).distinct()
            unique_acquisition_types = Case.objects.filter(patents__isnull=False).values_list('patents__acquisition_type', flat=True).distinct()
            cause_of_action = CaseDetails.objects.filter(cause_of_action__isnull=False).values_list('cause_of_action', flat=True).distinct()       
            unique_patentno=Patent.objects.values_list("patent_no",flat=True).distinct()
            unique_caseNo=Case.objects.values_list("case_no",flat=True)
            unique_plaintiffs=CaseDetails.objects.values_list('plaintiff',flat=True).distinct()
            unique_defendents=CaseDetails.objects.values_list('defendant',flat=True).distinct()
            # Fetch all unique industries from the Patent table
            industries = Patent.objects.values_list("industry", flat=True).distinct()
            tech_categories = Patent.objects.values_list("tech_category", flat=True).distinct()
            tech_keywords = Patent.objects.values_list("technology_keywords", flat=True).distinct()
            standard_patent = Patent.objects.values_list("standard_patent", flat=True).distinct()
            semiconductor_patent = Patent.objects.values_list("semiconductor_patent", flat=True).distinct()

            # Remove any null or blank entries and split multiple values if needed
            unique_categories = set()
            for x in tech_categories:
                if x:  # Skip blank or None values
                    # If industries are comma-separated, split and strip each entry
                    unique_categories.update([i.strip() for i in x.split(",")])
                    
            unique_keywords = set()
            for x in tech_keywords:
                if x:  # Skip blank or None values
                    # If industries are comma-separated, split and strip each entry
                    unique_keywords.update([i.strip() for i in x.split(",")])
            return Response({"case_status": unique_statuses_list,"industry":industries, "case_no":unique_caseNo, "patent_no":unique_patentno,
                             "litigation_venues":unique_venues,"courtName":unique_court_names,
                             "patentType":unique_patent_types,"acquisition_type":unique_acquisition_types,
                             "cause_of_action":cause_of_action, "plaintiff":unique_plaintiffs,
                             'defendants':unique_defendents,"tech_categories":unique_categories,
                             "tech_keywords":unique_keywords, "standard_patent":standard_patent,
                             "semiconductor_patent":semiconductor_patent}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {"error": f"Error fetching case statuses: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,   
            )       
#  Call the function to start processing
# split_and_process_bulk_with_threads()


# class FileUploadView(APIView):
#     parser_classes = (MultiPartParser, FormParser)

#     def post(self, request):
#         file = request.FILES.get('file')
#         if file:
#             try:
#                 df = pd.read_excel(file, dtype=str)  
#                 records_to_create = []
#                 # limit = 20  

#                 for index, row in df.iterrows():
#                     # if limit <= 0:
#                     #     break
#                     if row.get('Case Number') == "":
#                         continue
#                     # limit -= 1

#                     # Convert dates using pd.to_datetime
#                     complaint_date = pd.to_datetime(row.get('Case Complaint Date'), errors='coerce')
#                     case_closed_date = pd.to_datetime(row.get('Case Closed Date'), errors='coerce')
#                     issue_date = pd.to_datetime(row.get('Patent Issued Date'), errors='coerce')
#                     expiry_date = pd.to_datetime(row.get('Patent Expiry Date'), errors='coerce')

#                     # Format dates or set to None
#                     complaint_date = complaint_date.strftime('%Y-%m-%d') if pd.notnull(complaint_date) else None
#                     case_closed_date = case_closed_date.strftime('%Y-%m-%d') if pd.notnull(case_closed_date) else None
#                     issue_date = issue_date.strftime('%Y-%m-%d') if pd.notnull(issue_date) else None
#                     expiry_date = expiry_date.strftime('%Y-%m-%d') if pd.notnull(expiry_date) else None

#                     raw_data_instance = RawData(
#                         case_no=row.get('Case Number'),
#                         complaint_date=complaint_date,
#                         case_name=row['Case Name'],
#                         case_status=row['Status'],
#                         court_name=row['Court Names'],
#                         litigation_venues=row['Litigation Venues & Judicial Authorities'],
#                         related_cases=row.get('Related/Originating Cases', ''),
#                         case_closed_date=case_closed_date,
#                         cause_of_action=row['Cause of Action'],
#                         accused_product=row['Accused Product'],
#                         assigned_judge=row.get('Assigned Judge', None),
#                         number_of_infringed_claims=row.get('Number of Infringed Claims', 0) or 0,
#                         third_party_funding_involved=row['3rd Party Funding Involved'],
#                         type_of_infringement=row['Type of Infringement'],
#                         case_strength_level=row['Case Strength Level'],
#                         recent_action=row.get('Recent Action', None),
#                         winning_amount=row.get('Winning Amount', None),
#                         winning_party=row.get('Winning Party', None),
#                         other_possible_infringer=row.get('Other Possible Infringer', None),
#                         list_of_prior_art=row.get('List of Prior Art', None),
#                         patent_no=row.get('Patent No', None),
#                         patent_type=row.get('Type of Patent', None),
#                         patent_title=row.get('Patent Title', None),
#                         original_assignee=row['Original Assignee'],
#                         current_assignee=row.get('Current Assignee', None),
#                         issue_date=issue_date,
#                         expiry_date=expiry_date,
#                         single_or_multiple=row['Single Patent or Family Involved?'],
#                         standard_patent=row['Standard Essential Patent'],
#                         semiconductor_patent=row['Semiconductor Patent'],
#                         tech_center=row['Tech Centre'],
#                         art_unit=row['Art Unit'],
#                         acquisition_type=row['Acquired Patent or Organic patent?'],
#                         assignee_timeline=row.get('Assignee Timeline', None),
#                         industry=row['Industry'],
#                         technology_keywords=row['Technology Keywords'],
#                         tech_category=row['Tech Category'],
#                         reason_of_allowance=row['Reason of Allowance'],
#                         plaintiff=row.get('Plaintiff/Petitioner', None),
#                         plaintiff_type_and_size=row['Plaintiff Type & Size'],
#                         plaintiff_law_firm=row.get('Plaintiff Law Firm Name', None),
#                         plaintiff_attorney_name=row.get('PA Name 1', None),
#                         plaintiff_contact=row.get('PA Phone 1', None),
#                         plaintiff_email=row.get('PA Email 1', None),
#                         defendant=row.get('Defendant', None),
#                         defendent_type_and_size=row['Defendant Type & Size'],
#                         defendant_law_firm=row.get('Defendant Law Firm Name', None),
#                         defendant_attorney_name=row.get('DA Name 1', None),
#                         defendant_phone=row.get('DA Phone 1', None),
#                         defendant_email=row.get('DA Email 1', None),
#                         stage=row['Stage']
#                     )
#                     records_to_create.append(raw_data_instance)

#                 # Bulk create in batches
#                 RawData.objects.bulk_create(records_to_create, batch_size=250)

#                 return Response({'message': 'File processed and data inserted successfully!'}, status=status.HTTP_200_OK)
#             except Exception as e:
#                 return Response({'error': f'Error processing file: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

#         return Response({'error': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)


# import pandas as pd
# from rest_framework.views import APIView
# from rest_framework.response import Response
# from rest_framework import status
# from .models import Case, Patent, CaseLawyerDetail, CasePatent
# from .serializers import CaseSerializer, PatentSerializer, CaseLawyerDetailSerializer, CasePatentSerializer

# class UploadExcelView(APIView):
#     def post(self, request):
#         file = request.FILES.get('file')
#         if not file:
#             return Response({"error": "No file provided"}, status=status.HTTP_400_BAD_REQUEST)
        
#         try:
#             # Read the Excel file
#             data = pd.read_excel(file, sheet_name=None)  # Read all sheets as a dictionary
            
#             # Process Case Data
#             if 'Case' in data:
#                 case_df = data['Case']
#                 for _, row in case_df.iterrows():
#                     serializer = CaseSerializer(data=row.to_dict())
#                     if serializer.is_valid():
#                         serializer.save()
#                     else:
#                         return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
#             # Process Patent Data
#             if 'Patent' in data:
#                 patent_df = data['Patent']
#                 for _, row in patent_df.iterrows():
#                     serializer = PatentSerializer(data=row.to_dict())
#                     if serializer.is_valid():
#                         serializer.save()
#                     else:
#                         return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
#             # Process CaseLawyerDetail Data
#             if 'CaseLawyerDetail' in data:
#                 lawyer_df = data['CaseLawyerDetail']
#                 for _, row in lawyer_df.iterrows():
#                     serializer = CaseLawyerDetailSerializer(data=row.to_dict())
#                     if serializer.is_valid():
#                         serializer.save()
#                     else:
#                         return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
#             # Process CasePatent Data
#             if 'CasePatent' in data:
#                 case_patent_df = data['CasePatent']
#                 for _, row in case_patent_df.iterrows():
#                     serializer = CasePatentSerializer(data=row.to_dict())
#                     if serializer.is_valid():
#                         serializer.save()
#                     else:
#                         return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
#             return Response({"message": "Data uploaded successfully"}, status=status.HTTP_201_CREATED)

#         except Exception as e:
#             return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



class ReportListView(APIView):
    def get(self, request):
        reports = Report.objects.all()
        serializer = ReportSerializer(reports, many=True, context={'request': request})
        return Response(serializer.data)

# @method_decorator(xframe_options_exempt, name='dispatch')
# class ViewReportView(APIView):
#     permission_classes = [AllowAny]
#     def get(self, request, report_id):
#         try:
#             report = Report.objects.get(id=report_id)
#             return FileResponse(report.file, content_type='application/pdf', as_attachment=False)
#         except Report.DoesNotExist:
#             return Response({'error': 'Report not found'}, status=status.HTTP_404_NOT_FOUND)



# from django.http import FileResponse, Http404
# from rest_framework.response import Response
# from rest_framework import status
# from .models import Report
# from django.utils.decorators import method_decorator
# from django.views.decorators.clickjacking import xframe_options_exempt
# from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
import os

@method_decorator(xframe_options_exempt, name='dispatch')
class ViewReportView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, report_id):
        try:
            report = Report.objects.get(id=report_id)

            # Determine if this is a download request
            download = request.GET.get('download', 'false').lower() == 'true'

            file_path = report.file.path
            if not os.path.exists(file_path):
                raise Http404("File not found on disk.")

            response = FileResponse(open(file_path, 'rb'), content_type='application/pdf', as_attachment=download)
            if download:
                response['Content-Disposition'] = f'attachment; filename="report_{report_id}.pdf"'
            return response

        except Report.DoesNotExist:
            return Response({'error': 'Report not found'}, status=status.HTTP_404_NOT_FOUND)
