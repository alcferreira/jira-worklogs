'use strict';
const co = require('co');
const params = require('./params');
const jira = require('./jira');

jira
	.getWorkLogIds(params)
	.then(result => {
		const listOfIds = result.values.map(x => x.worklogId);
		return jira.getWorkLogList(params, listOfIds);
	})
	.then(result => jira.getWorkLogListByUser(params, result))
	.then(result => jira.writeFile(result))
	.then(() => console.log('Done. Check file out.csv'))
	.catch(err => console.log('ERROR', err));
