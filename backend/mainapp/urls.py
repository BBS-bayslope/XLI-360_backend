from django.urls import path
from .views.views import FileUploadView,ValidateRawDataAPIView, CaseListView,FilterDataView, CaseDetailsView


urlpatterns = [
    path('upload/', FileUploadView.as_view(), name='api-upload-file'),
    path('validate-data/', ValidateRawDataAPIView.as_view(), name='validate-data'),
    path('case-list/', CaseListView.as_view(), name='case-list'),
    path('filter-data/', FilterDataView.as_view(), name='filter-data'),
    path('case-details/', CaseDetailsView.as_view(), name='case-details'),
]
