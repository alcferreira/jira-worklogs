'use strict';
const request = require('request');
const csvWriter = require('csv-write-stream');
const fs = require('fs');

module.exports = { getWorkLogIds, getWorkLogList, getWorkLogListByUser, writeFile };

function getWorkLogIds(params, cb) {
	const options = {
		url: `${params.baseUrl}/worklog/updated?since=${params.timestamp}`,
		headers: { Authorization: params.auth }
	};

	if (cb) return request(options, cb);

	return new Promise((resolve, reject) => {
		request(options, (error, res, body) => {
			if (error) return reject(error);
			if (res.statusCode !== 200) return reject({ status: res.statusCode, message: res.statusMessage });
			return resolve(JSON.parse(body));
		});
	});
}

function getWorkLogList(params, list, cb) {
	const options = {
		url: `${params.baseUrl}/worklog/list`,
		headers: { Authorization: params.auth, 'Content-Type': 'application/json' },
		body: JSON.stringify({ ids: list })
	};

	if (cb) return request.post(options, cb);

	return new Promise((resolve, reject) => {
		request.post(options, (error, res, body) => {
			if (error) return reject(error);
			if (res.statusCode !== 200) return reject({ status: res.statusCode, message: res.statusMessage });
			return resolve(JSON.parse(body));
		});
	});
}

function getWorkLogListByUser(params, list, cb) {
	try {
		const byUser = list.filter(x => x.author.emailAddress === params.user);
		if (cb) return cb(null, byUser);
		return Promise.resolve(byUser);
	} catch (e) {
		if (cb) return cb(e);
		return Promise.reject(e);
	}
}

function writeFile(data, cb) {
	try {
		let totalInSeconds = 0;
		const writer = csvWriter({
			headers: ['user', 'started', 'timespent', 'timeinseconds', 'id', 'issueId', 'comment'],
			separator: ';'
		});
		writer.pipe(fs.createWriteStream('out.csv'));

		data.forEach(work => {
			totalInSeconds += work.timeSpentSeconds;
			writer.write([
				work.author.name,
				work.started,
				work.timeSpent,
				work.timeSpentSeconds,
				work.id,
				work.issueId,
				work.comment
			]);
		});

		writer.write([]);
		writer.write(['Total', '', totalInSeconds / 60 / 60]);

		writer.end();

		if (cb) return cb();
		return Promise.resolve();
	} catch (e) {
		if (cb) return cb(e);
		return Promise.reject(e);
	}
}
