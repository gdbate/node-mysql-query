;(function() {

	// Dependancies ===============

	var Builder = require('./lib/builder');

// Library ====================

	module.exports = mysqlQuery;

	function mysqlQuery(table){
		return new Builder(table);
	}

}());
