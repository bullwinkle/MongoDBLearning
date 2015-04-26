
MongoClient = require('mongodb').MongoClient
# Routes for our application
MongoClient.connect 'mongodb://localhost:27017/school', (err, db) ->
	if err then throw err
	studends = db.collection('students')

	studends.find({}).each (err, doc) ->
		if err then throw err
		if doc is null then return true

		newScores = []
		index = 0

		if doc.scores
			doc.scores.forEach (score, i) ->
				newScores.push score
				if score.type is 'homework'
					unless lowestHomeworkScore
						lowestHomeworkScore = score.score
						index = i
					else
						if score.score < lowestHomeworkScore
							lowestHomeworkScore = score.score
							index = i

		newScores.splice index, 1

		query =
			_id: doc._id

		update =
			$set:
				scores: newScores

		options = {}

		studends.update query, update, options, (err, object ) ->
			if err
				console.error err
				throw err

			if object
				console.log object

