 use grades
 

//   db.grades.findOne()
// {
// 	"_id" : ObjectId("50b59cd75bed76f46522c34e"),
// 	"student_id" : 0,
// 	"class_id" : 2,
// 	"scores" : [
// 		{
// 			"score" : 57.92947112575566,
// 			"type" : "exam"
// 		},
// 		{
// 			"type" : "quiz",
// 			"score" : 21.24542588206755
// 		},
// 		{
// 			"type" : "homework",
// 			"score" : 68.1956781058743
// 		},
// 		{
// 			"type" : "homework",
// 			"score" : 67.95019716560351
// 		},
// 		{
// 			"type" : "homework",
// 			"score" : 18.81037253352722
// 		}
// 	]
// }




 db.grades.aggregate([
 	{
 		$unwind: '$scores'
 	},
 	{
 		$match: {
 			$or: [
 				{
 					'scores.type': 'homework'
 				},
 				{
 					'scores.type': 'exam'
 				}
 			]
 		}
 	},
 	{
 		$group: {
	 		_id: { 
	 			'student_id': '$student_id',
	 			'class_id': '$class_id' 
	 		},
 			studentAvg: {
 				$avg: '$scores.score'
 			}
 		}
 	} ,
 	{
 		$group: {
 			_id: '$_id.class_id',
 			classAvg: {
 				$avg: '$studentAvg'
 			}
 		}
 	},
 	{
 		$sort: {
 			classAvg: -1
 		}
 	}
])

