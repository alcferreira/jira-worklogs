var request = require('request');
var co = require('co');
var csvWriter = require('csv-write-stream');
var fs = require('fs');
var writer = csvWriter();

// node main.js jiraTeam email password initialDate

const baseUrl = `https://${process.argv[2]}.atlassian.net/rest/api/latest`;
const email = process.argv[3];
const auth = `Basic ${new Buffer(`${process.argv[3]}:${process.argv[4]}`).toString('base64')}`;
const timestamp = new Date(process.argv[5]).getTime();

co(function *() {
	console.log('Retrieving worklogs ids...');
	let worklogs = yield getWorkLogs(timestamp);
	console.log('Qtt worklogs:', worklogs.values.length);

	console.log();
	console.log('Retrieving worklogs list');
	const listOfIds = worklogs.values.map(x => x.worklogId);
	worklogList = yield getWorkLogList(listOfIds);

	console.log();
	console.log('Processing...');

	const byUser = worklogList.filter(x => x.author.emailAddress === email);

	let totalInSeconds = 0;

	const writer = csvWriter({
		headers: ['user', 'started', 'timespent', 'timeinseconds', 'id', 'issueId', 'comment'],
		separator: ';'
	});
	writer.pipe(fs.createWriteStream('out.csv'))

	byUser.forEach(work => {
		totalInSeconds += work.timeSpentSeconds;
		writer.write([work.author.name, work.started, work.timeSpent, work.timeSpentSeconds, work.id, work.issueId, work.comment]);
	});

	writer.write([])
	writer.write(['Total', '', totalInSeconds / 60 / 60]);

	writer.end()
	console.log();
	console.log('Done. Check file out.csv');

}).catch(err => console.log('error:', err));

function getWorkLogs(timestamp) {
	return new Promise(function(resolve, reject) {
		const options = {
			url: `${baseUrl}/worklog/updated?since=${timestamp}`,
			headers: { Authorization: auth }
		};

		request(options, (error, res, body) => {
			if (error) return reject(error);
			if (res.statusCode !== 200) return reject({ status: res.statusCode, message: res.statusMessage });
			return resolve(JSON.parse(body));
		});
	});
}

function getWorkLogList(list) {
	return new Promise(function(resolve, reject) {
		const options = {
			url: `${baseUrl}/worklog/list`,
			headers: { Authorization: auth, 'Content-Type': 'application/json' },
			body: JSON.stringify({ ids: list })
		};

		request.post(options, (error, res, body) => {
			if (error) return reject(error);
			if (res.statusCode !== 200) return reject({ status: res.statusCode, message: res.statusMessage });
			return resolve(JSON.parse(body));
		});
	});
}
