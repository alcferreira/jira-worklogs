var request = require('request');
var co = require('co');
var csvWriter = require('csv-write-stream');
var fs = require('fs');
var writer = csvWriter();

// process.argv[2] -> email:senha
const auth = `Basic ${new Buffer(process.argv[2]).toString('base64')}`;
// process.argv[3] -> AAAA-MM-DD
const timestamp = new Date(process.argv[3]).getTime();

co(function *() {
	console.log('Recuperando worklogs ids...');
	let worklogs = yield getWorkLogs(timestamp);
	console.log('Qtde worklogs:', worklogs.values.length);

	console.log();
	console.log('Recuperando lista de worklogs');
	const listOfIds = worklogs.values.map(x => x.worklogId);
	worklogList = yield getWorkLogList(listOfIds);

	console.log();
	console.log('Processando...');

	const byUser = worklogList.filter(x => x.author.name === 'andre.ferreira');

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
	writer.write(['Total em horas', '', totalInSeconds / 60 / 60]);

	writer.end()
	console.log();
	console.log('Done');

}).catch(err => console.log('error:', err));

function getWorkLogs(timestamp) {
	return new Promise(function(resolve, reject) {
		const options = {
			url: `https://2gather.atlassian.net/rest/api/latest/worklog/updated?since=${timestamp}`,
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
			url: `https://2gather.atlassian.net/rest/api/latest/worklog/list`,
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
