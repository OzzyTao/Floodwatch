from django.contrib.gis.db import models

# Create your models here.
class Property(models.Model):
	prop_pfi=models.CharField(max_length=20,primary_key=True,db_column='prop_pfi')
	geometry=models.MultiPolygonField()
	objects=models.GeoManager()

	def __unicode__(self):
		return str(self.geometry)

	class Meta:
		managed=False
		db_table = 'vmprop_property_mp'

class AddressPoint(models.Model):
	ogc_fid=models.AutoField(primary_key=True)
	prop=models.ForeignKey(Property,db_column='property_pfi')
	postcode=models.CharField(max_length=10)
	road_name=models.CharField(max_length=20)
	road_type=models.CharField(max_length=20)
	num_address=models.CharField(max_length=20)
	ezi_address=models.CharField(max_length=100)
	geometry=models.PointField()
	objects=models.GeoManager()
	
	def __unicode__(self):
		return str(self.ogc_fid)

	class Meta:
		managed=False
		db_table = 'address'

class HistoryExtent(models.Model):
	ogc_fid=models.AutoField(primary_key=True)
	geom=models.PolygonField(db_column='wkb_geometry')
	start_date = models.CharField(max_length=10)
	objects=models.GeoManager()

	class Meta:
		managed=False
		db_table = 'merged_history_extent'

class WaterSurface(models.Model):
	pfi=models.CharField(max_length=20,primary_key=True,db_column='pfi')
	floor_1 = models.FloatField()
	wse10 = models.FloatField()
	wse20 = models.FloatField()
	wse50 = models.FloatField()
	wse100 =models.FloatField()

	class Meta:
		managed = False
		db_table ='wse100points'

class Depth(models.Model):
	gid = models.AutoField(primary_key=True,db_column='gid')
	prop_pfi = models.CharField(max_length=20)
	ari = models.IntegerField()
	geom = models.MultiPolygonField()
	area = models.FloatField()
	minimum = models.FloatField(db_column='min')
	maximum = models.FloatField(db_column='max')
	mean = models.FloatField()
	objects = models.GeoManager()

	def __unicode__(self):
		return self.prop_pfi+'  '+str(self.ari)

	class Meta:
		managed=False
		db_table = 'depth'

