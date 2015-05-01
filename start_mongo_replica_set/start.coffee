connectToNewReplSet = require './connect_new_replica'

connectToNewReplSet (err, db) ->
	if err then throw err	
	console.log '############### REPLICA CONNECTION STARTED'
	db.collections (err,list) ->
		if err
			console.log "DB: #{db.databaseName}"
			console.log "COLLECTIONS: error" 
		else
			console.log "DB: #{db.databaseName}"
			console.log "COLLECTIONS: #{list}" 

		db.close()