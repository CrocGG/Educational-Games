import uuid
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.conf import settings

class Player(AbstractUser):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    
    # Removed game_code and high_score as per new schema

    class Meta:
        verbose_name = "Player"
        verbose_name_plural = "Players"

class Game(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, unique=True)
    image = models.ImageField(upload_to='game_covers/', null=True, blank=True)
    # The protocol link, e.g., "snake-game://"
    
    high_score = models.IntegerField(default=0) # Changed default to 0
    high_score_player = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='high_score_games'
    )

    def __str__(self):
        return self.name