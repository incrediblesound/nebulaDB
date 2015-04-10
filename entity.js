var Entity = function(){
	this.compound = false;
	this.current = 'source';
	this.source = [];
	this.target = [];
};

Entity.prototype.addValue = function(value){
	if(this.current === 'source' && this.compound === true){
		this.current = 'source';
	} 
	this[this.current].push({
		type: typeof value,
		content: value
	})
};

Entity.prototype.addRelation = function(relation){
	this.relation = {
		type: relation
	}
	this.current = 'target';
	this.compound = 'false';
};

Entity.prototype.makeCompound = function(){
	this.compound = true;
}

module.exports = {
	Entity: Entity
}