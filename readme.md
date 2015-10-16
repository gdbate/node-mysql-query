#node-mysql-query

A query builder and executer that works in well with [node-mysql-helper](https://github.com/gdbate/node-mysql-helper) (optional).

##Features/Goals:

* Escape everything that can't be verified
* Only 1 dependancy [node-mysql-helper](https://github.com/gdbate/node-mysql-helper) which uses [felixge's node-mysql](https://github.com/felixge/node-mysql) and [Q](https://github.com/kriskowal/q) Promises.
* Full functioning queries (except subqueries)
* Works well with simplified helper library.
* Easy to understand syntax
* Portable query builder, can run on client-side (not that you would want to)

##Need to Know

All fields must be enclosed with backticks like ``` `fieldname` ``` (referring to the base table) OR prefixed with the table name ```table.id```.

If you do not use ```AS``` the results will always be returned as ``` tablename.fieldname ```.

##Simple Example


```javascript

//must configure the MysqlHelper before using node-mysql-query

var MysqlHelper = require('node-mysql-helper');
var mysqlOptions = {
	host: 'bessie.com',
	user: 'username',
	password: 'chicken',
	database: 'dbname'
};
//pool 5 connections
MysqlHelper.connect(mysqlOptions, 5);

//now I can use node-mysql-query

var Query = require('node-mysql-query');

  var query=Query('base_table')
    .fields([
      '`id` AS `id`',
      'base_table.id AS `samething`',
      '`firt_name`',
      'table2.fieldname',
      'COUNT(table2.fieldname) AS `grouping`'
    ])
    .join('table2',['table2.idBaseTable','=','base_table.id'],'LEFT JOIN')
    .groupBy('`table2.idBaseTable`')
    .orderBy('`country_name`')
    .limit(10)
    .offset(10); //or go right into .execute()

  query.execute()
    .then(function(results){
      console.log("It's like christmas!", results);
    })
    .catch(function(err){
      console.log(err);
    });


```

##To do
* Better documentation
	* functions
	* complex where statements
	* having & grouping
* A lot more testing
