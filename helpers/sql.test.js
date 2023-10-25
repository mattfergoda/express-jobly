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


