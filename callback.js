'use strict';
const params = require('./params');
const jira = require('./jira');

jira.getWorkLogIds(params, (error, res, body) => {
	checkError(error, res);

	const worklogs = JSON.parse(body);
	const listOfIds = worklogs.values.map(x => x.worklogId);

	jira.getWorkLogList(params, listOfIds, (error, res, body) => {
		checkError(error, res);

		const worklogList = JSON.parse(body);
		jira.getWorkLogListByUser(params, worklogList, (error, result) => {
			if (error) return console.log('ERROR:', error);

			jira.writeFile(result, (error, result) => {
				if (error) return console.log('ERROR:', error);

				console.log('Done. Check file out.csv');
			});
		});
	});
});

function checkError(error, res) {
	if (error) {
		console.log(error);
		process.exit(1);
	}

	if (res.statusCode !== 200) {
		console.log(res.statusCode, res.statusMessage);
		process.exit(1);
	}
}
