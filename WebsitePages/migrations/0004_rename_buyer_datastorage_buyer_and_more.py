# Generated by Django 4.2.7 on 2023-12-13 04:46

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('WebsitePages', '0003_salesitems_image'),
    ]

    operations = [
        migrations.RenameField(
            model_name='datastorage',
            old_name='Buyer',
            new_name='buyer',
        ),
        migrations.RenameField(
            model_name='datastorage',
            old_name='Date',
            new_name='date',
        ),
        migrations.RenameField(
            model_name='datastorage',
            old_name='PaymentMethod',
            new_name='payment_method',
        ),
        migrations.RemoveField(
            model_name='datastorage',
            name='SalesPerson',
        ),
        migrations.RemoveField(
            model_name='datastorage',
            name='Time',
        ),
        migrations.CreateModel(
            name='BasketItem',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('quantity', models.IntegerField(default=0)),
                ('data_storage', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='basket_items', to='WebsitePages.datastorage')),
                ('sales_item', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='WebsitePages.salesitems')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.AddField(
            model_name='datastorage',
            name='salesperson',
            field=models.ForeignKey(default=0, on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='datastorage',
            name='time',
            field=models.TimeField(auto_now_add=True, null=True, verbose_name='Time'),
        ),
    ]
