from django.contrib import admin
from .models import SalesItems, DataStorage, DataStorageSalesItems


admin.site.register(SalesItems)
admin.site.register(DataStorage)
admin.site.register(DataStorageSalesItems)
# Register your models here.
