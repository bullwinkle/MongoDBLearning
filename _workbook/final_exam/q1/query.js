use enron

// Construct a query to calculate the number of messages sent by Andrew Fastow, CFO, 
// to Jeff Skilling, the president. Andrew Fastow's email addess was andrew.fastow@enron.com. Jeff Skilling's 
// email was jeff.skilling@enron.com. 

// message.headers["From"] == "andrew.fastow@enron.com"
// message.headers["To"] == "jeff.skilling@enron.com"

// DOCUMENT EXAMPLE
// 
// {
// 	"_id" : ObjectId("4f16fc97d1e2d32371003f02"),
// 	"body" : "some text...",
// 	"filename" : "2.",
// 	"headers" : {
// 		"Content-Transfer-Encoding" : "7bit",
// 		"Content-Type" : "text/plain; charset=us-ascii",
// 		"Date" : ISODate("2001-07-30T22:19:40Z"),
// 		"From" : "reservations@marriott.com",
// 		"Message-ID" : "<32788362.1075840323896.JavaMail.evans@thyme>",
// 		"Mime-Version" : "1.0",
// 		"Subject" : "84029698 Marriott  Reservation Confirmation Number",
// 		"To" : [
// 			"ebass@enron.com"
// 		],
// 		"X-FileName" : "eric bass 6-25-02.PST",
// 		"X-Folder" : "\\ExMerge - Bass, Eric\\Personal",
// 		"X-From" : "Reservations@Marriott.com",
// 		"X-Origin" : "BASS-E",
// 		"X-To" : "EBASS@ENRON.COM",
// 		"X-bcc" : "",
// 		"X-cc" : ""
// 	},
// 	"mailbox" : "bass-e",
// 	"subFolder" : "personal"
// }


db.messages.find({
	"headers.From" : "andrew.fastow@enron.com",
	"headers.To" : "john.lavorato@enron.com"
}).length()
