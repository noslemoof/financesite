# models.py

from django.db import models
from django.contrib.auth.models import User

class SalesItems(models.Model):
    item_name = models.CharField(max_length=50)
    item_price = models.FloatField()
    item_stock = models.IntegerField()

class DataStorage(models.Model):
    PAYLAH = "PYL"
    PAYNOW = "PNW"
    CASH = "CSH"
    BANK_TRANSFER = "BKT"

    PAYMENT_MODE_CHOICES = [
        (PAYLAH, 'PayLah'),
        (PAYNOW, 'PayNow'),
        (CASH, 'Cash'),
        (BANK_TRANSFER, 'BankTransfer'),
    ]

    salesperson = models.ForeignKey(User, on_delete=models.CASCADE)
    buyer_name = models.CharField(max_length=50)
    payment_method = models.CharField(max_length=3, choices=PAYMENT_MODE_CHOICES)
    date = models.DateField(null=True, blank=True, verbose_name='Date', auto_now_add=True)
    time = models.TimeField(null=True, blank=True, verbose_name='Time', auto_now_add=True)
    sales_items = models.ManyToManyField(SalesItems, through='DataStorageSalesItems')
    quantity_sold = models.IntegerField(default=0)
    total_price = models.FloatField()

class DataStorageSalesItems(models.Model):
    data_storage = models.ForeignKey(DataStorage, on_delete=models.CASCADE)
    sales_item = models.ForeignKey(SalesItems, on_delete=models.CASCADE)
    quantity = models.IntegerField(default=0)


    #After updating your models, makemigrations the model:
    #py manage.py makemigrations DataHandler
    #py manage.py migrate

    #In the case of empty rows, either allow null in the above or
    #Amend accordingly


