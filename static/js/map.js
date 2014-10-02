function WMSLayer(name,minZoom){
	minZoom = typeof minZoom !== 'undefined' ? minZoom : 0;
	return L.tileLayer.wms("http://localhost:55555/geoserver/flood/wms",{
		layers:"flood:"+name,
		format:'image/png',
		transparent:true,
		minZoom: minZoom,
		maxZoom: 21
	});
}
var map;
var jsonLayer=L.geoJson();     //Single parcel
var recurrence_interval = [5,10,20,30,50,100,200,500,1000];
var extent_cache = [];
// var popup = new $.Popup();
var default_extent=20;

map=L.map('map',{
	maxBounds:L.latLngBounds(L.latLng(-39.47013,140.29541),L.latLng(-33.81567,150.95215)),
	minZoom:6,
	maxZoom:19,
}).setView([-37.8,144.9],11);

var osm=L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png',{
	attribution:'OpenStreetMap',
	maxNativeZoom:18
	}).addTo(map);

var historicEventLayer=L.layerGroup().addTo(map); 

extent_cache[recurrence_interval.indexOf(default_extent)] = WMSLayer("extent_"+default_extent+"y_ari");
var modeled_extent_layer=L.layerGroup().addLayer(extent_cache[recurrence_interval.indexOf(default_extent)]).addTo(map);


var extent_floodway = WMSLayer("floodway",13).addTo(map);

// var merged_history_extent = WMSLayer("merged_history_extent").addTo(map);

var properties_layer = L.layerGroup([WMSLayer("vmprop_property_mp",18),WMSLayer("address",17)]).addTo(map);

var layer_control=L.control.layers({Base:osm},{"Floodway":extent_floodway,"Property":properties_layer,"Modeled Flood extent":modeled_extent_layer}).addTo(map);
// layer_control.removeLayer(extent_floodway);
var searchBox = L.Control.extend({
	options:{
		position:'topleft'
	},
	onAdd:function(map){
		var container = L.DomUtil.create('div','address');
		var form = $('<form class="address" method="post" action="/app/address/">'+csrf+'<input type="text" name="query" value="" id="query" placeholder="Address..."  required/><input type="submit" name="submit" id="Search" value="Search"/><br/></form>');
		var info=$('<ul id="info"></ul>');
		var choice = $('<ol id="choice"></ol>');
		$(container).append(form).append(info).append(choice);
		L.DomUtil.enableTextSelection();
		L.DomEvent.disableClickPropagation(container);
		return container;
	}
});
var mySearchBox=map.addControl(new searchBox());

var slideBar = L.Control.extend({
	options:{
		position:'bottomleft'
	},
	onAdd:function(map){
		var container = L.DomUtil.create('div','model');
		var select=$('<select name="recurrence" id="recurrence"></select>');
		for (var i=0; i<recurrence_interval.length; i++){
			select.append($('<option>'+recurrence_interval[i]+'</option>'));
		}
		var form = $('<form id="model"></form>');
		form.append($('<label for="recurrence">Average Recurrence Interval (years)</label>'));
		form.append(select);
		$(container).append(form);
		L.DomUtil.enableTextSelection();
		L.DomEvent.disableClickPropagation(container);
		return container;
	}
});
var mySlideBar = map.addControl(new slideBar());

var IncidentList = L.Control.extend({
	options:{
		position:'bottomleft'
	},
	onAdd:function(map){
		var container = L.DomUtil.create('div','history');
		$(container).attr('id','history-container');
		var content = $('<div id="content" class="ui-widget-content ui-corner-all hidden"></div>');
		content.append($('<h4 class="ui-widget-header ui-corner-all">Historic Flood Events</h4>')).append($('<p id="history-tips">A specific property need to be selected.</p>')).append($('<ol id="history"></ol>'));
		var Icon =$('<div id="historyIcon"></div>');
		Icon.click(function(){
			content.toggle('slide');
		});
		$(container).append(content).append(Icon);
		L.DomUtil.enableTextSelection();
		L.DomEvent.disableClickPropagation(container);
		return container;
	}
});
var myEventsList = map.addControl(new IncidentList());
// Test functions
// map.on('zoomend',function(event){
// 	console.log("Scale"+map.getZoom());
// });