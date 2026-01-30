from rest_framework import viewsets, status, generics
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import authenticate
from .models import Game, Player
from .serializers import GameSerializer, PlayerSerializer
from .permissions import IsAdminOrReadOnly

class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['username'] = user.username
        token['is_staff'] = user.is_staff
        return token

class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer

@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    """
    Simple health check for Docker/Load Balancers
    """
    return Response({"status": "ok"}, status=status.HTTP_200_OK)

@api_view(['POST'])
@permission_classes([AllowAny])
def register_user(request):
    serializer = PlayerSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        user.is_staff = False 
        user.save()
        return Response({"success": "User created", "id": user.id}, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    username = request.data.get('username')
    password = request.data.get('password')
    user = authenticate(username=username, password=password)
    if user:
        serializer = PlayerSerializer(user)
        return Response(serializer.data, status=status.HTTP_200_OK)
    return Response({"error": "Invalid Credentials"}, status=status.HTTP_400_BAD_REQUEST)

class GameViewSet(viewsets.ModelViewSet):
    queryset = Game.objects.all()
    serializer_class = GameSerializer
    permission_classes = [IsAdminOrReadOnly]

class PlayerUpdateView(generics.RetrieveUpdateAPIView):
    queryset = Player.objects.all()
    serializer_class = PlayerSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user
    
class SubmitScoreView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        game_name = request.data.get('game_name')
        new_score = request.data.get('score')
        
        try:
            game = Game.objects.get(name=game_name)
            if new_score > game.high_score:
                game.high_score = new_score
                game.high_score_player = request.user
                game.save()
                return Response({"message": "New High Score!"}, status=status.HTTP_200_OK)
            return Response({"message": "Score submitted"}, status=status.HTTP_200_OK)
        except Game.DoesNotExist:
            return Response({"error": "Game not found"}, status=status.HTTP_404_NOT_FOUND)