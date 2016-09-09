'use strict';
const co = require('co');
const params = require('./params');
const jira = require('./jira');

co(function* () {
	const worklogs = yield jira.getWorkLogIds(params);

	const listOfIds = worklogs.values.map(x => x.worklogId);

	const worklogList = yield jira.getWorkLogList(params, listOfIds);

	const worklogListByUser = yield jira.getWorkLogListByUser(params, worklogList);

	yield jira.writeFile(worklogListByUser);

	console.log('Done. Check file out.csv');
})
.catch(err => console.log('ERROR', err));
