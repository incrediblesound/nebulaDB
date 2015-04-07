var Set = function(array){
	this.data = array || [];	
};
Set.prototype.contains = function(item){
	return (this.data && this.data.length) ? (this.data.indexOf(item) > -1) : false;
};
Set.prototype.get = function(idx){
	return this.data[idx];
};
Set.prototype.setData = function(array){
	this.data = array;
};
Set.prototype.append = function(set){
	return new Set(this.data.concat(set.data));
};
Set.prototype.add = function(item){
	this.data.push(item);
};
Set.prototype.rnd = function(){
	var index = Math.floor(Math.random()*this.data.length);
	return this.get(index);
}
Set.prototype.isEmpty = function(){
	return this.data.length === 0;
}

Set.prototype.print = function(){
	for(var i = 0; i < this.data.length; i++){
		console.log(this.data[i])
	}
}

module.exports = {
	Set: Set,
}