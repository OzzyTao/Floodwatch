class MyRouter(object):
	def db_for_read(self,model,**hints):
		if model.__class__.__name__=='HistoryExtent':
			return 'geoserver'
		return 'default'