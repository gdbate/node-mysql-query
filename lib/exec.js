(function() {

// Dependancies ===============

	var MysqlHelper = require('node-mysql-helper');

// Export & Variables =========

	var reservedWords = ['IS', 'INTERVAL', 'MICROSECOND', 'SECOND', 'MINUTE', 'HOUR', 'DAY', 'WEEK', 'MONTH', 'QUARTER', 'YEAR', 'SECOND_MICROSECOND', 'MINUTE_MICROSECOND', 'MINUTE_SECOND', 'HOUR_MICROSECOND', 'HOUR_SECOND', 'HOUR_MINUTE', 'DAY_MICROSECOND', 'DAY_SECOND', 'DAY_MINUTE', 'DAY_HOUR', 'YEAR_MONTH', 'MICROSECONDS', 'SECONDS', 'MINUTES', 'HOURS', 'DAYS', 'WEEKS', 'MONTHS', 'QUARTERS', 'YEARS'];
	var mathOperators = ['+', '-', '*', '/', 'DIV', '%', 'MOD'];
	var comparisonOperators = ['=', '!=', '>', '>=', '<', '<=', 'IS', 'IS NOT', '<=>', 'BETWEEN'];

// Query Build & Execution ====

	function MysqlExec(built) {
		this.q = built;
		this.query = '';
		this.values = [];
		this.tables = [];
		this.fCount = 0;
		this.error = false;
		this.lastQuery = '';
	}

// Validation =================

	MysqlExec.prototype.validField = function(value) {
		return value.match(/[^a-zA-Z0-9_.]/) == null;
	}
	MysqlExec.prototype.validNumeric = function(value) {
		var m = value.match(/^[\d]+(\.[\d]+){0,1}$/g);
		return (typeof m == 'object' && m !== null && m.indexOf(value) !== -1) ? true : false;
	}
	MysqlExec.prototype.validTable = function(value) {
		return value.match(/[^a-zA-Z0-9_]/) == null;
	}
	MysqlExec.prototype.validFunction = function(value) {
		return value.match(/[^a-zA-Z0-9_]/) == null;
	}
	MysqlExec.prototype.validComparisonOperator = function(value) {
		return (comparisonOperators.indexOf(value.toUpperCase()) !== -1) ? true : false;
	}
	MysqlExec.prototype.validMathOperator = function(value) {
		return (mathOperators.indexOf(value.toUpperCase()) !== -1) ? true : false;
	}
	MysqlExec.prototype.validReservedWord = function(value) {
		return (reservedWords.indexOf(value) !== -1) ? true : false;
	}

// Options & Execute ==========

	MysqlExec.prototype.option = function(name, value) {
		if (value)
			return this.q[name];
		this.q[name] = value;
		return this;
	}

	MysqlExec.prototype.execute = function() {
		var self = this;
		this.lastQuery = '';

		this.buildTables();
		this.buildSelect();
		this.buildJoins();
		this.buildWhere();
		this.buildGroupBy();
		this.buildHaving();
		this.buildOrderBy();
		this.buildLimitOffset();

		return MysqlHelper.query(this.query, this.values)
			.then(function(results){
				self.lastQuery = MysqlHelper.getLastQuery();
				return results;
			})
			.catch(function(err){
				console.log('error', err);
			});
	};

	MysqlExec.prototype.return = function(cb) {
		var self = this;
		this.buildTables();
		this.buildSelect();
		this.buildJoins();
		this.buildWhere();
		this.buildGroupBy();
		this.buildHaving();
		this.buildOrderBy();
		this.buildLimitOffset();

		cb(this.query, this.values);
	};

// Query Building =============

	MysqlExec.prototype.buildTables = function() {
		this.tables = [this.q.table];
		if (typeof this.q.join == 'object' && this.q.join.length) {
			for (var i in this.q.join) {
				var t = this.q.join[i].table;
				var index = t.toUpperCase().indexOf(' AS `');
				if (index !== -1 && t.lastIndexOf('`') == t.length - 1) {
					t = t.substr(index + 5, t.length - (index + 6));
				}
				this.tables.push(t);
			}
		}
	}
	MysqlExec.prototype.buildSelect = function() {
		var build = 'SELECT SQL_CALC_FOUND_ROWS';
		if (typeof this.q.fields == 'object' && this.q.fields.length) {
			for (var i in this.q.fields) {
				var current = this.parseField(this.q.fields[i]);
				build += ' ' + current.place + ' AS ' + current.as + ',';
			}
			build = build.substr(0, build.length - 1);
		} else {
			build += ' *';
		}
		this.query = build;
	}
	MysqlExec.prototype.buildJoins = function() {
		this.query += ' FROM ' + MysqlHelper.escapeId(this.q.table);
		if (typeof this.q.join == 'object' && this.q.join.length) {
			for (var i in this.q.join) {
				var t = this.q.join[i].table;
				var index = t.toUpperCase().indexOf(' AS `');
				var as = false;
				if (index !== -1 && t.lastIndexOf('`') == t.length - 1) {
					as = t.substr(index + 5, t.length - (index + 6));
					t = t.substr(0, index);
				}
				var type = 'JOIN';
				if (typeof this.q.join[i].type == 'string') {
					switch (this.q.join[i].type.toUpperCase()) {
						case 'JOIN':
						case 'INNER':
						case 'LEFT JOIN':
						case 'RIGHT JOIN':
							type = this.q.join[i].type.toUpperCase();
							break;
					}
				}
				this.query += ' ' + (this.q.join[i].type ? this.q.join[i].type.toUpperCase() : 'JOIN') + ' ' + MysqlHelper.escapeId(t) + (as ? (' AS ' + MysqlHelper.escapeId(as)) : '') + ' ON ' + this.conditions(this.q.join[i].on);
			}
		}
	}
	MysqlExec.prototype.buildWhere = function() {
		if (typeof this.q.where != 'object' || !this.q.where.length) return;
		this.query += ' WHERE ' + this.conditions(this.q.where);
	}
	MysqlExec.prototype.buildGroupBy = function() {
		if (typeof this.q.groupBy != 'object' || !this.q.groupBy.length) return;
		var build = '';
		for (var i in this.q.groupBy) {
			var current = this.parseField(this.q.groupBy[i]);
			build += ', ' + current.place;
		}
		this.query += ' GROUP BY' + build.substr(1);
	}
	MysqlExec.prototype.buildHaving = function() {
		if (typeof this.q.having != 'object' || !this.q.where.having) return;
		this.query += ' HAVING ' + this.conditions(this.q.having);
	}
	MysqlExec.prototype.buildOrderBy = function() {
		if (typeof this.q.orderBy != 'object' || !this.q.orderBy.length) return;
		var build = '';
		for (var i in this.q.orderBy) {
			var current = this.parseField(this.q.orderBy[i].field);
			build += ', ' + current.place + ' ' + (this.q.orderBy[i].sort == 'ASC' ? 'ASC' : 'DESC');
		}
		this.query += ' ORDER BY' + build.substr(1);
	}
	MysqlExec.prototype.buildLimitOffset = function() {
		if (typeof this.q.limit == 'number') {
			this.query += ' LIMIT ' + MysqlHelper.escape(this.q.limit);
			if (typeof this.q.offset == 'number') this.query += ' OFFSET ' + MysqlHelper.escape(this.q.offset);
		}
	}
	MysqlExec.prototype.conditions = function(cond) {
		if (typeof cond.length != 'undefined' && cond.length == 3 && typeof cond[0] == 'string') {
			var one = this.parseField(cond[0]);
			var operator = cond[1].toUpperCase();
			var two = this.parseField(cond[2]);
			if (['=', '!=', '>', '>=', '<', '<=', 'IS', 'IS NOT'].indexOf(operator) != -1) return '( ' + one.place + ' ' + operator + ' ' + two.place + ' )';
			else return false;
		}
		for (var type in cond) {}
		if (typeof type == 'string') {
			if (['AND', '&&', 'OR', '||', 'NOT', '!', 'XOR'].indexOf(type.toUpperCase()) != -1) {
				var build = [];
				for (var i in cond) {
					build.push(this.conditions(cond[i]));
				}
				return '( ' + build.join(' ' + type.toUpperCase() + ' ') + ' )';
			}
		}
		if (typeof cond == 'object' && typeof cond.length != 'undefined' && cond.length > 0) {
			var build = [];
			for (var i in cond) {
				build.push(this.conditions(cond[i]));
			}
			return '( ' + build.join(' AND ') + ' )';
		}
		console.log('unknown cond', cond);
	}
	MysqlExec.prototype.parseField = function(field) {
		var as = false;
		if (field == null) return {
			'type': 'null',
			place: 'NULL',
			'as': this.enterAs(as, 'null')
		};
		field = String(field).trim();
		var index = field.toUpperCase().indexOf(' AS `');
		if (index !== -1 && field.lastIndexOf('`') == field.length - 1) {
			as = field.substr(index + 5, field.length - (index + 6));
			field = field.substr(0, index);
		}
		if (field[0] == '`' && field[field.length - 1] == '`' && this.validField(field.substr(1, field.length - 2))) {
			field = field.substr(1, field.length - 2);
			return {
				'type': 'field',
				'table': this.q.table,
				'place': this.q.table + '.' + field,
				'as': this.enterAs(as, this.q.table + '.' + field)
			};
		} else if (this.validField(field) && field.split('.').length == 2) {
			field = field.split('.');
			return {
				'type': 'field',
				'table': field[0],
				'place': field[0] + '.' + field[1],
				'as': this.enterAs(as, field[0] + '.' + field[1])
			};
		} else if (field.toUpperCase() == 'NULL') {
			return {
				'type': 'null',
				place: 'NULL',
				'as': this.enterAs(as, 'null', true)
			};
		} else if (this.validReservedWord(field)) {
			return {
				'type': 'reserved',
				'place': field,
				'as': this.enterAs(as, field, true, false)
			};
		} else if (this.validMathOperator(field)) {
			return {
				'type': 'math_operator',
				'place': field,
				'as': this.enterAs(as, 'math_operator', true)
			};
		} else if (this.validNumeric(field)) { //numeric
			this.values.push(+field)
			return {
				'type': 'numeric',
				'place': '?',
				'as': this.enterAs(as, 'numeric', true)
			};
		} else if (field[0] == '(' && field[field.length - 1] == ')') {
			var walk = this.parseWalk(field.substr(1, field.length - 2).trim());
			return {
				'type': 'bracket',
				'place': '( ' + walk + ' )',
				'as': this.enterAs(as, 'bracket', true)
			};
		} else if ((index = field.indexOf('(')) !== -1 && index > 0 && field[field.length - 1] == ')' && this.validFunction(fn = field.substr(0, index))) {
			var walk = this.parseWalk(field.substr(index + 1, field.length - (index + 2)).trim());
			if (this.validFunction(fn)) return {
				'type': 'function',
				'function': fn,
				'place': fn.toUpperCase() + '( ' + walk + ' )',
				'as': this.enterAs(as, fn, true)
			};
		}
		if ((field[0] == "'" && field[field.length - 1] == "'") || (field[0] == '"' && field[field.length - 1] == '"')) field = field.substr(1, field.length - 2);
		this.values.push(field);
		return {
			'type': 'string',
			'place': '?',
			'as': this.enterAs(as, 'string', true)
		};
	}
	MysqlExec.prototype.parseWalk = function(w) {
		var brackets = 0;
		var quote = false;
		var index = 0;
		var build = '';
		var segment = '';
		while (current = w[index++]) {
			if (!brackets && quote) {
				segment += current;
				if (current == quote) {
					build += this.parseField(segment).place;
					quote = false;
					segment = '';
				}
			} else if (!brackets && (current == '"' || current == "'")) {
				quote = current;
				segment = current;
			} else if (current == '(') {
				if (brackets == 0) {
					if (segment.length > 0 && this.validFunction(segment)) {
						build += segment;
						segment = '';
					}
					segment += '(';
				} else {
					segment += '(';
				}
				brackets++;
			} else if (current == ')') {
				brackets--;
				if (brackets == 0) {
					segment += ')';
					build += this.parseField(segment.trim()).place;
					segment = '';
				} else {
					segment += ')';
				}
			} else if (!brackets && (current == ' ' || current == ',')) {
				if (segment.trim().length > 0) build += this.parseField(segment.trim()).place;
				build += current;
				segment = '';
			} else {
				segment += current;
			}
		}
		if (segment.trim().length > 0) build += this.parseField(segment.trim()).place;
		return build;
	}
	MysqlExec.prototype.enterAs = function(as, def, increment, noQuotes) {
		this.fCount++;
		return (noQuotes ? '' : '`') + (as || (def ? def : 'field') + (increment ? this.fCount : '')) + (noQuotes ? '' : '`');
	}

  MysqlExec.prototype.getLastQuery = function(){
    return this.lastQuery;
  }

	module.exports = MysqlExec;

}());
