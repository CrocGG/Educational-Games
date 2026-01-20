from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import Game, Player

@admin.register(Game)
class GameAdmin(admin.ModelAdmin):
    list_display = ('name', 'id', 'high_score', 'high_score_player')
    readonly_fields = ('id',)

@admin.register(Player)
class PlayerAdmin(UserAdmin):
    # We reset fieldsets to default UserAdmin but ensure email is visible
    # or you can customize it further if needed.
    list_display = ('username', 'email', 'id', 'is_staff')
    ordering = ('email',)