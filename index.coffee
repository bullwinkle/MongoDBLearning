MongoClient = require('mongodb').MongoClient

MongoClient.connect 'mongodb://localhost:27017/test', (err,db) ->
	if (err) then throw err

	db.collection('test').findOne {}, (err,doc) ->
		if (err) then throw err

		console.dir doc

		db.close()