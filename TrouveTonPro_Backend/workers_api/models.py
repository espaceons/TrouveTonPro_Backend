# workers_api/models.py

from django.db import models


DEFAUlt_IP = 'http://172.16.172.70:8000'
DEFAULT_IMAGE_URL = DEFAUlt_IP +'/static/images/personne.jpg'

# Résultat : 'http://172.16.172.70:8000/static/images/personne.jpg'

class Worker(models.Model):
    # Les champs correspondent à vos données workers.js
    id = models.CharField(max_length=5, primary_key=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    category = models.CharField(max_length=100)
    city = models.CharField(max_length=100)
    rating = models.DecimalField(max_digits=2, decimal_places=1)
    phone = models.CharField(max_length=15)
    whatsapp_number = models.CharField(max_length=15, blank=True, null=True)
    bio = models.TextField()
    image = models.ImageField( upload_to='workers_images/', default='workers_images/personne.jpg', blank=True, null=True )


    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.category})"