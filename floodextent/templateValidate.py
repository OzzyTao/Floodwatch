import json
from django.template.loader import get_template
from django.template import Context
from floodextent.search import jsonGen
def testjson(address):
	temp=get_template('floodextent/property.json')
	features=jsonGen(address)
	text=temp.render(Context({"features":features,"errors":[]}))
	print text
	json.loads(text)