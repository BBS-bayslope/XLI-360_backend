from celery import shared_task
from django.core.management.base import BaseCommand
from django.db import transaction, connection
import pandas as pd
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
import logging
import os
from mainapp.models import RawData, Case, Patent, CasePatent, CaseDetails

logger = logging.getLogger(__name__)


# NOTE: Aapka sync_all_data() function yahan par daalein
@shared_task
def sync_all_data():
    logger.info("Starting sync: RawData -> Case/Patent/CasePatent/CaseDetails...")
    valid_raws = RawData.objects.filter(is_valid=True, is_synced=False)
    logger.info(f"Found {valid_raws.count()} valid unsynced rows")

    case_patent_to_create = []
    case_details_to_create = []
    batch_to_update = []

    with transaction.atomic():
        for raw_data in valid_raws.iterator(chunk_size=50):
            try:
                case_obj, _ = Case.objects.get_or_create(
                    case_no=raw_data.case_no.strip(),
                    defaults={
                        'complaint_date': raw_data.complaint_date,
                        'case_name': raw_data.case_name,
                        'case_status': raw_data.case_status,
                        'court_name': raw_data.court_name,
                        'litigation_venues': raw_data.litigation_venues,
                    }
                )

                if raw_data.patent_no and raw_data.patent_no not in ['0', '00:00:00', 'REDACTED', '']:
                    patent_nos = [p.strip() for p in raw_data.patent_no.split(',')]
                    for patent_no in patent_nos:
                        if patent_no:
                            patent_obj, _ = Patent.objects.get_or_create(
                                patent_no=patent_no,
                                defaults={
                                    'patent_title': raw_data.patent_title,
                                    'tech_category': raw_data.tech_category.strip().lower() if raw_data.tech_category else '',
                                    'patent_type': raw_data.patent_type,
                                    'original_assignee': raw_data.original_assignee,
                                    'current_assignee': raw_data.current_assignee,
                                    'issue_date': raw_data.issue_date,
                                    'expiry_date': raw_data.expiry_date,
                                    'single_or_multiple': raw_data.single_or_multiple,
                                    'standard_patent': raw_data.standard_patent,
                                    'semiconductor_patent': raw_data.semiconductor_patent,
                                    'tech_center': raw_data.tech_center,
                                    'art_unit': raw_data.art_unit,
                                    'acquisition_type': raw_data.acquisition_type,
                                    'assignee_timeline': raw_data.assignee_timeline,
                                    'industry': raw_data.industry,
                                    'technology_keywords': raw_data.technology_keywords,
                                    'tech_category': raw_data.tech_category,
                                    'reason_of_allowance': raw_data.reason_of_allowance,
                                }
                            )
                            if not CasePatent.objects.filter(case=case_obj, patent=patent_obj).exists():
                                case_patent_to_create.append(CasePatent(case=case_obj, patent=patent_obj))

                if not CaseDetails.objects.filter(case=case_obj).exists():
                    plaintiff = raw_data.plaintiff.strip().lower().split('vectair systems')[0].strip() if raw_data.plaintiff else ''
                    defendant = raw_data.defendant.strip().lower() if raw_data.defendant else ''
                    judge = raw_data.assigned_judge.strip().lower() if raw_data.assigned_judge else ''
                    case_details_to_create.append(
                        CaseDetails(
                            case=case_obj,
                            plaintiff=plaintiff,
                            defendant=defendant,
                            judge=judge,
                            related_cases=raw_data.related_cases,
                            case_closed_date=raw_data.case_closed_date,
                            cause_of_action=raw_data.cause_of_action,
                            accused_product=raw_data.accused_product,
                            number_of_infringed_claims=raw_data.number_of_infringed_claims,
                            third_party_funding_involved=raw_data.third_party_funding_involved,
                            type_of_infringement=raw_data.type_of_infringement or '',
                            case_strength_level=raw_data.case_strength_level,
                            recent_action=raw_data.recent_action,
                            winning_amount=raw_data.winning_amount,
                            winning_party=raw_data.winning_party,
                            other_possible_infringer=raw_data.other_possible_infringer,
                            list_of_prior_art=raw_data.list_of_prior_art,
                            plaintiff_type_and_size=raw_data.plaintiff_type_and_size,
                            defendent_type_and_size=raw_data.defendent_type_and_size,
                        )
                    )

                raw_data.is_synced = True
                batch_to_update.append(raw_data)

            except Exception as e:
                logger.error(f"Error syncing RawData ID {raw_data.id}: {str(e)}")
                continue

        if case_patent_to_create:
            CasePatent.objects.bulk_create(case_patent_to_create, ignore_conflicts=True)
        if case_details_to_create:
            CaseDetails.objects.bulk_create(case_details_to_create, ignore_conflicts=True)
        if batch_to_update:
            RawData.objects.bulk_update(batch_to_update, ['is_synced'], batch_size=100)

    logger.info("Sync completed: Case, Patent, CasePatent, CaseDetails")
    return True


class Command(BaseCommand):
    help = 'Runs the data sync from RawData to other models.'

    def handle(self, *args, **options):
        self.stdout.write("Starting manual data sync...")
        try:
            sync_all_data()
            self.stdout.write(self.style.SUCCESS("Data sync completed successfully."))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Data sync failed: {e}"))
