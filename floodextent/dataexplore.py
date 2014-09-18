import json
import urllib, urllib2
from floodextent.models import AddressPoint
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
				for part in result["address_components"]:
					if "postal_code" in part["types"]:
						postal_code=part["long_name"]
						break
				if postal_code:
					results.append({'formatted_address':result['formatted_address'],
						'location':result['geometry']['location'],
						'postcode':postal_code})
	except urllib2.URLError, e:
		print "Error when querying the Bing API: ", e
		print search_url
	return results

def jsonGen(address):
	results=search(address)
	bufferMAX=Distance(m=50)
	features=[]
	for result in results:
		googlePoint=Point(result["location"]["lng"],result["location"]["lat"])
		postcode=result["postcode"]
		vmPoint=AddressPoint.objects.filter(postcode=postcode).filter(geometry__distance_lt=(googlePoint,bufferMAX)).distance(googlePoint).order_by('distance').first()
		feature=vmPoint.prop.geometry
		features.append(feature)
	return features

