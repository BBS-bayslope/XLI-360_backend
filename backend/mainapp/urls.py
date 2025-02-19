from django.urls import path
from .views.views import FileUploadView,ValidateRawDataAPIView, CaseListView,FilterDataView, CaseDetailsView
from .views.uploadview import FileUploadView, FileUploadViewNew
from .views.analytics import CaseStatisticsView, PlaintiffTypeCountView, IndustryStats, CaseEntityListing
from .views.userView import RegisterView, LoginView
from rest_framework_simplejwt.views import TokenRefreshView

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
]
