### TODO
	- make configurable
	- ability for taking existing replset, if exists
###

MongoDB = require('mongodb')
MongoClient = MongoDB.MongoClient
Server = MongoDB.Server
ReplSet = MongoDB.ReplSet

CONFIG = require './config'

CP = require 'child_process'
exec = CP.exec

# "ps -ef | grep mongo" - посмпотреть процессы с mongo

log = (name='', obj={}) ->
	console.log name
	console.log obj if obj

logErr = (errName='', err={}) ->
	console.error errName
	console.error err if err


createReplica = (callback) ->
	exec CONFIG.createReplicaSet.CMD, callback

initReplica = (db, callback) ->
	db.command replSetInitiate : CONFIG.initReplicaSet, callback

connectDb = (callback) ->
	MongoClient.connect "mongodb://localhost:30001", callback

connectReplica = (callback) ->
	MongoClient.connect "mongodb://localhost:30001,localhost:30002,localhost:30003?replicaSet=rs1", callback

defaultReplicaConnectedCallback = (err, db) ->
	if err then throw err	
	log '=================== REPLICA CONNECTION SUCCESS'
	db.collections (err,list) ->
		if err
			log "DB: #{db.databaseName}", "COLLECTIONS: error" 
		else
			log "DB: #{db.databaseName}", "COLLECTIONS: #{list}" 

		db.close()

start = (callback) ->
	createReplica (err, stdout, stderr) ->
		if err then return logErr 'CREATION REPLICA ERROR', err 
		if stderr then return logErr 'CREATION REPLICA ERROR (stderr)', stderr 
		log '=================== CREATION REPLICA SUCCESS', stdout

		connectDb (err, db) ->
			if err then return logErr 'CONNECTION ERROR', err
			log '=================== DB CONNECTION SUCCESS'

			initReplica	db, (err, res) ->
				if err then return logErr '=================== REPLICA INIT ERROR', err
				log '=================== REPLICA INIT SUCCESS', res

				db.close (err, res) ->
					if err then return logErr 'CONNECTION CLOSING ERROR', err					
					log '=================== CONNECTION CLOSING SUCCESS', res

					connectReplica callback
	

start(defaultReplicaConnectedCallback) unless module.parent

module.exports = (callback) ->
	unless callback then throw 'no replicaConnectedCallback specified!!'

	start callback

