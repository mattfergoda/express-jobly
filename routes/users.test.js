"use strict";

const request = require("supertest");

const db = require("../db.js");
const app = require("../app");
const User = require("../models/user");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1NonAdminToken,
  u2AdminToken
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /users */

describe("POST /users", function () {
  test("works for admin users: create non-admin", async function () {
    const resp = await request(app)
        .post("/users")
        .send({
          username: "u-new",
          firstName: "First-new",
          lastName: "Last-newL",
          password: "password-new",
          email: "new@email.com",
          isAdmin: false,
        })
        .set("authorization", `Bearer ${u2AdminToken}`);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      user: {
        username: "u-new",
        firstName: "First-new",
        lastName: "Last-newL",
        email: "new@email.com",
        isAdmin: false,
      }, token: expect.any(String),
    });
  });

  test("works for admin users: create admin", async function () {
    const resp = await request(app)
        .post("/users")
        .send({
          username: "u-new",
          firstName: "First-new",
          lastName: "Last-newL",
          password: "password-new",
          email: "new@email.com",
          isAdmin: true,
        })
        .set("authorization", `Bearer ${u2AdminToken}`);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      user: {
        username: "u-new",
        firstName: "First-new",
        lastName: "Last-newL",
        email: "new@email.com",
        isAdmin: true,
      }, token: expect.any(String),
    });
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
        .post("/users")
        .send({
          username: "u-new",
          firstName: "First-new",
          lastName: "Last-newL",
          password: "password-new",
          email: "new@email.com",
          isAdmin: true,
        })
        .set("authorization", `Bearer ${u1NonAdminToken}`);;
    expect(resp.statusCode).toEqual(401);
    expect(resp.body).toEqual({
      "error": {
        "message": "Unauthorized",
        "status": 401
      }
    });
  });

  test("unauth for non-Admin", async function () {
    const resp = await request(app)
        .post("/users")
        .send({
          username: "u-new",
          firstName: "First-new",
          lastName: "Last-newL",
          password: "password-new",
          email: "new@email.com",
          isAdmin: true,
        });
    expect(resp.statusCode).toEqual(401);
    expect(resp.body).toEqual({
      "error": {
        "message": "Unauthorized",
        "status": 401
      }
    });
  });


  test("400 for duplicate user creation", async function () {
    const resp = await request(app)
        .post("/users")
        .send({
          username: "u1",
          firstName: "First-new",
          lastName: "Last-newL",
          password: "password-new",
          email: "new@email.com",
          isAdmin: false,
        })
        .set("authorization", `Bearer ${u2AdminToken}`);
    expect(resp.statusCode).toEqual(400);
    expect(resp.body).toEqual({
      "error": {
        "message": "Duplicate username: u1",
        "status": 400
      }
    });
  });

  test("bad request if missing data", async function () {
    const resp = await request(app)
        .post("/users")
        .send({
          username: "u-new",
        })
        .set("authorization", `Bearer ${u2AdminToken}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request if invalid data", async function () {
    const resp = await request(app)
        .post("/users")
        .send({
          username: "u-new",
          firstName: "First-new",
          lastName: "Last-newL",
          password: "password-new",
          email: "not-an-email",
          isAdmin: true,
        })
        .set("authorization", `Bearer ${u2AdminToken}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** GET /users */

describe("GET /users", function () {
  test("works for admin", async function () {
    const resp = await request(app)
        .get("/users")
        .set("authorization", `Bearer ${u2AdminToken}`);
    expect(resp.body).toEqual({
      users: [
        {
          username: "u1",
          firstName: "U1F",
          lastName: "U1L",
          email: "user1@user.com",
          isAdmin: false,
        },
        {
          username: "u2",
          firstName: "U2F",
          lastName: "U2L",
          email: "user2@user.com",
          isAdmin: true,
        },
        {
          username: "u3",
          firstName: "U3F",
          lastName: "U3L",
          email: "user3@user.com",
          isAdmin: false,
        },
      ],
    });
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
        .get("/users")
        .set("authorization", `Bearer ${u1NonAdminToken}`);
    expect(resp.statusCode).toEqual(401);
    expect(resp.body).toEqual({
      "error": {
        "message": "Unauthorized",
        "status": 401
      }
    });
  });

  test("unauth for non-Admin", async function () {
    const resp = await request(app)
        .get("/users");
    expect(resp.statusCode).toEqual(401);
    expect(resp.body).toEqual({
      "error": {
        "message": "Unauthorized",
        "status": 401
      }
    });
  });
});

/************************************** GET /users/:username */

describe("GET /users/:username", function () {
  test("works for admin getting other user", async function () {
    const resp = await request(app)
        .get(`/users/u1`)
        .set("authorization", `Bearer ${u2AdminToken}`);
    expect(resp.body).toEqual({
      user: {
        username: "u1",
        firstName: "U1F",
        lastName: "U1L",
        email: "user1@user.com",
        isAdmin: false,
      },
    });
  });

  test("works for non-admin getting themselves", async function () {
    const resp = await request(app)
        .get(`/users/u1`)
        .set("authorization", `Bearer ${u1NonAdminToken}`);
    expect(resp.body).toEqual({
      user: {
        username: "u1",
        firstName: "U1F",
        lastName: "U1L",
        email: "user1@user.com",
        isAdmin: false,
      },
    });
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
        .get(`/users/u1`);
    expect(resp.statusCode).toEqual(401);
    expect(resp.body).toEqual({
      "error": {
        "message": "Unauthorized",
        "status": 401
      }
    });
  });

  test("unauth for non-admin getting other user", async function () {
    const resp = await request(app)
        .get(`/users/u2`)
        .set("authorization", `Bearer ${u1NonAdminToken}`);
    expect(resp.statusCode).toEqual(401);
    expect(resp.body).toEqual({
      "error": {
        "message": "Unauthorized",
        "status": 401
      }
    });
  });


  test("not found if user not found", async function () {
    const resp = await request(app)
        .get(`/users/nope`)
        .set("authorization", `Bearer ${u2AdminToken}`);
    expect(resp.statusCode).toEqual(404);
    expect(resp.body).toEqual({
      "error": {
        "message": "No user: nope",
        "status": 404
      }
    });
  });
});

/************************************** PATCH /users/:username */

describe("PATCH /users/:username", () => {
  test("works for admin patching other user", async function () {
    const resp = await request(app)
        .patch(`/users/u1`)
        .send({
          firstName: "New",
        })
        .set("authorization", `Bearer ${u2AdminToken}`);
    expect(resp.body).toEqual({
      user: {
        username: "u1",
        firstName: "New",
        lastName: "U1L",
        email: "user1@user.com",
        isAdmin: false,
      },
    });
  });

  test("works for non-admin patching themselves", async function () {
    const resp = await request(app)
        .patch(`/users/u1`)
        .send({
          firstName: "New",
        })
        .set("authorization", `Bearer ${u1NonAdminToken}`);
    expect(resp.body).toEqual({
      user: {
        username: "u1",
        firstName: "New",
        lastName: "U1L",
        email: "user1@user.com",
        isAdmin: false,
      },
    });
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
        .patch(`/users/u1`)
        .send({
          firstName: "New",
        });
    expect(resp.statusCode).toEqual(401);
    expect(resp.body).toEqual({
      "error": {
        "message": "Unauthorized",
        "status": 401
      }
    });
  });

  test("unauth for non-admin patching other user", async function () {
    const resp = await request(app)
        .get(`/users/u2`)
        .send({
          firstName: "New",
        })
        .set("authorization", `Bearer ${u1NonAdminToken}`);
    expect(resp.statusCode).toEqual(401);
    expect(resp.body).toEqual({
      "error": {
        "message": "Unauthorized",
        "status": 401
      }
    });
  });

  test("not found if no such user", async function () {
    const resp = await request(app)
        .patch(`/users/nope`)
        .send({
          firstName: "Nope",
        })
        .set("authorization", `Bearer ${u2AdminToken}`);
    expect(resp.statusCode).toEqual(404);
    expect(resp.body).toEqual({
      "error": {
        "message": "No user: nope",
        "status": 404
      }
    });
  });

  test("bad request if invalid data", async function () {
    const resp = await request(app)
        .patch(`/users/u1`)
        .send({
          firstName: 42,
        })
        .set("authorization", `Bearer ${u2AdminToken}`);
    expect(resp.statusCode).toEqual(400);
    expect(resp.body).toEqual({
      "error": {
        "message": [
          "instance.firstName is not of a type(s) string"
        ],
        "status": 400
      }
    });
  });

  test("works: set new password", async function () {
    const resp = await request(app)
        .patch(`/users/u1`)
        .send({
          password: "new-password",
        })
        .set("authorization", `Bearer ${u2AdminToken}`);
    expect(resp.body).toEqual({
      user: {
        username: "u1",
        firstName: "U1F",
        lastName: "U1L",
        email: "user1@user.com",
        isAdmin: false,
      },
    });
    const isSuccessful = await User.authenticate("u1", "new-password");
    expect(isSuccessful).toBeTruthy();
  });

  test("bad request for username change", async function () {
    const resp = await request(app)
        .patch(`/users/u1`)
        .send({
          username: "new",
        })
        .set("authorization", `Bearer ${u2AdminToken}`);
    expect(resp.status).toEqual(400);
    expect(resp.body).toEqual({
      "error": {
        "message": [
          "instance is not allowed to have the additional property \"username\""
        ],
        "status": 400
      }
    });
  });
});

/************************************** DELETE /users/:username */

describe("DELETE /users/:username", function () {
  test("works for admin deleting other user", async function () {
    const resp = await request(app)
        .delete(`/users/u1`)
        .set("authorization", `Bearer ${u2AdminToken}`);
    expect(resp.body).toEqual({ deleted: "u1" });
  });

  test("works for non-admin deleting themselves", async function () {
    const resp = await request(app)
        .delete(`/users/u1`)
        .set("authorization", `Bearer ${u1NonAdminToken}`);
    expect(resp.body).toEqual({ deleted: "u1" });
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
        .delete(`/users/u1`);
    expect(resp.statusCode).toEqual(401);
    expect(resp.body).toEqual({
      "error": {
        "message": "Unauthorized",
        "status": 401
      }
    });
  });

  test("unauth for non-admin deleting other user", async function () {
    const resp = await request(app)
        .delete(`/users/u2`)
        .set("authorization", `Bearer ${u1NonAdminToken}`);
        expect(resp.statusCode).toEqual(401);
        expect(resp.body).toEqual({
          "error": {
            "message": "Unauthorized",
            "status": 401
          }
        });
  });

  test("not found if user missing", async function () {
    const resp = await request(app)
        .delete(`/users/nope`)
        .set("authorization", `Bearer ${u2AdminToken}`);
    expect(resp.statusCode).toEqual(404);
    expect(resp.body).toEqual({
      "error": {
        "message": "No user: nope",
        "status": 404
      }
    });
  });
});
