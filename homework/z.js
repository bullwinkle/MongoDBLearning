use zips

схема:
db.zips.findOne()
{
	"_id" : "35006",
	"city" : "ADGER",
	"loc" : [
		-87.167455,
		33.434277
	],
	"pop" : 3205,
	"state" : "AL"
}


запрос:
db.zips.aggregate([
	{
		$project: {
			pop: 1,
			first_char: {
				$substr: [ '$city',0,1]
			}
		}
	}, 
	{
		$match: {
			first_char: {
				$regex: /^[0-9]/
			}
		}
	},
	{
		$group: {
			_id:null,
			pop_sum: {
				$sum:  '$pop'
			}
		}
	}
])