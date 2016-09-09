'use strict';
const async = require('async');
const params = require('./params');
const jira = require('./jira');

async.waterfall([
	getWorkLogIds,
	getWorkLogList,
	getWorkLogListByUser,
	writeFile
], (err, result) => {
	if (err) return console.log('ERROR', err);
	console.log('Done. Check file out.csv');
});

function getWorkLogIds(done) {
	jira.getWorkLogIds(params, (error, res, body) => {
		if (error) return done(error);
		if (res.statusCode !== 200) return done({ status: res.statusCode, message: res.statusMessage});

		const worklogs = JSON.parse(body);
		const listOfIds = worklogs.values.map(x => x.worklogId);
		return done(null, listOfIds);
	});
}

function getWorkLogList(listOfIds, done) {
	jira.getWorkLogList(params, listOfIds, (error, res, body) => {
		if (error) return done(error);
		if (res.statusCode !== 200) return done({ status: res.statusCode, message: res.statusMessage});

		return done(null, JSON.parse(body));
	});
}

function getWorkLogListByUser(worklogList, done) {
	jira.getWorkLogListByUser(params, worklogList, (error, result) => done(error, result));
}

function writeFile(result, done) {
	jira.writeFile(result, (error) => done(error));
}
