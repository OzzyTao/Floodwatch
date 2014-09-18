import json
import urllib, urllib2
from floodextent.models import *
from django.contrib.gis.geos import Point
from django.contrib.gis.measure import Distance
def search(address):
	api_key="AIzaSyDg1rcjBFSsIsY63m8qUQUSDr3HjbbbWpU"
	root_url="https://maps.googleapis.com/maps/api/geocode/"
	format="json"
	address=urllib.quote(address)
	search_url="{0}{1}?address={2}&key={3}".format(root_url,format,address,api_key)
	results=[]
	try:
		response = urllib2.urlopen(search_url).read()
		json_response=json.loads(response)
		if json_response['status'] == "OK":
			for result in json_response['results']:
				postal_code=""
				state=""
				for part in result["address_components"]:
					if "postal_code" in part["types"]:
						postal_code=part["long_name"]
					if "administrative_area_level_1" in part["types"]:
						state=part["short_name"]
				if postal_code and state=='VIC':
					results.append({'formatted_address':result['formatted_address'],
						'location':result['geometry']['location'],
						'postcode':postal_code})
	except urllib2.URLError, e:
		print "Error when querying the Bing API: ", e
		print search_url
	return results

def jsonGen(result):
	bufferMAX=Distance(m=500)
	googlePoint=Point(result["location"]["lng"],result["location"]["lat"])
	postcode=result["postcode"]
	vmPoint=AddressPoint.objects.filter(postcode=postcode).filter(geometry__distance_lt=(googlePoint,bufferMAX)).distance(googlePoint).order_by('distance').first()
	feature={}
	if vmPoint:
		feature["geometry"]=vmPoint.prop.geometry.json
		feature["properties"]={"id":vmPoint.prop.prop_pfi,"address":result['formatted_address']}
	return feature

def getHistory(pfi):
	pfi=int(pfi)
	propertyParcel = Property.objects.get(prop_pfi=pfi)
	return HistoryExtent.objects.using('geoserver').filter(geom__intersects=propertyParcel.geometry)

def getEvents(date):
	date = int(date)
	events = HistoryExtent.objects.using('geoserver').filter(start_date=date)
	return events

def getWse(pfi):
	pfi=str(pfi)
	return WaterSurface.objects.filter(pfi=pfi)

def pfiToAddress(pfi):
	pfi = str(pfi)
	address=AddressPoint.objects.filter(prop=pfi)
	if address:
		return address[0].ezi_address
	else:
		return "No address"

def getDepth(pfi):
	pfi = str(pfi)
	objects = Depth.objects.filter(prop_pfi=pfi)
	statistics = []
	for record in objects:
		statistics.append([record.ari,record.maximum,record.minimum,record.mean])
	return statistics