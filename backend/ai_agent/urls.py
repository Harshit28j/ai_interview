from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/interviews/', include('apps.interviews.urls')),
    path('api/auth/', include('apps.authentication.urls')),
]
