var AWS = require('aws-sdk');
var Twitter = require('twitter');
AWS.config.update({region:'us-west-2'});

var creds = new AWS.Credentials({
	accessKeyId: <YOUR_KEY>, secretAccessKey: <YOUR_KEY>
});

var sqs = new AWS.SQS({apiVersion: '2012-11-05', credentials : creds});


var client = new Twitter({
	consumer_key: <YOUR_KEY>,
  consumer_secret: <YOUR_KEY>,
  access_token_key: <YOUR_KEY>,
  access_token_secret: <YOUR_KEY>
});
 //Pushing tweets into Amazon SQS.
 console.log("Pushing tweets to Amazon SQS now...");
 var hashtags = 'music,food,trump,ipl,clinton,phone,usa,srk,life,body,live,gym,hello';

 client.stream('statuses/filter', {track: hashtags}, function(stream) {
 	stream.on('data', function(tweet) {
  	if(tweet.geo != null) { // Insert into SQS when tweet with location is found
  		console.log("Tweet: "+tweet.text);
  		var obj = {
  			'username': tweet.user.name,
  			'text': tweet.text,
  			'location': tweet.geo
  		}  

  		var sendParams = {
  			MessageBody: JSON.stringify(obj),
  			/* required */
  			QueueUrl: 'https://sqs.us-west-2.amazonaws.com/602860532169/TwitterQueue', /* required */
  			DelaySeconds: 0,
  			MessageAttributes: {

  			}
  		};

  		sqs.sendMessage(sendParams, function(err, data) {
			if (err) console.log(err, err.stack); // an error occurred
			else    { console.log("Pushed to SQS\n");  

    }
  });

  	}
  });
 	stream.on('error', function(error) {
 		throw error;
 	});
 });

 


