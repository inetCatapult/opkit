/*
Alarms-Bot
A SQS Alarm Querying bot that uses Opkit.

Deploy info:
set token=YOUR SLACK TOKEN HERE
node THISFILE
*/

//initialize some stuff

var Opkit = require('../index');
var Botkit = require('botkit');
var auth = new Opkit.Auth();
var Alarms = new Opkit.Alarms();
// make sure we have a Slack token

if (!process.env.token) {
	console.log('Error: Specify token in environment');
	process.exit(1);
}

var controller = Botkit.slackbot({
// set this to false if you don't want a console full of text
	debug: true
});

// start up our new bot

controller.spawn({
	token: process.env.token
}).startRTM(function(err) {
	if (err) {
		throw new Error(err);
	}
});

controller.hears(['hello','hi'],['direct_message','direct_mention','mention'],function(bot,message) {
	bot.reply(message,"Hello. Message me initialize to configure me.");
});

controller.hears(['initialize'], ['direct_message'], function(bot,message) {
	bot.startConversation(message, askRegion);
});

askRegion = function(response, convo) {
	convo.ask("To what region would you like to connect?", function(response, convo) {
		convo.say("You're querying " + response.text + ".");
		auth.updateRegion(response.text)
		askPublicKey(response, convo);
		convo.next();
	});
}
askPublicKey = function(response, convo) {
	convo.ask("What is the Access Key ID?", function(response, convo) {
		convo.say("Got that. The Access Key ID is " + response.text + ".");
		auth.updateAccessKeyId(response.text)
		askPrivateKey(response, convo);
		convo.next();
	});
}
askPrivateKey = function(response, convo) { 
	convo.ask("What is the Private Key?", function(response, convo) {
		convo.say("Got that. The Private Key is " + response.text + ".");
		auth.updateSecretAccessKey(response.text)
		convo.next();
	});
}

controller.hears(['health'], ['direct_message'], function(bot, message){
	Alarms.healthReportByState(auth)
	.then(function (data){
		bot.reply(message, data)
	}, function (data) {
		bot.reply(message, "There's been an error retrieving your data. Please"
		+ " check your credentials and try again.");
	});
});

controller.hears(['alarmnumber'], ['direct_message'], function(bot, message) {
	bot.startConversation(message, askStateNumberOfAlarms);
});

askStateNumberOfAlarms = function(response, convo) {
	convo.ask("What state would you like to retrieve data about (OK, INSUFFICIENT_DATA, or ALARM)?", function(response, convo) {
		convo.say("OK. You would like to retrieve data about state: " + response.text + ".");
		Alarms.countAlarmsByState(response.text, auth)
		.then(function (data) {
			convo.say("Number of alarms in state: " + response.text +
		    " is " + data + ".");
		}, function (data) {
			convo.say("There's been an error retrieving your data. Please"
			+ " check your credentials and try again.");
		});
		convo.next();
	});
}

controller.hears(['queryalarms'], ['direct_message'], function(bot, message) {
	bot.startConversation(message, askStateQueryAlarms);
});

askStateQueryAlarms = function(response, convo) {
	convo.ask("What state would you like to retrieve data about(OK, INSUFFICIENT_DATA, or ALARM)?", function(response, convo) {
		convo.say("OK. You would like to retrieve data about state: " + response.text + ".");
		Alarms.queryAlarmsByStateReadably(response.text, auth)
		.then(function (data) {
			convo.say(data);
		}, function (data) {
			convo.say("There's been an error retrieving your data. Please"
			+ " check your credentials and try again.");
		});
		convo.next();
	});
}

controller.hears(['help'], ['direct_message'], function(bot, message) {
	bot.startConversation(message,function(err,convo) {
		convo.say('AlarmBot Help');
		convo.say('Commands:');
		convo.say('intialize: setup AWS credentials config');
		convo.say('health: retrieves data on all alarms');
		convo.say('alarmnumber: retrieves number of alarms with indicated status');
		convo.say('queryalarms: retrieves data about alarms with indicated status');
		convo.next();
	});
});