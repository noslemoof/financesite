# Generated by Django 4.2.7 on 2023-12-10 04:36

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('WebsitePages', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='salesitems',
            name='item_stock',
            field=models.IntegerField(default=0),
            preserve_default=False,
        ),
    ]