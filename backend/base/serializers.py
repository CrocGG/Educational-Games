from rest_framework import serializers
from .models import Game, Player

class GameSerializer(serializers.ModelSerializer):
    high_score_player_username = serializers.ReadOnlyField(source='high_score_player.username')

    class Meta:
        model = Game
        fields = [
            'id', 'name', 'image', 
            'high_score', 'high_score_player', 'high_score_player_username'
        ]

class PlayerSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = Player
        fields = ['id', 'username', 'email', 'password']

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = Player(**validated_data)
        user.set_password(password)
        user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        if password:
            instance.set_password(password)
        return super().update(instance, validated_data)