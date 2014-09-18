
function clear_address(){
	// $('div.history').css('display','none');
	$('#history-tips').empty();
	$('#info').empty();
	if(map.hasLayer(jsonLayer)){
		map.removeLayer(jsonLayer);
	}
	return $('#choice').empty();
}

function modeled_extent(index){
	layer_control.removeLayer(modeled_extent_layer);
	modeled_extent_layer.clearLayers();
	if (extent_cache[index]==undefined){
		var layer_name = "extent_"+recurrence_interval[index]+"y_ari";
		extent_cache[index]=WMSLayer(layer_name);
	}
	modeled_extent_layer.addLayer(extent_cache[index]);
	layer_control.addOverlay(modeled_extent_layer,'Modeled Flood extent');
}

function draw_parcel(response){
	jsonLayer=L.geoJson(response["result"],{
		style:function(feature){
			return {color:"#FFFF33"};
		},
		onEachFeature:function(feature,layer){
			// var popupDiv = $('<div></div>');
			// popupDiv.attr('id','popupdiv');
			// popupDiv.append("<b>"+feature.properties.address+"</b>");
			var popupDiv = "<div class='popupdiv'><b>"+feature.properties.address+"</b><br/><button type='button' id='history_button'>Flood History</button><button type='button' id='report_button'>Full Report</button></div>";
			var addressPopup=L.popup({closeButton:true}).setContent(popupDiv);
			layer.bindPopup(addressPopup);
			$('#map').on('click','#history_button',function(){
				histories_request(feature["properties"]["id"]);
			}).on('click','#report_button',function(){
				var popup = new $.Popup();
				popup.open('/app/report/'+feature["properties"]["id"]+'/html/');
				// $('#report').popup();
				// var popup = $('a.popup').data('popup');
				// popup.open('/app/report/1/html/');
			});
			// layer.on("mouseover",function(e){
			// 	layer.openPopup(layer.getBounds().getCenter());
			// }).on("mouseout",function(e){
			// 	addressPopup._close();
			// }).on('click',function(e){
			// 	histories_request(feature["properties"]["id"]);
			// });
		}
	}).addTo(map);
	map.fitBounds(jsonLayer.getBounds(),{maxZoom:18});
	$('#choice li').click(function(){
		map.fitBounds(jsonLayer.getBounds(),{maxZoom:18});
		jsonLayer.openPopup();
	});
}

function add_error_or_result(response){
	clear_address();
	if (response['error']!=undefined){
		var errors=$('#info');
		errors.append('<li>'+response['error']+'</li>');
	}
	else{
		var choice=$('#choice');
		choice.append('<li>'+response['result']['features'][0]['properties']['address']+'</li>');
		draw_parcel(response);
	}
}

function histories_request(property_id){
	$.ajax('/app/history/',{
		type:'GET',
		data:{'property_id':property_id},
		dataType:'json',
		success:function(response){
			var histories=$('#history').empty();
			if(response.length==0){
				$('#history-tips').html('<span style="color:green;">This property has never been inundated before.</span>');
			}
			for(var i=0; i<response.length;i++){
				var newItem = $('<li>'+response[i]['start_date']+'</li>');
				newItem.addClass('ui-widget-content');
				histories.append(newItem);
			}
			$('#content').toggle(true);
		}
	});
}

$(document).ready(function(){
	$('form.address').submit(function(event){
		event.preventDefault();
		var form=$(this);
		var postData=form.serialize();
		$.ajax(form.attr('action'),{
			type:'POST',
			data:postData,
			dataType:'json',
			success: function(response){
				if(response['results']!=undefined){
					var choice=clear_address();
					var features = response['results'];
					for(var i=0;i<features.length; i++){
						var feature=features[i];
						var liItem=$("<li></li>");
						liItem.html(feature['formatted_address']);
						liItem.addClass("choice");
						// liItem.addClass("ui-widget-class");
						liItem.data("lat",feature['location']['lat']).data('lng',feature['location']['lng']);
						liItem.data("postcode",feature['postcode']).data('formatted_address',feature['formatted_address']);
						choice.append(liItem);
					}
					// $(function(){$('#choice').selectable();});
				}
				else{
					add_error_or_result(response);
				}
			},
			error:function(jqXHR, textStatus, error){
				console.log(textStatus+' '+error);
			}
		});
	});
	$('#choice').on('click','li.choice',function(event){
		var requestData=$(this).data();
		$.ajax('/app/address/',{
			type:'GET',
			data:requestData,
			dataType:'json',
			success:add_error_or_result
		});
	});
	$('#history').selectable({
		selected:function(event,ui){
			if($(ui['selected']).data('layer')==undefined){
				var date = $(ui['selected']).text();
				$.ajax('/app/history/list/',{
					type:'GET',
					data:{'date':date},
					dataType:'json',
					success:function(response){
						var layer=L.geoJson(response,{
							style: function(feature){
								return {'color':"#FF0000"};
							}
						});
						$(ui['selected']).data('layer',layer);
						historicEventLayer.addLayer(layer);
					}
				});
			}else{
				historicEventLayer.addLayer($(ui['selected']).data('layer'));
			}
		},
		unselected:function(event,ui){
			if($(ui['unselected']).data('layer')!=undefined){
				historicEventLayer.removeLayer($(ui['unselected']).data('layer'));
			}
		}
	});
	(function(){
		var select = $("#recurrence");
		select[0].selectedIndex=recurrence_interval.indexOf(default_extent);
		var slider = $("<div id='slider'></div>").insertAfter(select).slider({
			min:0,
			max:recurrence_interval.length-1,
			range:'min',
			value:select[0].selectedIndex,
			slide: function(event,ui){
				select[0].selectedIndex = ui.value;
				modeled_extent(ui.value);
			}
		});

		select.change(function(){
			slider.slider("value",this.selectedIndex);
			modeled_extent(this.selectedIndex);
		});
	})();
});