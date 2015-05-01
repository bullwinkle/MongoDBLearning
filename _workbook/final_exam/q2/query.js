use enron

// DOC EXAMPLE
// {
// 	"_id" : ObjectId("4f16fc97d1e2d32371003f3b"),
// 	"body" : "http://www.denverpost.com/broncos/brnx0408sa.htm",
// 	"filename" : "1039.",
// 	"headers" : {
// 		"Content-Transfer-Encoding" : "7bit",
// 		"Content-Type" : "text/plain; charset=us-ascii",
// 		"Date" : ISODate("2001-04-09T15:28:00Z"),
// 		"From" : "eric.bass@enron.com",
// 		"Message-ID" : "<17405360.1075854772109.JavaMail.evans@thyme>",
// 		"Mime-Version" : "1.0",
// 		"Subject" : "",
// 		"To" : [
// 			"matthew.lenhart@enron.com"
// 		],
// 		"X-FileName" : "ebass.nsf",
// 		"X-Folder" : "\\Eric_Bass_Jun2001\\Notes Folders\\Sent",
// 		"X-From" : "Eric Bass",
// 		"X-Origin" : "Bass-E",
// 		"X-To" : "Matthew Lenhart",
// 		"X-bcc" : "",
// 		"X-cc" : ""
// 	},
// 	"mailbox" : "bass-e",
// 	"subFolder" : "sent"
// }

db.messages.aggregate([
	{
		$unwind: "$headers.To"
	},
	{
		$group: {
			_id: {
				id: "$_id",
				from: "$headers.From",
				to: "$headers.To"
			}
		}
	},
	{
		$group: {
			_id: {
				from: "$_id.from",
				to: "$_id.to"
			},
			count: {
				$sum:1
			}
		}
	},
	{
		$sort: {
			count: -1
		}
	}

], {allowDiskUse: true}).pretty()
