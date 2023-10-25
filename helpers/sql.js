"use strict";

const { BadRequestError } = require("../expressError");

const ALLOWED_FILTERS = {
  "nameLike": '\"name\" ILIKE',
  "minEmployees": '\"num_employees\" >=',
  "maxEmployees": '\"num_employees\" <='
};

/**
 * Builds a SQL SET clause for updating records based on user input.
 *
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

/**
 * Builds a SQL where clause based on user input.
 *
 * Takes filters object like
 * { nameLike [optional], minEmployees [optional], maxEmployees [optional] }
 *
 * Returns object { whereClause, values }
 * Where whereClause is a string like
 * "WHERE \"name\" ILIKE '%' || $1 || '%' AND \"num_employees\" >= $2"
 * and values is an array like
 * ['company', 1, 100]]
 */

function sqlForFilter(filters) {
  const keys = filters ? Object.keys(filters) : [];

  if (keys.length === 0) {
    return {
      "whereClause": ``,
      "values": []
    };
  }

  if (filters['minEmployees'] > filters['maxEmployees']) {
    throw new BadRequestError("minEmployees must be less than maxEmployees");
  }

  const filterClause = keys.map((filter, idx) => {
    if (filter in ALLOWED_FILTERS) {
      if (filter === 'nameLike') {
        return `${ALLOWED_FILTERS[filter]} '%' || $${idx + 1} || '%'`;
      }
      return `${ALLOWED_FILTERS[filter]} $${idx + 1}`;
    }
  }
  );

  return {
    whereClause: "WHERE " + filterClause.join(" AND "),
    values: Object.values(filters),
  };
}


module.exports = {
  sqlForPartialUpdate,
  sqlForFilter,
  ALLOWED_FILTERS
};
