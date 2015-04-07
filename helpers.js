exports.isNumber = isNumber; 
exports.forEach = forEach;
exports.processValue = processValue;
exports.noEmpties = noEmpties;

function isNumber(x){
	if(parseInt(x) !== parseInt(x)){
		return false;
	}
	return true;
}

function forEach(arr, fn){
	for(var i = 0; i < arr.length; i++){
		fn(arr[i], i);
	}
}

function processValue(val){
	if(isNumber(val)){
		return parseInt(val);
	} else {
		return val;
	}
}

function noEmpties(arr){
	var result = [];
	forEach(arr, function(el){
		if(!!el){
			result.push(el);
		}
	})
	return result;
}