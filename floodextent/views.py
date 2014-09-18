from django.shortcuts import render, render_to_response
from django.http import JsonResponse, HttpResponse
from django.template import RequestContext
from floodextent.search import jsonGen, getHistory, getEvents, search, getWse, pfiToAddress, getDepth
from djgeojson.serializers import Serializer as GeoJSONSerializer


# Create your views here.
def index(request):
	context = RequestContext(request)
	return render_to_response('floodextent/index.html',{},context)

def address_search(request):
	if request.method=="POST" and request.POST['query']:
		results=search(request.POST['query'])
		if not results:
			return JsonResponse({'error':"No matching address!"})
		elif len(results)==1:
			searchResult=jsonGen(results[0])
			if searchResult:
				return render(request,'floodextent/property.json',{'feature':searchResult},content_type="application/json")
			else:
				return JsonResponse({'error':"No record!"})
		else:
			return JsonResponse({'results':results},safe=False)
	elif request.method=="GET":
		requestProp={}
		requestProp['postcode']=request.GET['postcode']
		requestProp['formatted_address']=request.GET['formatted_address']
		requestProp['location']={'lng':float(request.GET['lng']),'lat':float(request.GET['lat'])}
		searchResult=jsonGen(requestProp)
		if searchResult:
			return render(request,'floodextent/property.json',{'feature':searchResult},content_type="application/json")
		else:
			return JsonResponse({'error':"No record!"})


def history_retrive(request):
	historicEvents=[]
	results=[]
	if request.method == "GET":
		pfi=request.GET['property_id']
		print "pfi: "+pfi
		if pfi:
			historicEvents=getHistory(pfi)
			print historicEvents
	for event in historicEvents:
		results.append({"start_date":event.start_date})
	return JsonResponse(results,safe=False)


def floodInstances(request):
	events=[]
	if request.method == 'GET':
		date=request.GET['date']
		events=getEvents(date)
	content=GeoJSONSerializer().serialize(events)
	return HttpResponse(content,content_type="application/json")

def html_report(request,pi):
	# if request.method == "GET":
	# 	pfi = request.GET['property_id']
	# 	address = request.GET['address']
	context=RequestContext(request)
	pfi=pi
	para={}
	para["address"] = pfiToAddress(pfi)

	flood_wse=getWse(pfi)
	if flood_wse:
		para['floor_level']=flood_wse[0].floor_1
		para['wse_list']=[[10,flood_wse[0].wse10],[20,flood_wse[0].wse20],[50,flood_wse[0].wse50],[100,flood_wse[0].wse100]]
	else:
		para["floor_level"] = 0
		para["wse_list"] = []
	
	historicEvents=getHistory(pfi)
	if historicEvents:
		para["history_list"]=[event.start_date for event in historicEvents]
	else:
		para["history_list"] = []

	depth_list = getDepth(pfi)
	if depth_list:
		para["depth_list"]=depth_list
	else:
		para["depth_list"] = []

	return render_to_response('floodextent/report.html',para,context)