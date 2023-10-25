"use strict";

const { sqlForPartialUpdate } = require("./sql");
const { BadRequestError } = require("../expressError");

const NEW_USER_DATA = {
  "firstName": "John",
  "lastName": "Wick",
  "isAdmin": true
};
const JS_TO_SQL = {
  "firstName": "first_name",
  "lastName": "last_name",
  "isAdmin": "is_admin"
};

describe("sqlForPartialUpdate", function () {
  test("works", function () {
    const result = sqlForPartialUpdate(NEW_USER_DATA, JS_TO_SQL);

    expect(result).toEqual({
      "setCols": "\"first_name\"=$1, \"last_name\"=$2, \"is_admin\"=$3",
      "values": ["John", "Wick", true]
    });
  });

  test("400 when no data is passed", function () {
    expect(() => sqlForPartialUpdate({}, JS_TO_SQL))
      .toThrow(BadRequestError);
  });

  test("Cols unchanged if no jsToSql keys are passed", function () {
    const result = sqlForPartialUpdate(NEW_USER_DATA, {});

    expect(result).toEqual({
      "setCols": "\"firstName\"=$1, \"lastName\"=$2, \"isAdmin\"=$3",
      "values": ["John", "Wick", true]
    });
  });
});


describe("sqlForFilter", function () {
  test("works all filters", function () {
    const result = sqlForFilter(
      {
        nameLike: "net",
        minEmployees: 1,
        maxEmployees: 100
    });

    expect(result).toEqual({
      "whereClause":
      `WHERE \"name\" ILIKE $1,
      \"num_employees\" >= $2,
      \"num_employees\" <= $3`,
      "values": ["net", 1, 100]
    });
  });

  test("works only nameLike", function () {
    const result = sqlForFilter(
      {
        nameLike: "net",
    });

    expect(result).toEqual({
      "whereClause": `WHERE \"name\" ILIKE $1`,
      "values": ["net"]
    });
  });

  test("works with filters minEmployees, maxEmployees", function () {
    const result = sqlForFilter(
      {
        minEmployees: 1,
        maxEmployees: 100
    });

    expect(result).toEqual({
      "whereClause":
      `WHERE \"num_employees\" >= $1,
       \"num_employees\" <= $2`,
      "values": [1, 100]
    });
  });

  test("works when no data is passed", function () {
    const result = sqlForFilter({});

    expect(result).toEqual({
      "whereClause":``,
      "values": []
    });
  });

  test("400 when minEmployees is greater than maxEmployees", function () {
    const badFilters =
      {
        minEmployees: 100,
        maxEmployees: 1
      };

    expect(() => sqlForFilter(badFilters)).toThrow(BadRequestError);
  });
});