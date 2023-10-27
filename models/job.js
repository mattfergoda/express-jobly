"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

const ALLOWED_FILTERS = {
  "title": '\"title\" ILIKE',
  "minSalary": '\"salary\" >=',
  "hasEquity": '\"equity\" >'
};

const ALLOWED_MIN_EQUITY = 0;

/** Related functions for jobs. */
class Job {

  /** Create a job (from data), update db, return new jb data.
   *
   * data should be { title, salary, equity, companyHandle }
   *
   * Returns { company } where company is like:
   * { id, title, salary, equity, companyHandle }
   *
   * Throws BadRequestError if company doesn't exist.
   * */

  static async create({ title, salary, equity, companyHandle }) {
    const companyCheck = await db.query(`
        SELECT handle
        FROM companies
        WHERE handle = $1`, [companyHandle]);

    if (companyCheck.rows.length === 0)
      throw new BadRequestError(`Company doesn't exist: ${companyHandle}`);

    const result = await db.query(`
                INSERT INTO jobs (title,
                                  salary,
                                  equity,
                                  company_handle)
                VALUES ($1, $2, $3, $4)
                RETURNING
                    id,
                    title,
                    salary,
                    equity,
                    company_handle AS "companyHandle"`, [
      title,
      salary,
      equity,
      companyHandle,
    ],
    );
    const job = result.rows[0];

    return job;
  }

  /** Find all jobs.
   *
   * Takes object like
   * { }
   *TODO: complete docstring
   * Returns [{ id, title, salary, equity, companyHandle }, ...]
   * */

  static async findAll(filters) {
    const { whereClause, values } = this._sqlWhereClauseBuilder(filters)

    // console.log("SQL Statement", `
    // SELECT id,
    //        title,
    //        salary,
    //        equity,
    //        company_handle AS "companyHandle"
    // FROM jobs
    // ${whereClause}
    // ORDER BY title`)
    const jobRes = await db.query(`
        SELECT id,
               title,
               salary,
               equity,
               company_handle AS "companyHandle"
        FROM jobs
        ${whereClause}
        ORDER BY title`,
        values);

    return jobRes.rows;
  }


  /** Given a job id, return data about job.
   * 
   * Returns { id, title, salary, equity, companyHandle }
   *
   *
   * Throws NotFoundError if not found.
   **/

  static async get(id) {
    const jobRes = await db.query(`
        SELECT id,
              title,
              salary,
              equity,
              company_handle AS "companyHandle"
        FROM jobs
        WHERE id = $1`, [id]);

    const job = jobRes.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);

    return job;
  }

  /** Update job data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: { title, salary, equity }
   *
   * Returns { id, title, salary, equity, companyHandle }
   *
   * Throws NotFoundError if not found.
   */

  static async update(id, data) {
    const { setCols, values } = sqlForPartialUpdate(
      data,
      {
        companyHandle: "company_handle",
      });
    const handleVarIdx = "$" + (values.length + 1);

    const querySql = `
        UPDATE jobs
        SET ${setCols}
        WHERE id = ${handleVarIdx}
        RETURNING
            id,
            title,
            salary,
            equity,
            company_handle AS "companyHandle"`;
    const result = await db.query(querySql, [...values, id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);

    return job;
  }

  /** Delete given job from database; returns undefined.
  *
  * Throws NotFoundError if job not found.
  **/

  static async remove(id) {
    const result = await db.query(`
          DELETE
          FROM jobs
          WHERE id = $1
          RETURNING id`, [id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);
  }

   /**
 * Builds a SQL where clause based on user input.
 *
 * Takes filters object like
 * { title [optional], minSalary [optional], hasEquity [optional] }
 *
 * Returns object { whereClause, values }
 * Where whereClause is a string like
 * "WHERE \"title\" ILIKE '%' || $1 || '%' AND \"salary\" >= $2 AND \"equity\" > 0"
 * and values is an array like
 * ['job title', 100]
 */

static _sqlWhereClauseBuilder(filters) {
  const keys = filters ? Object.keys(filters) : [];

  if (keys.length === 0) {
    return {
      "whereClause": ``,
      "values": []
    };
  }

  const values = [];
  const filterClause = keys.map((filter, idx) => {
    if (filter in ALLOWED_FILTERS) {
      if (filter === 'title') {
        values.push(filters[filter]);
        return `${ALLOWED_FILTERS[filter]} '%' || $${idx + 1} || '%'`;
      }
      if (filter === 'hasEquity'){
        if(filters[filter] === true){
          values.push(ALLOWED_MIN_EQUITY);
          return `${ALLOWED_FILTERS[filter]} $${idx + 1}`;
        } else {
          throw new Error("Should remove hasEquity in route if false.");
        }
      }
      values.push(filters[filter]);
      return `${ALLOWED_FILTERS[filter]} $${idx + 1}`;
    }
  }
  );

  return {
    whereClause: "WHERE " + filterClause.join(" AND "),
    values: values,
  };
}
}

module.exports = Job;