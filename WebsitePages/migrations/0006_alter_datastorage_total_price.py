# Generated by Django 4.2.7 on 2024-01-05 03:38

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('WebsitePages', '0005_rename_buyer_datastorage_buyer_name_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='datastorage',
            name='total_price',
            field=models.FloatField(),
        ),
    ]
