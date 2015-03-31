###
    DEPS
###
express = require('express')
consolidate = require('consolidate')
MongoClient = require('mongodb').MongoClient
Server = require('mongodb').Server
app = express()

###
    CONFIG
###
config =
	port: 8000

###
    DB
###
mongoclient = new MongoClient new Server 'localhost', 27017,
	'native_parser': true
db = mongoclient.db 'course'

###
    APP
###
app.engine 'html', consolidate.swig
app.set 'view engine', 'html'
app.set 'views', __dirname + '/views'

app.get '/', (req,res) ->
	res.render 'hello',
		name: 'Swig'
app.get '*', (req,res) ->
	res.status(404).send 'Not found'

app.listen config.port, ->
	console.log "server is listening on  http://localhost:#{config.port}"