from rest_framework import views, status, permissions
from rest_framework.response import Response
from allauth.headless.adapter import get_adapter
from .serializers import UserSerializer
from dataclasses import asdict

class ProfileUpdateView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request):
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            user = serializer.save()
            adapter = get_adapter()
            user_data = adapter.user_as_dataclass(user)
            return Response({"status": 200, "data": {"user": asdict(user_data)}})

        
        return Response({
            "status": 400, 
            "errors": [{"message": v[0], "param": k} for k, v in serializer.errors.items()]
        }, status=status.HTTP_400_BAD_REQUEST)
