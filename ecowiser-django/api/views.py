from rest_framework import viewsets, status
from rest_framework.response import Response
from base.models import Video
from base.tasks import extract_subtitles
from .serializers import VideoSerializer


class VideoViewSet(viewsets.ModelViewSet):
    queryset = Video.objects.all()
    serializer_class = VideoSerializer

    def create(self, request, *args, **kwargs):
        serializer = VideoSerializer(data=request.data)

        if serializer.is_valid():
            serializer.save()

            extract_subtitles.delay(serializer.data["video_file"])

            return Response(
                {
                    "message": "Video uploaded successfully",
                    "data": serializer.data,
                    "status": status.HTTP_201_CREATED,
                }
            )

        else:
            return Response(
                {
                    "message": "Video upload failed",
                    "status": status.HTTP_400_BAD_REQUEST,
                }
            )

    def list(self, request, *args, **kwargs):
        videos = Video.objects.all()
        serializer = VideoSerializer(videos, many=True)
        return Response(
            {"message": "Videos fetched successfully", "data": serializer.data}
        )

    def retrieve(self, request, *args, **kwargs):
        video = Video.objects.get(pk=kwargs["pk"])
        serializer = VideoSerializer(video)
        return Response(
            {"message": "Video fetched successfully", "data": serializer.data}
        )

    def update(self, request, *args, **kwargs):
        video = Video.objects.get(pk=kwargs["pk"])
        serializer = VideoSerializer(video, data=request.data)

        if serializer.is_valid():
            serializer.save()
            return Response(
                {
                    "message": "Video updated successfully",
                    "data": serializer.data,
                    "status": status.HTTP_200_OK,
                }
            )

        else:
            return Response(
                {
                    "message": "Video update failed",
                    "status": status.HTTP_400_BAD_REQUEST,
                }
            )

    def destroy(self, request, *args, **kwargs):
        video = Video.objects.get(pk=kwargs["pk"])
        video.delete()
        return Response(
            {
                "message": "Video deleted successfully",
                "status": status.HTTP_204_NO_CONTENT,
            }
        )
