'use strict';
const commandLineArgs = require('command-line-args');

const options = commandLineOptions();

const baseUrl = `https://${options.team}.atlassian.net/rest/api/latest`;
const user = options.user;
const auth = `Basic ${new Buffer(`${options.user}:${options.password}`).toString('base64')}`;
const timestamp = new Date(options.initialDate).getTime();

module.exports = { baseUrl, user, auth, timestamp };

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
