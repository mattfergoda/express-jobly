"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

const ALLOWED_FILTERS = {
  "nameLike": '\"name\" ILIKE',
  "minEmployees": '\"num_employees\" >=',
  "maxEmployees": '\"num_employees\" <='
};

/** Related functions for companies. */

class Company {
  /** Create a company (from data), update db, return new company data.
   *
   * data should be { handle, name, description, numEmployees, logoUrl }
   *
   * Returns { handle, name, description, numEmployees, logoUrl }
   *
   * Throws BadRequestError if company already in database.
   * */

  static async create({ handle, name, description, numEmployees, logoUrl }) {
    const duplicateCheck = await db.query(`
        SELECT handle
        FROM companies
        WHERE handle = $1`, [handle]);

    if (duplicateCheck.rows[0])
      throw new BadRequestError(`Duplicate company: ${handle}`);

    const result = await db.query(`
                INSERT INTO companies (handle,
                                       name,
                                       description,
                                       num_employees,
                                       logo_url)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING
                    handle,
                    name,
                    description,
                    num_employees AS "numEmployees",
                    logo_url AS "logoUrl"`, [
          handle,
          name,
          description,
          numEmployees,
          logoUrl,
        ],
    );
    const company = result.rows[0];

    return company;
  }

  /** Find all companies.
   *
   * Takes filters object like
   *
   * { nameLike [optional], minEmployees [optional], maxEmployees[optional] }
   *
   * where
   *  - nameLike is a string search term for searching by company name.
   *  - minEmployees is an integer for filtering by minimum number of
   *    employees, inclusive.
   *  - maxEmployees is an integer for filtering by maximum number of
   *    employees, inclusive.
   *
   * Returns [{ handle, name, description, numEmployees, logoUrl }, ...]
   * */

  static async findAll(filters) {
    const { whereClause, values } = this._sqlWhereClauseBuilder(filters);

    const companiesRes = await db.query(`
        SELECT handle,
               name,
               description,
               num_employees AS "numEmployees",
               logo_url      AS "logoUrl"
        FROM companies
        ${whereClause}
        ORDER BY name`,
        values);
    return companiesRes.rows;
  }

  /** Given a company handle, return data about company.
   *
   * Returns { handle, name, description, numEmployees, logoUrl, jobs }
   *   where jobs is [{ id, title, salary, equity, companyHandle }, ...]
   * TODO: Show jobs for a company
   * Throws NotFoundError if not found.
   **/

  static async get(handle) {
    const companyRes = await db.query(`
        SELECT handle,
               name,
               description,
               num_employees AS "numEmployees",
               logo_url      AS "logoUrl"
        FROM companies
        WHERE handle = $1`, [handle]);

    const company = companyRes.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    return company;
  }

  /** Update company data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {name, description, numEmployees, logoUrl}
   *
   * Returns {handle, name, description, numEmployees, logoUrl}
   *
   * Throws NotFoundError if not found.
   */

  static async update(handle, data) {
    const { setCols, values } = sqlForPartialUpdate(
        data,
        {
          numEmployees: "num_employees",
          logoUrl: "logo_url",
        });
    const handleVarIdx = "$" + (values.length + 1);

    const querySql = `
        UPDATE companies
        SET ${setCols}
        WHERE handle = ${handleVarIdx}
        RETURNING
            handle,
            name,
            description,
            num_employees AS "numEmployees",
            logo_url AS "logoUrl"`;
    const result = await db.query(querySql, [...values, handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    return company;
  }

  /** Delete given company from database; returns undefined.
   *
   * Throws NotFoundError if company not found.
   **/

  static async remove(handle) {
    const result = await db.query(`
        DELETE
        FROM companies
        WHERE handle = $1
        RETURNING handle`, [handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);
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

static _sqlWhereClauseBuilder(filters) {
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
}


module.exports = Company;
