from django.shortcuts import render, redirect
from rest_framework.decorators import api_view
from django.template import loader
from django.utils.dateparse import parse_date, parse_time
from datetime import time
from django.http import HttpResponse
from .models import SalesItems, DataStorage, DataStorageSalesItems
from django.contrib.auth import authenticate, login, logout
from django.http import JsonResponse
from .forms import PaymentBuyerForm, AddToBasketForm
from rest_framework import viewsets, status, filters, generics
from rest_framework.response import Response
from .serializers import DataStorageSerializer, DataStorageSISerializer, SalesItemsSerializer
import json

def ItemPage(request):
    template = loader.get_template('Items.html')
    sales_items = SalesItems.objects.all()
    context = {
        'sales_items': sales_items
    }
    return HttpResponse(template.render(context,request))

def UserLogin(request):
    if request.method == 'POST':
        username = request.POST['username']
        password = request.POST['password']
        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            # Redirect to a success page or use reverse('home') to redirect to home page
            return redirect('sales_report')
        else:
            # Return an invalid login message
            return render(request, 'login.html', {'error_message': 'Invalid credentials'})
    else:
        return render(request, 'login.html')

def UserLogout(request):
    if request.user.is_authenticated:
        # Perform logout only if user is authenticated
        logout(request)
    return redirect('login')

def Sales_report(request):
    template = loader.get_template('home.html')
    sales_items = SalesItems.objects.all()
    DataStorage_instance = DataStorage.objects.all()

    earnings_populated = []
    quantity_populated = []
    if request.user.is_authenticated:
        x = 1
    else:
        x = 0

    for i in DataStorage_instance:
        earnings_populated.append(i.total_price)
        quantity_populated.append(i.quantity_sold)

    earnings = sum(earnings_populated)
    quantity = sum(quantity_populated)
    context = {
        'x': x,
        'username': request.user.username,
        'sales_items': sales_items,
        'earnings': earnings,
        'quantity': quantity
    }
    return HttpResponse(template.render(context,request))

class SaleItemsViewset(viewsets.ModelViewSet):
    queryset = SalesItems.objects.all()
    serializer_class = SalesItemsSerializer

class DataStorageViewset(viewsets.ModelViewSet):
    queryset = DataStorage.objects.all()
    serializer_class = DataStorageSerializer
    search_fields = ['buyer_name']
    filter_backends = [filters.SearchFilter]

@api_view(['POST'])
def create_transaction(request):
    salesperson = request.user

    # Check if 'total_price' is present in the request data
    if 'total_price' not in request.data:
        return Response({'detail': 'total_price is required'}, status=status.HTTP_400_BAD_REQUEST)

    # Try to parse 'total_price' as a float
    try:
        total_price = float(request.data['total_price'])
    except (TypeError, ValueError):
        return Response({'detail': 'Invalid total_price format'}, status=status.HTTP_400_BAD_REQUEST)

    # Create the DataStorage instance
    data_storage = DataStorage.objects.create(
        salesperson=salesperson,
        buyer_name=request.data.get('buyer_name'),
        payment_method=request.data.get('payment_method'),
        total_price=total_price
        # date and time are set automatically by Django
    )

    # Add the sales items and calculate total quantity sold
    sales_items_json = request.data.get('sales_items', '[]')
    try:
        sales_items_data = json.loads(sales_items_json)
        if not isinstance(sales_items_data, list):
            raise ValueError("sales_items is not a list")

        quantity_sold = 0
        for item_data in sales_items_data:
            sales_item = SalesItems.objects.get(pk=item_data['id'])
            quantity = item_data['quantity']
            DataStorageSalesItems.objects.create(
                data_storage=data_storage,
                sales_item=sales_item,
                quantity=quantity
            )
            quantity_sold += quantity

    except (SalesItems.DoesNotExist, KeyError, ValueError, TypeError, json.JSONDecodeError) as e:
        data_storage.delete()  # Rollback in case of error
        return Response({'detail': f'Invalid data in sales_items: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)

    # Update the total quantity sold in DataStorage
    data_storage.quantity_sold = quantity_sold
    data_storage.save()

    return Response({'status': 'success', 'id': data_storage.pk}, status=status.HTTP_201_CREATED)





class DataStorageSIViewset(viewsets.ModelViewSet):
    queryset = DataStorageSalesItems.objects.all()
    serializer_class = DataStorageSISerializer


def cashier(request):
    sales_items = SalesItems.objects.all()
    add_to_basket_form = AddToBasketForm()
    payment_buyer_form = PaymentBuyerForm()

    context = {
        'username': request.user.username,
        'sales_items': sales_items,
        'add_to_basket_form': add_to_basket_form,
        'payment_buyer_form': payment_buyer_form,
    }
    return render(request, 'cashier.html', context)


def transaction_history(request):

    return render(request, 'transaction_history.html')

@api_view(['GET'])
def get_latest_transactions(request):
    # Fetch the last 5 transactions
    latest_transactions = DataStorage.objects.all().order_by('-date', '-time')[:10]

    # Serialize the transactions
    transactions_data = []
    for transaction in latest_transactions:
        transactions_data.append({
            'date': transaction.date,
            'time': transaction.time,
            'number_of_items_sold': transaction.datastoragesalesitems_set.count(),  # Assuming reverse relation name is datastoragesalesitems_set
            'total_price': transaction.total_price,
            'salesperson': transaction.salesperson.username,
            'buyer': transaction.buyer_name,
            'payment_method': transaction.get_payment_method_display(),  # get_FOO_display() gives the human-readable name for a choice field
        })

    return JsonResponse(transactions_data, safe=False)


@api_view(['GET'])
def get_full_transactions(request):
    buyer_name = request.GET.get('buyer_name', '')
    selected_date = request.GET.get('date', '')
    hour_from = request.GET.get('hour_from', '')
    hour_to = request.GET.get('hour_to', '')

    # Start with all transactions
    queryset = DataStorage.objects.all()

    # Filter by buyer name if provided
    if buyer_name:
        queryset = queryset.filter(buyer_name__icontains=buyer_name)

    # Filter by date if provided
    if selected_date:
        date_obj = parse_date(selected_date)
        if date_obj:
            queryset = queryset.filter(date=date_obj)

    # Filter by hour range if provided
    if hour_from and hour_to:
        hour_from_obj = time(int(hour_from), 0)  # Assuming hour_from is like '08' or '14'
        hour_to_obj = time(int(hour_to), 0)     # Assuming hour_to is the same format
        if hour_from_obj and hour_to_obj:
            queryset = queryset.filter(time__gte=hour_from_obj, time__lte=hour_to_obj)

    # Order the queryset
    queryset = queryset.order_by('-date', '-time')

    # Serialize the transactions
    transactions_data = []
    for transaction in queryset:
        transactions_data.append({
            'id': transaction.id,
            'date': transaction.date,
            'time': transaction.time,
            'number_of_items_sold': transaction.datastoragesalesitems_set.count(),
            'total_price': transaction.total_price,
            'salesperson': transaction.salesperson.username if transaction.salesperson else None,
            'buyer': transaction.buyer_name,
            'payment_method': transaction.get_payment_method_display(),
        })

    return JsonResponse(transactions_data, safe=False)


@api_view(['DELETE'])
def delete_transaction(request, transaction_id):
    try:
        # Retrieve the transaction
        transaction = DataStorage.objects.get(pk=transaction_id)

        # Retrieve related sales items and restore stock
        data_storage_sales_items = transaction.datastoragesalesitems_set.all()
        items_restored = []
        for data_storage_sales_item in data_storage_sales_items:
            sales_item = data_storage_sales_item.sales_item
            sales_item.item_stock += data_storage_sales_item.quantity
            sales_item.save()
            items_restored.append({
                'item_name': sales_item.item_name,
                'quantity_restored': data_storage_sales_item.quantity
            })

        # Delete the transaction after restoring stock
        transaction.delete()

        return Response({
            'status': 'success',
            'id': transaction_id,
            'items_restored': items_restored
        }, status=status.HTTP_200_OK)
    except DataStorage.DoesNotExist:
        # The transaction was not found
        return Response({
            'status': 'error',
            'message': 'Transaction not found'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        # Handle any other exceptions
        return Response({
            'status': 'error',
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def get_items_DS(request):
    # Get the DataStorage ID from the query parameters, if provided
    data_storage_id = request.query_params.get('data_storage_id')

    if data_storage_id:
        # Filter by the provided DataStorage ID
        transaction_items = DataStorageSalesItems.objects.filter(data_storage_id=data_storage_id)
    else:
        # If no DataStorage ID is provided, return all items
        transaction_items = DataStorageSalesItems.objects.all()

    transactions_data = [{
        'item_name': item.sales_item.item_name,
        'quantity': item.quantity
    } for item in transaction_items]

    return JsonResponse(transactions_data, safe=False)

@api_view(['PATCH'])
def update_item_stock(request, item_id):
    try:
        item = SalesItems.objects.get(pk=item_id)
        quantity_to_decrement = int(request.data.get('quantity', 0))

        if item.item_stock >= quantity_to_decrement:
            item.item_stock -= quantity_to_decrement
            item.save()
            return Response(status=status.HTTP_200_OK)
        else:
            return Response({"detail": "Item out of stock"}, status=status.HTTP_400_BAD_REQUEST)
    except SalesItems.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)