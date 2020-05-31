var FitbitApiClient = require("fitbit-node");
var moment = require('moment');
const axios = require('axios');
const fs = require('fs');
require('dotenv').config();
var fitbitConfig = require(__dirname + '/config/fitbit.js');

var client = new FitbitApiClient({clientId: process.env.fitbitClientID, clientSecret: process.env.fitbitClientSecret, apiVersion: "1.2"});

var steps, heart, sleep, timeInBed, sleepStartTime;
var renewFitbit, getSteps, getHeartRate, getSleep;

var today = moment().format('YYYY-MM-DD');
var yesterday = moment().subtract(1, 'd').format('YYYY-MM-DD');

function renewFitbit()
{
    return new Promise(function (resolve, reject) {
        client.refreshAccessToken(fitbitConfig.accessToken, fitbitConfig.refreshToken).then(results => {
            var access = fitbitConfig.accessToken = results.access_token;
            var refresh = fitbitConfig.refreshToken = results.refresh_token;
            fs.writeFile(__dirname + '/config/fitbit.js', 'var config = {accessToken : "'+access+'", refreshToken : "'+refresh+'" }; module.exports = config;', function(err) {
                if(err) {
                    console.log(err);
                    reject();
                }
            });
            console.log('renewed');
            resolve();
        }).catch(err => {
            console.log(err);
            console.log(err.context.errors);
            reject();
        });
    });
}

function getSteps() {
    return new Promise(function(resolve, reject) {
        client.get("/activities/date/"+yesterday+".json", fitbitConfig.accessToken).then(results => {
            steps = results[0].summary.steps;
            resolve();
        }).catch(err => {
            console.log(err);
            reject();
        });
    });
}

function getHeartRate() {
    return new Promise(function(resolve, reject) {
        client.get("/activities/heart/date/"+yesterday+"/1d.json", fitbitConfig.accessToken).then(results => {
            heart = results[0]['activities-heart'][0].value.restingHeartRate;
            resolve();
        }).catch(err => {
            console.log(err);
            reject();
        });
    });
}

function getSleep() {
    return new Promise(function(resolve, reject) {
        client.get("/sleep/date/"+today+".json", fitbitConfig.accessToken).then(results => {
            sleep = results[0].summary.totalMinutesAsleep;
            timeInBed = results[0].sleep[0].timeInBed;
            sleepStartTime = results[0].sleep[0].startTime;
            resolve();
        }).catch(err => {
            console.log(err);
            reject();
        });
    });
}

function updateNomie() {
    var note = "#steps("+steps+") #heart_rate("+heart+")";
    var noteSleep = "#sleep("+sleep+")";

    axios.post('https://nomieapi.com/log', {
        api_key: process.env.nomieKey,
        date: moment().subtract(1, 'd').hour(23).minute(59).second(59).toISOString(),
        note: note
    }).then(function(response){
        console.log("Add Yesterday: " + response.data.success);
    }).catch(function(error) {
        console.log(error);
    });

    setTimeout(function() {
        axios.post('https://nomieapi.com/log', {
            api_key: process.env.nomieKey,
            date: moment(sleepStartTime).add(timeInBed, 'm').format(),
            note: noteSleep
        }).then(function(response){
            console.log("Add Sleep: " + response.data.success);
        }).catch(function(error) {
            console.log(error);
        });
    }, 2000);
}

function doFitbit() {
    getSteps = getSteps();
    getHeartRate = getHeartRate();
    getSleep = getSleep();

    getSteps.then(getSleep).then(getHeartRate).then(updateNomie).catch(function(err){
        console.log(err);
    });
}

var renewFitbit = renewFitbit();
renewFitbit.then(doFitbit()).catch(function(err){
    console.log(err);
});
