"use strict";

const { BadRequestError } = require("../expressError");


/**
 * Takes an object dataToUpdate like {firstName: 'Aliya', age: 32}
 * with data to replace existing data on the record.
 * Also take an object jsToSql like like
 * {
 *   "firstName": "first_name",
 *   "lastName": "last_name",
 *   "isAdmin": "is_admin"
 * }
 * containing keys corresponding to data attributes in camelCase and values
 * in the equivalent snake_case SQL columns.
 *
 * Returns object { setCols, values } where:
 * setCols is a string containing comma-separated SQL columns and query template
 * placeholders whose values will be updated, like:
 * ['"first_name"=$1', '"last_name"=$2'].
 * values is an array containing the corresponding new data, like:
 * ['John', 'Wick'].
 */

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  debugger;
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
      `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

module.exports = { sqlForPartialUpdate };
