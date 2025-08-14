from celery import shared_task
from django.db import transaction, connection
from mainapp.models import RawData, Case, Patent, CasePatent, CaseDetails
import logging
import time

logger = logging.getLogger(__name__)


@shared_task(bind=True)
def sync_all_data_task(self):
    start_time = time.time()
    try:
        # Use a raw query for a potentially faster count on large tables
        with connection.cursor() as cursor:
            cursor.execute(
                "SELECT COUNT(*) FROM mainapp_rawdata WHERE is_valid = TRUE AND is_synced = FALSE"
            )
            total_rows = cursor.fetchone()[0]

        processed_count = 0
        batch_size = 5000

        logger.info(f"STARTING SYNC. Total rows to process: {total_rows}")
        if total_rows == 0:
            logger.info("No new data to sync. Task finished.")
            return True

        while True:
            batch_start_time = time.time()
            raw_data_batch = list(
                RawData.objects.filter(is_valid=True, is_synced=False).values(
                    "id",
                    "case_no",
                    "complaint_date",
                    "case_name",
                    "case_status",
                    "court_name",
                    "litigation_venues",
                    "patent_no",
                    "patent_title",
                    "tech_category",
                    "patent_type",
                    "original_assignee",
                    "current_assignee",
                    "issue_date",
                    "expiry_date",
                    "single_or_multiple",
                    "standard_patent",
                    "semiconductor_patent",
                    "tech_center",
                    "art_unit",
                    "acquisition_type",
                    "assignee_timeline",
                    "industry",
                    "technology_keywords",
                    "reason_of_allowance",
                    "plaintiff",
                    "defendant",
                    "assigned_judge",
                    "related_cases",
                    "case_closed_date",
                    "cause_of_action",
                    "accused_product",
                    "number_of_infringed_claims",
                    "third_party_funding_involved",
                    "type_of_infringement",
                    "case_strength_level",
                    "recent_action",
                    "winning_amount",
                    "winning_party",
                    "other_possible_infringer",
                    "list_of_prior_art",
                    "plaintiff_type_and_size",
                    "defendent_type_and_size",
                )[:batch_size]
            )

            if not raw_data_batch:
                logger.info("No more unsynced rows found. Sync process is complete.")
                break

            with transaction.atomic():
                cases_to_create = {}
                patents_to_create = {}

                for raw in raw_data_batch:
                    case_no = raw["case_no"].strip()
                    if case_no and case_no not in cases_to_create:
                        cases_to_create[case_no] = Case(
                            case_no=case_no,
                            complaint_date=raw["complaint_date"],
                            case_name=raw["case_name"],
                            case_status=raw["case_status"],
                            court_name=raw["court_name"],
                            litigation_venues=raw["litigation_venues"],
                        )

                    if raw["patent_no"]:
                        patent_nos = [
                            p.strip() for p in raw["patent_no"].split(",") if p.strip()
                        ]
                        for patent_no in patent_nos:
                            if patent_no and patent_no not in patents_to_create:
                                patents_to_create[patent_no] = Patent(
                                    patent_no=patent_no,
                                    patent_title=raw["patent_title"],
                                    tech_category=(
                                        raw["tech_category"].strip().lower()
                                        if raw["tech_category"]
                                        else ""
                                    ),
                                    patent_type=raw["patent_type"],
                                    original_assignee=raw["original_assignee"],
                                    current_assignee=raw["current_assignee"],
                                    issue_date=raw["issue_date"],
                                    expiry_date=raw["expiry_date"],
                                    single_or_multiple=raw["single_or_multiple"],
                                    standard_patent=raw["standard_patent"],
                                    semiconductor_patent=raw["semiconductor_patent"],
                                    tech_center=raw["tech_center"],
                                    art_unit=raw["art_unit"],
                                    acquisition_type=raw["acquisition_type"],
                                    assignee_timeline=raw["assignee_timeline"],
                                    industry=raw["industry"],
                                    technology_keywords=raw["technology_keywords"],
                                    reason_of_allowance=raw["reason_of_allowance"],
                                )

                Case.objects.bulk_create(
                    cases_to_create.values(), ignore_conflicts=True
                )
                Patent.objects.bulk_create(
                    patents_to_create.values(), ignore_conflicts=True
                )

                case_nos_in_batch = {raw["case_no"].strip() for raw in raw_data_batch}
                patent_nos_in_batch = {
                    p.strip()
                    for raw in raw_data_batch
                    if raw["patent_no"]
                    for p in raw["patent_no"].split(",")
                    if p.strip()
                }

                cases_map = {
                    c.case_no: c
                    for c in Case.objects.filter(case_no__in=case_nos_in_batch)
                }
                patents_map = {
                    p.patent_no: p
                    for p in Patent.objects.filter(patent_no__in=patent_nos_in_batch)
                }

                case_ids_in_batch = [c.id for c in cases_map.values()]

                existing_details_case_ids = set(
                    CaseDetails.objects.filter(
                        case_id__in=case_ids_in_batch
                    ).values_list("case_id", flat=True)
                )
                existing_links = set(
                    CasePatent.objects.filter(
                        case_id__in=case_ids_in_batch
                    ).values_list("case_id", "patent_id")
                )

                case_details_to_create = []
                case_patents_to_create = []

                for raw in raw_data_batch:
                    case_obj = cases_map.get(raw["case_no"].strip())
                    if not case_obj:
                        continue

                    if case_obj.id not in existing_details_case_ids:
                        case_details_to_create.append(
                            CaseDetails(
                                case=case_obj,
                                plaintiff=raw["plaintiff"],
                                defendant=raw["defendant"],
                                judge=raw["assigned_judge"],
                                related_cases=raw["related_cases"],
                                case_closed_date=raw["case_closed_date"],
                                cause_of_action=raw["cause_of_action"],
                                accused_product=raw["accused_product"],
                                number_of_infringed_claims=raw[
                                    "number_of_infringed_claims"
                                ],
                                third_party_funding_involved=raw[
                                    "third_party_funding_involved"
                                ],
                                type_of_infringement=raw["type_of_infringement"] or "",
                                case_strength_level=raw["case_strength_level"],
                                recent_action=raw["recent_action"],
                                winning_amount=raw["winning_amount"],
                                winning_party=raw["winning_party"],
                                other_possible_infringer=raw[
                                    "other_possible_infringer"
                                ],
                                list_of_prior_art=raw["list_of_prior_art"],
                                plaintiff_type_and_size=raw["plaintiff_type_and_size"],
                                defendent_type_and_size=raw["defendent_type_and_size"],
                            )
                        )
                        existing_details_case_ids.add(case_obj.id)

                    if raw["patent_no"]:
                        patent_nos = [
                            p.strip() for p in raw["patent_no"].split(",") if p.strip()
                        ]
                        for patent_no in patent_nos:
                            patent_obj = patents_map.get(patent_no)
                            if (
                                patent_obj
                                and (case_obj.id, patent_obj.id) not in existing_links
                            ):
                                case_patents_to_create.append(
                                    CasePatent(case=case_obj, patent=patent_obj)
                                )
                                existing_links.add((case_obj.id, patent_obj.id))

                CaseDetails.objects.bulk_create(
                    case_details_to_create, ignore_conflicts=True
                )
                CasePatent.objects.bulk_create(
                    case_patents_to_create, ignore_conflicts=True
                )

                raw_ids_to_update = [raw["id"] for raw in raw_data_batch]
                RawData.objects.filter(id__in=raw_ids_to_update).update(is_synced=True)

            processed_count += len(raw_data_batch)
            rows_remaining = total_rows - processed_count
            batch_duration = time.time() - batch_start_time

            logger.info(
                f"PROGRESS: Synced {processed_count}/{total_rows} rows. {rows_remaining} rows remaining. Last batch took {batch_duration:.2f} seconds."
            )

        total_duration = time.time() - start_time
        logger.info(
            f"SUCCESS: Sync completed. Total records processed: {processed_count}. Total time: {total_duration:.2f} seconds."
        )
        return True

    except Exception as e:
        logger.error(f"FATAL ERROR during sync: {e}", exc_info=True)
        self.update_state(state="FAILURE", meta={"exc": str(e)})
        raise
