const express = require("express");
const FitbitApiClient = require("fitbit-node");
const fs = require('fs');
require('dotenv').config();

const app = express();
const client = new FitbitApiClient({clientId: process.env.fitbitClientID, clientSecret: process.env.fitbitClientSecret, apiVersion: "1.2"});

var callbackUrl = 'http://localhost:3000/callback';

// redirect the user to the Fitbit authorization page
app.get("/authorize", (req, res) => {
	res.redirect(client.getAuthorizeUrl("activity heartrate nutrition sleep weight", callbackUrl));
});

// handle the callback from the Fitbit authorization flow
app.get("/callback", (req, res) => {
	// exchange the authorization code we just received for an access token
	client.getAccessToken(req.query.code, callbackUrl).then(result => {
        var access = result.access_token;
        var refresh = result.refresh_token;
        fs.writeFile(__dirname + '/config/fitbit.js', 'var config = {accessToken : "'+access+'", refreshToken : "'+refresh+'" }; module.exports = config;', function(err) {
            if(err) {
                console.log(err);
                reject();
            }
        });
        res.send('yay');
	}).catch(err => {
		res.status(err.status).send(err);
	});
});

// launch the server
app.listen(3000);

console.log('http://localhost:3000/authorize');
