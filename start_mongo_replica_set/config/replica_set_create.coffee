module.exports = 
	CMD: """
		mkdir -p /data/db/rs1 /data/db/rs2 /data/db/rs3 ./log
		mongod --replSet m101 --oplogSize 64 --smallfiles --fork --logpath "log/1.log" --dbpath /data/db/rs1 --port 27017
		mongod --replSet m101 --oplogSize 64 --smallfiles --fork --logpath "log/2.log" --dbpath /data/db/rs2 --port 27018
		mongod --replSet m101 --oplogSize 64 --smallfiles --fork --logpath "log/3.log" --dbpath /data/db/rs3 --port 27019
	"""