var http = require("http");
var AWS = require('aws-sdk');
AWS.config.update({region:'us-west-2'});

var creds = new AWS.Credentials({
	accessKeyId: <YOUR_KEY>, secretAccessKey: <YOUR_KEY>
});

var sqs = new AWS.SQS({apiVersion: '2012-11-05', credentials : creds});

var sns = new AWS.SNS({apiVersion: '2010-03-31',credentials : creds});

var topicArn = "arn:aws:sns:us-west-2:733784221245:PrcessedTweet";

var watson = require('watson-developer-cloud');

var alchemy_language = watson.alchemy_language({
	api_key: <YOUR_KEY>
});

var recParams = {
	QueueUrl: 'https://sqs.us-west-2.amazonaws.com/602860532169/TwitterQueue', /* required */
	MaxNumberOfMessages: 1,
	AttributeNames: [
	"All"
	],
	/* more items */
	VisibilityTimeout: 120,
	WaitTimeSeconds: 10
};


(function loop() {
	console.log("trying to fetch tweets from SQS queue...\n");
	sqs.receiveMessage(recParams, function(err, data) {
			if (err) console.log(err, err.stack); // an error occurred
			else    { 
				fetchedText = JSON.parse(data.Messages[0].Body);
				console.log("Fetched: ",JSON.parse(data.Messages[0].Body))

				var alchemyParams = {
					text: fetchedText.text,
					outputMode: 'json',
					showSourceText: 1   };

					console.log("Doing Sentimental Analysis now...\n");
					alchemy_language.sentiment(alchemyParams, function (err, response) {
						if (err) {
							console.log("Alchemy Error Occured...Moving on to next tweet\n"); // an error occurred
							process.nextTick(loop);
						}
						else {
							var sentiment = JSON.parse(JSON.stringify(response)).docSentiment;
							var message = {"default":`{"Message from Rupanta"}`, "http":`{"username": "${fetchedText.username}", "text": "${fetchedText.text}", "location": ${JSON.stringify(fetchedText.location)}, "sentiment": ${JSON.stringify(sentiment)}}`};
							var SNSParams = {
								Message: JSON.stringify(message), /* required */
								MessageStructure: 'json',
								Subject: 'Processed Tweet',
								TopicArn: 'arn:aws:sns:us-west-2:602860532169:scalableTweets'};
							sns.publish(SNSParams, function(err, data) {
								if (err) console.log(err, err.stack); // an error occurred
								else     {
							    	console.log(data);           // successful response
							    	console.log("SNS Params: "+SNSParams.Message);
							    	process.nextTick(loop);

							    }
							});
							
						}
						
					}); 
				}
			});

}());






