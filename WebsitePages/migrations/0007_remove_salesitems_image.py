# Generated by Django 4.2.7 on 2024-01-16 14:09

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('WebsitePages', '0006_alter_datastorage_total_price'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='salesitems',
            name='image',
        ),
    ]
