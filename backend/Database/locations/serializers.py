from rest_framework import serializers
from .models import Coor

class CoorSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = Coor
        fields = ('id', 'xcoor', 'ycoor')