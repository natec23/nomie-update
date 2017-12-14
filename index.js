require('dotenv').config()

if(process.env.FITBIT_SECRET) {
	var fitbit = require('./services/fitbit.js');

	fitbit.daily();
}
