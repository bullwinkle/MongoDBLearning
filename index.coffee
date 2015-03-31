MongoClient = require('mongodb').MongoClient

MongoClient.connect 'mongodb://localhost:27017/weather', (err,db) ->
	if (err) then throw err

	query = {}

	projection =
		State: yes
		Temperature: yes

	options =
		skip: 0
		limit: 0
		sort: [['State',1],['Temperature', -1]]

	cursor = db.collection('data').find(query,projection,options)

	prevStateName = ''

	cursor.each (err,doc) ->
		if (err) then throw err
		if doc
			currentStateName = doc.State

			if prevStateName < currentStateName
				doc.month_high = true
				db.collection('data').update {_id: doc._id}, { $set: {'month_high':true } }, (err,updated) ->
					if (err) then return console.log 'error in updating', err
					console.log updated.toString()
			prevStateName = currentStateName
