mongoClient = require('mongodb').MongoClient
mongoClient.connect "mongodb://localhost:30001", (err, db) ->
	if err then throw err	
	console.log '=================== REPLICA CONNECTION SUCCESS'
	db.collections (err,list) ->
		if err
			console.log "DB: #{db.databaseName}"
			console.log "COLLECTIONS: error" 
		else
			console.log "DB: #{db.databaseName}"
			console.log "COLLECTIONS: #{list}" 

		db.close()