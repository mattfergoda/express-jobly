"use strict";

const { sqlForFilter } = require("./companies");
const { BadRequestError } = require("../expressError");

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
      `WHERE \"name\" ILIKE '%' || $1 || '%' AND \"num_employees\" >= $2 AND \"num_employees\" <= $3`,
      "values": ["net", 1, 100]
    });
  });

  test("works only nameLike", function () {
    const result = sqlForFilter(
      {
        nameLike: "net",
    });

    expect(result).toEqual({
      "whereClause": `WHERE \"name\" ILIKE '%' || $1 || '%'`,
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
      `WHERE \"num_employees\" >= $1 AND \"num_employees\" <= $2`,
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