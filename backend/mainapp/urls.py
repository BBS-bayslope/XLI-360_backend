from django.urls import path
from .views.views import FileUploadView,ValidateRawDataAPIView, CaseListView,FilterDataView, CaseDetailsView
from .views.uploadview import FileUploadView, FileUploadViewNew
from .views.analytics import CaseStatisticsView, PlaintiffTypeCountView, IndustryStats, CaseEntityListing
from .views.userView import RegisterView, LoginView, GoogleLoginView
from rest_framework_simplejwt.views import TokenRefreshView
from mainapp.views.views import ReportListView,ViewReportView

from django.conf import settings
from django.conf.urls.static import static
# from .views import upload_report_view
from mainapp.views.views import upload_report_view

from mainapp.views.views import ReportListView, ViewReportView
urlpatterns = [
    path('upload/', FileUploadView.as_view(), name='api-upload-file'),
    path('validate-data/', ValidateRawDataAPIView.as_view(), name='validate-data'),
    path('case-list/', CaseListView.as_view(), name='case-list'),
    path('filter-data/', FilterDataView.as_view(), name='filter-data'),
    path('case-details/', CaseDetailsView.as_view(), name='case-details'),
    path('uploadNew/', FileUploadViewNew.as_view(), name='api-upload-file'),
    path('case-stats/', CaseStatisticsView.as_view(), name='case-stats'),
    path('plaintiff-type-stats/', PlaintiffTypeCountView.as_view(), name='pt-stats'),
    path('industry-stats/', IndustryStats.as_view(), name='industry-stats'),
    path('case-entity-list/', CaseEntityListing.as_view(), name='case-entity-list'),
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('google-login/', GoogleLoginView.as_view(), name='google-login'),


    path('reports/', ReportListView.as_view(), name='report-list'),
    path('view/<int:report_id>/', ViewReportView.as_view(), name='view-report'),

    # from django.urls import path
    

# urlpatterns = [
    path('upload-ui/', upload_report_view, name='upload_ui'),
# ]
]
