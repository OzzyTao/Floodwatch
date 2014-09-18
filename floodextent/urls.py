from floodextent import views
from django.conf.urls import include, url, patterns 

urlpatterns = patterns('',
	url(r'^$',views.index),
	url(r'^address/$',views.address_search),
	url(r'^history/$',views.history_retrive),
	url(r'^history/list/$',views.floodInstances),
	url(r'^report/(?P<pi>\d+)/html/$',views.html_report),
	)