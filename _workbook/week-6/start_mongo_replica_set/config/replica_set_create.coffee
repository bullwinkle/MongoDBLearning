module.exports = 
	CMD: """
		mkdir -p /data/db/rs1 /data/db/rs2 /data/db/rs3 /data/db/rs4 /data/db/rs5 ./log
		mongod --replSet rs1 --oplogSize 64 --smallfiles --fork --logpath "log/1.log" --dbpath /data/db/rs1 --port 30001
		mongod --replSet rs1 --oplogSize 64 --smallfiles --fork --logpath "log/2.log" --dbpath /data/db/rs2 --port 30002
		mongod --replSet rs1 --oplogSize 64 --smallfiles --fork --logpath "log/3.log" --dbpath /data/db/rs3 --port 30003	
		mongod --replSet rs1 --oplogSize 64 --smallfiles --fork --logpath "log/4.log" --dbpath /data/db/rs4 --port 30004	
		mongod --replSet rs1 --oplogSize 64 --smallfiles --fork --logpath "log/5.log" --dbpath /data/db/rs5 --port 30005	
	"""