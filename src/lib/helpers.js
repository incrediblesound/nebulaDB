exports.processValue = processValue;
exports.splitQuery = splitQuery;

function isNumber(x){
	if(parseInt(x) !== parseInt(x)){
		return false;
	}
	return true;
}

function processValue(val){
	if(isNumber(val)){
		return parseInt(val);
	} else {
		return val;
	}
}

function splitQuery(query){
	if(query.length === 3){
		return query;
	} else {
		query = query[0].split(' ');
		return query;
	}
}