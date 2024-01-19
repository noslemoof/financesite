from rest_framework import serializers
from .models import SalesItems, DataStorageSalesItems, DataStorage

class SalesItemsSerializer(serializers.ModelSerializer):
    class Meta:
        model = SalesItems
        fields = '__all__'


class DataStorageSISerializer(serializers.ModelSerializer):
    class Meta:
        model = DataStorageSalesItems
        fields = '__all__'

class DataStorageSerializer(serializers.ModelSerializer):
    sales_items = SalesItemsSerializer(many=True)

    class Meta:
        model = DataStorage
        fields = '__all__'