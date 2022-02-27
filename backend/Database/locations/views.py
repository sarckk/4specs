from django.shortcuts import render
from django.http import HttpResponse

from rest_framework import viewsets
from .serializers import CoorSerializer
from .models import Coor

# Create your views here.
class CoorViewSet(viewsets.ModelViewSet):
    queryset = Coor.objects.all().order_by('xcoor')
    serializer_class = CoorSerializer