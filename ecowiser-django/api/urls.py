from django.urls import path
from .views import VideoViewSet

urlpatterns = [
    path(
        "videos/",
        VideoViewSet.as_view(
            {
                "get": "list",
                "post": "create",
            }
        ),
    ),
    path(
        "videos/<str:pk>/",
        VideoViewSet.as_view(
            {
                "get": "retrieve",
                "put": "update",
                "delete": "destroy",
            }
        ),
    ),
]
