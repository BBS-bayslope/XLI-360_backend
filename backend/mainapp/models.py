from django.db import models

# Create your models here.
# class User(models.Model):
#     email = models.EmailField(unique=True, max_length=255)
#     password = models.CharField(max_length=128)

#     def __str__(self):
#         return self.email

class RawData(models.Model):
    case_no = models.CharField(max_length=100,blank=True, null=True) 
    complaint_date = models.TextField(blank=True, null=True)
    case_name = models.TextField(blank=True, null=True)
    case_status = models.CharField(max_length=100,blank=True,null=True)
    court_name = models.TextField(blank=True, null=True)
    litigation_venues = models.TextField(blank=True,null=True)
    related_cases = models.TextField(blank=True, null=True)
    case_closed_date = models.TextField(blank=True, null=True)
    cause_of_action = models.TextField(blank=True,null=True)
    accused_product = models.TextField(blank=True,null=True)
    assigned_judge = models.TextField(blank=True, null=True)
    number_of_infringed_claims = models.CharField(max_length=50,blank=True,null=True)
    third_party_funding_involved = models.TextField(blank=True, null=True)
    type_of_infringement = models.TextField(blank=True, null=True)
    case_strength_level = models.TextField(blank=True, null=True)
    recent_action = models.TextField(blank=True, null=True)
    winning_amount = models.TextField(blank=True, null=True)
    winning_party = models.TextField(blank=True, null=True)
    other_possible_infringer = models.TextField(blank=True, null=True)
    list_of_prior_art = models.TextField(blank=True, null=True)
    patent_no = models.TextField(blank=True, null=True)
    patent_type = models.TextField(blank=True, null=True)
    patent_title = models.TextField(blank=True, null=True)
    original_assignee = models.TextField(blank=True, null=True)
    current_assignee = models.TextField(blank=True, null=True)
    issue_date = models.TextField(blank=True, null=True)
    expiry_date = models.TextField(blank=True, null=True)
    single_or_multiple = models.TextField(blank=True, null=True)
    standard_patent = models.CharField(max_length=20,blank=True,null=True)
    semiconductor_patent = models.CharField(max_length=20,blank=True,null=True)
    tech_center = models.TextField(blank=True, null=True)
    art_unit = models.TextField(blank=True, null=True)
    acquisition_type = models.TextField(blank=True, null=True)
    assignee_timeline = models.TextField(blank=True, null=True)
    industry = models.TextField(blank=True, null=True)
    technology_keywords = models.TextField(blank=True,null=True)
    tech_category = models.TextField(blank=True, null=True)
    reason_of_allowance = models.TextField(blank=True,null=True)
    plaintiff = models.TextField(blank=True, null=True)
    plaintiff_type_and_size = models.TextField(blank=True, null=True)
    plaintiff_law_firm = models.TextField(blank=True, null=True)
    plaintiff_attorney_name =models.TextField(blank=True, null=True)
    plaintiff_contact = models.TextField(blank=True, null=True)
    plaintiff_email = models.TextField(blank=True, null=True)
    defendant = models.TextField(blank=True, null=True)
    defendent_type_and_size = models.TextField(blank=True, null=True)
    defendant_law_firm = models.TextField(blank=True, null=True)
    defendant_attorney_name = models.TextField(blank=True, null=True)
    defendant_phone = models.TextField(blank=True, null=True)
    defendant_email = models.TextField(blank=True, null=True)
    stage=models.CharField(max_length=20,blank=True,null=True)
    is_valid=models.BooleanField(default=True,blank=True,null=True)
    is_processed=models.BooleanField(default=False,blank=True,null=True)

    def __str__(self):
        return self.case_no
    
class Case(models.Model):
    case_no = models.CharField(max_length=100, unique=True)  
    complaint_date = models.TextField(blank=True, null=True)
    case_name = models.TextField(blank=True, null=True)
    case_status = models.CharField(max_length=100,blank=True,null=True)
    court_name = models.TextField(blank=True, null=True)
    litigation_venues = models.TextField(blank=True, null=True)
    patents = models.ManyToManyField('Patent', through='CasePatent', related_name='cases')

    def __str__(self):
        return f"Case {self.case_no}: {self.case_name}"

class CaseDetails(models.Model):
    case = models.ForeignKey(Case, on_delete=models.CASCADE)
    related_cases = models.TextField(blank=True, null=True)
    case_closed_date = models.TextField(blank=True, null=True)
    cause_of_action = models.TextField(blank=True,null=True)
    accused_product = models.TextField(blank=True,null=True)
    judge = models.TextField(blank=True, null=True)
    number_of_infringed_claims = models.CharField(max_length=50,blank=True,null=True)
    third_party_funding_involved = models.TextField(blank=True, null=True)
    type_of_infringement = models.TextField(blank=True, null=True)
    case_strength_level = models.TextField(blank=True, null=True)
    recent_action = models.TextField(blank=True, null=True)
    winning_amount = models.TextField(blank=True, null=True)
    winning_party = models.TextField(blank=True, null=True)
    other_possible_infringer = models.TextField(blank=True, null=True)
    list_of_prior_art = models.TextField(blank=True, null=True)
    plaintiff = models.TextField(blank=True, null=True)
    plaintiff_type_and_size = models.TextField(blank=True, null=True)
    defendant = models.TextField(blank=True, null=True)
    defendent_type_and_size = models.TextField(blank=True, null=True)
    stage=models.CharField(max_length=20,blank=True,null=True)
    other_defendents=models.TextField(blank=True, null=True)
    no_of_defendents=models.TextField(blank=True, null=True)
    activity_timeline=models.TextField(blank=True, null=True)
    
class Patent(models.Model):
    patent_no = models.CharField(max_length=100, unique=True)  
    patent_type = models.TextField(blank=True, null=True)
    patent_title = models.TextField(blank=True, null=True)
    original_assignee = models.TextField(blank=True, null=True)
    current_assignee = models.TextField(blank=True, null=True)
    issue_date = models.TextField(blank=True, null=True)
    expiry_date = models.TextField(blank=True, null=True)
    single_or_multiple = models.TextField(blank=True, null=True)
    standard_patent = models.CharField(max_length=20,blank=True,null=True)
    semiconductor_patent = models.CharField(max_length=20,blank=True,null=True)
    tech_center = models.TextField(blank=True, null=True)
    art_unit = models.TextField(blank=True, null=True)
    acquisition_type = models.TextField(blank=True, null=True)
    assignee_timeline = models.TextField(blank=True, null=True)
    industry = models.TextField(blank=True, null=True)
    technology_keywords = models.TextField(blank=True,null=True)
    tech_category = models.TextField(blank=True, null=True)
    reason_of_allowance = models.TextField(blank=True,null=True)

    def __str__(self):
        return self.patent_no


class CasePatent(models.Model):
    case = models.ForeignKey(Case, on_delete=models.CASCADE)
    patent = models.ForeignKey(Patent, on_delete=models.CASCADE)
    date_added = models.DateField(auto_now_add=True)

    def __str__(self):
        return f"Case {self.case.case_no} - Patent {self.patent.patent_no}"

class PlaintiffDetails(models.Model):
    case = models.ForeignKey(Case, on_delete=models.CASCADE)
    plaintiff = models.TextField(blank=True, null=True)
    plaintiff_law_firm = models.TextField(blank=True, null=True)
    plaintiff_attorney_name =models.TextField(blank=True, null=True)
    plaintiff_contact = models.TextField(blank=True, null=True)
    plaintiff_email = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"Case {self.case.case_no}: {self.plaintiff_law_firm}"

class DefendantDetails(models.Model):
    case = models.ForeignKey(Case, on_delete=models.CASCADE)
    defendant = models.TextField(blank=True, null=True)
    defendant_law_firm = models.TextField(blank=True, null=True)
    defendant_attorney_name = models.TextField(blank=True, null=True)
    defendant_phone = models.TextField(blank=True, null=True)
    defendant_email = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"Case {self.case.case_no}: {self.defendant_law_firm}"

   
    