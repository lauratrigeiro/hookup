var uuid = require('node-uuid');

function uuid_generator()
{
	var out = uuid.v4();
	return out.replace(/-/g, '');
}

exports.uuid = uuid_generator;
