# workers_api/views.py
from rest_framework import generics
from .models import Worker
from .serializers import WorkerSerializer

# Vue pour lister tous les travailleurs (GET) et en créer de nouveaux (POST)
class WorkerList(generics.ListCreateAPIView):
    queryset = Worker.objects.all()
    serializer_class = WorkerSerializer

# Vue pour récupérer un travailleur spécifique (GET)
class WorkerDetail(generics.RetrieveAPIView):
    queryset = Worker.objects.all()
    serializer_class = WorkerSerializer
    lookup_field = 'id' # Pour chercher par 'id' (chaine de caractères)