# base/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    GameViewSet, PlayerUpdateView, SubmitScoreView, 
    login_view, register_user, MyTokenObtainPairView
)
from . import views 

router = DefaultRouter()
router.register(r'games', GameViewSet, basename='games')

urlpatterns = [
    # No 'api/' here because it's already in the parent urls.py
    path('login/', login_view, name='login'),
    path('register/', register_user, name='register'),
    path('token/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('submit-score/', SubmitScoreView.as_view(), name='submit_score'),
    
    # This now becomes /api/profile/update/ (So Nginx will find it!)
    path('profile/update/', PlayerUpdateView.as_view(), name='player-update'),
    path('api/health/', views.health_check, name='health_check'),
    # The router for games
    path('', include(router.urls)), 
]