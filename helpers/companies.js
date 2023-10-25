"use strict";

const { BadRequestError } = require("../expressError");

const ALLOWED_FILTERS = {
  "nameLike": '\"name\" ILIKE',
  "minEmployees": '\"num_employees\" >=',
  "maxEmployees": '\"num_employees\" <='
};

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
// TODO: more specific name, make a static method in company class
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
  sqlForFilter,
  ALLOWED_FILTERS
};