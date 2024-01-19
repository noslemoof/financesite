from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from .views import DataStorageViewset, DataStorageSIViewset, SaleItemsViewset, create_transaction

router = DefaultRouter()
router.register(r'SalesItems', SaleItemsViewset, basename='SalesItems')
router.register(r'DataStorage', DataStorageViewset, basename='DataStorage')
router.register(r'DSSI', DataStorageSIViewset, basename='DSSI')

urlpatterns = [
    path('sales_report/', views.Sales_report , name='sales_report'),
    path('api/', include(router.urls)),
    path('login/', views.UserLogin, name='login'),
    path('logout/', views.UserLogout, name='logout'),
    path('items/',views.ItemPage, name='ItemPage'),
    path('cashier/', views.cashier, name='Cashier'),
    path('transaction_history/', views.transaction_history, name='transaction_history'),
    path('api/create_transaction/', create_transaction, name='create_transaction'),
    path('api/get_latest_transactions/', views.get_latest_transactions, name='get_latest_transactions'),
    path('api/get_full_transactions/', views.get_full_transactions, name='get_full_transactions'),
    path('api/delete_transaction/<int:transaction_id>/', views.delete_transaction, name='delete_transaction'),
    path('api/get_items_ds/', views.get_items_DS, name='get_items_ds'),
    path('api/update_item_stock/<int:item_id>/', views.update_item_stock, name='update_item_stock'),
]