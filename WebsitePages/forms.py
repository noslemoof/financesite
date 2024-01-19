# forms.py

from django import forms
from .models import DataStorage, SalesItems

class AddToBasketForm(forms.Form):
    selected_item = forms.ModelChoiceField(queryset=SalesItems.objects.all(), empty_label=None)

    def __init__(self, *args, **kwargs):
        super(AddToBasketForm, self).__init__(*args, **kwargs)
        self.fields['selected_item'].label_from_instance = self.label_from_instance

    def label_from_instance(self, obj):
        return f"{obj.item_name}"

    def clean_selected_item(self):
        selected_item = self.cleaned_data['selected_item']
        return selected_item.id if selected_item else None

    quantity = forms.IntegerField(min_value=1)

class PaymentBuyerForm(forms.ModelForm):
    class Meta:
        model = DataStorage
        fields = ['payment_method', 'buyer_name']  # Changed 'buyer' to 'buyer_name' to match the model
