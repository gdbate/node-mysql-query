;(function() {

// Dependancies ===============

	var Exec = require('./exec');

// Export & Variables =========

	var reservedWords = ['IS', 'INTERVAL', 'MICROSECOND', 'SECOND', 'MINUTE', 'HOUR', 'DAY', 'WEEK', 'MONTH', 'QUARTER', 'YEAR', 'SECOND_MICROSECOND', 'MINUTE_MICROSECOND', 'MINUTE_SECOND', 'HOUR_MICROSECOND', 'HOUR_SECOND', 'HOUR_MINUTE', 'DAY_MICROSECOND', 'DAY_SECOND', 'DAY_MINUTE', 'DAY_HOUR', 'YEAR_MONTH', 'MICROSECONDS', 'SECONDS', 'MINUTES', 'HOURS', 'DAYS', 'WEEKS', 'MONTHS', 'QUARTERS', 'YEARS'];
	var mathOperators = ['+', '-', '*', '/', 'DIV', '%', 'MOD'];
	var comparisonOperators = ['=', '!=', '>', '>=', '<', '<=', 'IS', 'IS NOT', '<=>', 'BETWEEN'];

	module.exports = MysqlBuilder;

// Query Build & Execution ====

	function MysqlBuilder(table) {
		this.options = {
			table: table,
			fields: [],
			join: [],
			where: [],
			limit: false,
			offset: 0,
			groupBy: [],
			having: [],
			orderBy: [],
			as: false
		};
		return this;
	}

// Options & Execute ==========

	MysqlBuilder.prototype.option = function(name, value) {
		if (value) {
			this.options[name] = value;
			return this;
		} else return this.options[name];
	}

	MysqlBuilder.prototype.execute = function() {
		var runQuery = new Exec(this.options);
		return runQuery.execute();
	}

// Defenition =================

	MysqlBuilder.prototype.table = function(table) {
		this.options.table = table;
		return this;
	}
	MysqlBuilder.prototype.fields = function(fields) {
		if (typeof fields != 'object') fields = [fields];
		this.options.fields = this.options.fields.concat(fields);
		return this;
	}
	MysqlBuilder.prototype.join = function(table, on, type) {
		this.options.join.push({
			table: table,
			on: on,
			type: (type || 'JOIN')
		});
		return this;
	}
	MysqlBuilder.prototype.where = function(one, operator, two) {
		if (typeof one == 'object') {
			if (arguments.length == 1) {
				this.options.where.push(arguments[0]);
			} else {
				if (typeof arguments.callee != 'undefined') delete arguments.callee;
				this.options.where.push(arguments);
			}
		} else {
			this.options.where.push(this.cond(one, operator, two));
		}
		return this;
	}
	MysqlBuilder.prototype.groupBy = function(groupBy) {
		this.options.groupBy.push(groupBy);
		return this;
	}
	MysqlBuilder.prototype.having = function(one, operator, two) {
		if (typeof one == 'object') {
			if (arguments.length == 1) {
				this.options.having.push(arguments[0]);
			} else {
				if (typeof arguments.callee != 'undefined') delete arguments.callee;
				this.options.having.push(arguments);
			}
		} else {
			this.options.having.push(this.cond(one, operator, two));
		}
		return this;
	}
	MysqlBuilder.prototype.orderBy = function(field, sort, init) {
		if (!sort) sort = 'ASC';
		if (init) this.options.orderBy = [];
		this.options.orderBy.push({
			field: field,
			sort: (sort.toUpperCase() == 'ASC') ? 'ASC' : 'DESC'
		});
		return this;
	}
	MysqlBuilder.prototype.limit = function(limit) {
		this.options.limit = limit;
		return this;
	}
	MysqlBuilder.prototype.offset = function(offset) {
		this.options.offset = offset;
		return this;
	}
	MysqlBuilder.prototype.as = function(as) {
		this.options.as = as;
		return this;
	}
	MysqlBuilder.prototype.cond = function(one, operator, two) {
		return [one, operator, two];
	}
	MysqlBuilder.prototype.and = function() {
		return this.logOp('AND', arguments)
	}
	MysqlBuilder.prototype.or = function() {
		return this.logOp('OR', arguments)
	}
	MysqlBuilder.prototype.logOp = function(lo, args) {
		data = {};
		data[lo] = [];
		for (var i in args) {
			data[lo].push(args[i]);
		}
		if (typeof data[lo].callee != 'undefined') delete data[lo].callee;
		return data;
	}

}());
