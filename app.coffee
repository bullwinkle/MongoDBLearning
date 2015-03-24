express = require('express')
app = express()

config =
	port: 8000

app.get '/', (req,res) ->
	res.send 'Hello everyone!'

app.get '*', (req,res) ->
	res.status(404).send 'Not found'

app.listen config.port, ->
	console.log "server is listening on  http://localhost:#{config.port}"