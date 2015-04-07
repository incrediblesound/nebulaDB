var Set = require('./set.js').Set;

module.exports = function(){
letters = new Set(['a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z']);
return  {
			vars: {},
			newVariable: function(){
				var result = '';
				for(var i = 0; i < 8; i++){
					result += letters.rnd();
				}
				if(this.vars[result] !== undefined){
					return this.newVariable();
				} else {
					return result;
				}
			}
		};
};