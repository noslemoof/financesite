# Generated by Django 4.2.7 on 2023-12-12 14:39

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('WebsitePages', '0002_salesitems_item_stock'),
    ]

    operations = [
        migrations.AddField(
            model_name='salesitems',
            name='image',
            field=models.ImageField(default=0, upload_to='images/'),
            preserve_default=False,
        ),
    ]