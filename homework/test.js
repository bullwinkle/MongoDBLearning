use zips

db.zips.aggregate([ 
	{
		$match: {
			state:  {
				$in: ['CA','NY']
			},
			pop: {
				$gte: 25000
			}
		}
	}, 
	{
		$group: {
			_id: '$state',
			avarage: {
				$avg: '$pop'
			}
		}
	}

])