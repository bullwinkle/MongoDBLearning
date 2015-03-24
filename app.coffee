express = require('express')
consolidate = require('consolidate')

app = express()

config =
	port: 8000

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