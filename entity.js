var Entity = function(){};

Entity.prototype.addValue = function(value){
	if(this.source === undefined){
		this.source = {
			type: typeof value,
			content: value
		}
	} else {
		this.target = {
			type: typeof value,
			content: value	
		}
	}
};

Entity.prototype.addRelation = function(relation){
	this.relation = {
		type: relation
	}
};

module.exports = {
	Entity: Entity
}