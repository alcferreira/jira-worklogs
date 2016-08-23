const request = require('request');
const co = require('co');
const csvWriter = require('csv-write-stream');
const fs = require('fs');
const writer = csvWriter();
const commandLineArgs = require('command-line-args');

const options = commandLineOptions();

const baseUrl = `https://${options.team}.atlassian.net/rest/api/latest`;
const user = options.user;
const auth = `Basic ${new Buffer(`${options.user}:${options.password}`).toString('base64')}`;
const timestamp = new Date(options.initialDate).getTime();

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

	const byUser = worklogList.filter(x => x.author.emailAddress === user);

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

function commandLineOptions() {
	const cli = commandLineArgs([
		{ name: 'team', alias: 't', type: String },
	  { name: 'user', alias: 'u', type: String },
		{ name: 'password', alias: 'p', type: String },
		{ name: 'initialDate', alias: 'd', type: String }
	]);

	const options = cli.parse();

	if (!checkProp('team', options)
		|| !checkProp('user', options)
		|| !checkProp('password', options)
		|| !checkProp('initialDate', options)) {

		console.log(cli.getUsage({
			title: 'Usage',
			description: 'Please provide all the options bellow'
		}));
		process.exit();
	}

	return options;

	function checkProp(prop, obj) {
		return (prop in obj);
	}
}
