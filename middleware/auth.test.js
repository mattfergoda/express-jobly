"use strict";

const jwt = require("jsonwebtoken");
const { UnauthorizedError } = require("../expressError");
const {
  authenticateJWT,
  ensureLoggedIn,
  ensureAdmin,
  ensureCorrectUserOrAdmin
} = require("./auth");


const { SECRET_KEY } = require("../config");
const testJwt = jwt.sign({ username: "test", isAdmin: false }, SECRET_KEY);
const badJwt = jwt.sign({ username: "test", isAdmin: false }, "wrong");


function next(err) {
  if (err) throw new Error("Got error from middleware");
}


describe("authenticateJWT", function () {
  test("works: via header", function () {
    const req = { headers: { authorization: `Bearer ${testJwt}` } };
    const res = { locals: {} };
    authenticateJWT(req, res, next);
    expect(res.locals).toEqual({
      user: {
        iat: expect.any(Number),
        username: "test",
        isAdmin: false,
      },
    });
  });

  test("works: no header", function () {
    const req = {};
    const res = { locals: {} };
    authenticateJWT(req, res, next);
    expect(res.locals).toEqual({});
  });

  test("works: invalid token", function () {
    const req = { headers: { authorization: `Bearer ${badJwt}` } };
    const res = { locals: {} };
    authenticateJWT(req, res, next);
    expect(res.locals).toEqual({});
  });
});


describe("ensureLoggedIn", function () {
  test("works", function () {
    const req = {};
    const res = { locals: { user: { username: "test" } } };

    expect(ensureLoggedIn(req, res, next)).toEqual(undefined);
  });

  test("unauth if no login", function () {
    const req = {};
    const res = { locals: {} };
    expect(() => ensureLoggedIn(req, res, next))
        .toThrow(UnauthorizedError);
  });

  test("unauth if no valid login", function () {
    const req = {};
    const res = { locals: { user: { } } };
    expect(() => ensureLoggedIn(req, res, next))
        .toThrow(UnauthorizedError);
  });
});


describe("ensureAdmin", function(){
  test("works: is_admin true", function () {
    const req = {};
    const res = { locals: { user : { username: "testAdmin", isAdmin: true } } };

    // if no error, undefined
    // ensureAdmin(req, res, next);
    expect(ensureAdmin(req, res, next)).toEqual(undefined);
  });

  test("401 is_admin false", function () {
    const req = {};
    const res = { locals: { user : { username: "testAdmin", isAdmin: false } } };

    expect(() => ensureAdmin(req, res, next)).toThrow(UnauthorizedError);
  });

  test("401 is_admin missing", function () {
    const req = {};
    const res = { locals: { user : { username: "testAdmin"} } };

    expect(() => ensureAdmin(req, res, next)).toThrow(UnauthorizedError);
  });
})

describe("ensureCorrectUserOrAdmin", function(){
  test("works: is_admin true", function () {
    const req = { params: { username: "testNonAdmin" } };
    const res = { locals: { user : { username: "testAdmin", isAdmin: true } } };

    // if no error, undefined
    expect(ensureCorrectUserOrAdmin(req, res, next)).toEqual(undefined);
  });

  test("works: non-admin accessing themselves", function () {
    const req = { params: { username: "testNonAdmin" } };
    const res = { locals: { user : { username: "testNonAdmin", isAdmin: false } } };

    // if no error, undefined
    expect(ensureCorrectUserOrAdmin(req, res, next)).toEqual(undefined);
  });

  test("401 is_admin false and accessing other user", function () {
    const req = { params: { username: "someone-else" } };
    const res = { locals: { user : { username: "testNonAdmin", isAdmin: false } } };

    expect(() => ensureAdmin(req, res, next)).toThrow(UnauthorizedError);
  });

  test("401 is_admin missing", function () {
    const req = {};
    const res = { locals: { user : { username: "testAdmin"} } };

    expect(() => ensureAdmin(req, res, next)).toThrow(UnauthorizedError);
  });
})