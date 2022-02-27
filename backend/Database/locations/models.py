from django.db import models

# Create your models here.
class Coor(models.Model):
    xcoor = models.DecimalField(max_digits=9, decimal_places=6)
    ycoor = models.DecimalField(max_digits=9, decimal_places=6)
    coor = str((xcoor,ycoor))

    def __str__(self):
        return self.coor