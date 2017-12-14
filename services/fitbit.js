var request = require('request');
var today = new Date();
var yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, -1);

function sleep_callback(error, response, body) {
	var minutes = seconds = 0;
	if (!error && response.statusCode == 200) {
		var info = JSON.parse(body);
		minutes = info.sleep[0].minutesAsleep;

		if(minutes > 0)
		{
			seconds = minutes * 60;
			
			var time = new Date(info.sleep[0].endTime.substring(0, (info.sleep[0].endTime.length - 4)));
			// the time is sent in user's timezone, but processd as GMT so we need to add the timezone offset
			time.setHours(time.getHours() - process.env.TIMEZONE_OFFSET);

			var options = {
				url: 'https://api.nomie.io/v2/push/'+process.env.NOMIE_KEY+'/action=track/label='+process.env.FITBIT_NOMIE_SLEEP+'/value='+seconds+'/time='+time.getTime()
			}
			// console.log(options.url);
			request(options);

			var steps_options = {
				url: 'https://api.fitbit.com/1/user/-/activities/date/'+today.getFullYear()+'-'+(today.getMonth() + 1)+'-'+(today.getDate() - 1)+'.json',
				headers: {
					'accept': 'application/json',
					'authorization': 'Bearer '+process.env.FITBIT_SECRET
				}
			};
			request(steps_options, steps_callback);

			var hr_options = {
				url: 'https://api.fitbit.com/1/user/-/activities/heart/date/today/1d.json',
				headers: {
					'accept': 'application/json',
					'authorization': 'Bearer '+process.env.FITBIT_SECRET
				}
			};
			request(hr_options, hr_callback);
		}
	}
}

function steps_callback(error, response, body) {
	if (!error && response.statusCode == 200) {
		var info = JSON.parse(body);

		var options = {
			url: 'https://api.nomie.io/v2/push/'+process.env.NOMIE_KEY+'/action=track/label='+process.env.FITBIT_NOMIE_STEPS+'/value='+info.summary.steps+'/time='+yesterday.getTime()
		}
		request(options);
	}
}

function hr_callback(error, response, body) {
	if (!error && response.statusCode == 200) {
		var info = JSON.parse(body);
		var hr = info['activities-heart'][0].value.restingHeartRate;

		var options = {
			url: 'https://api.nomie.io/v2/push/'+process.env.NOMIE_KEY+'/action=track/label='+process.env.FITBIT_NOMIE_HR+'/value='+hr+'/time='+yesterday.getTime()
		}
		request(options);
	}
}

var sleep_options = {
	url: 'https://api.fitbit.com/1.2/user/-/sleep/date/'+today.getFullYear()+'-'+(today.getMonth() + 1)+'-'+today.getDate()+'.json',
	headers: {
		'accept': 'application/json',
		'authorization': 'Bearer ' + process.env.FITBIT_SECRET
	}
};
module.exports = {
	daily: function() {
		request(sleep_options, sleep_callback);
	}
}
