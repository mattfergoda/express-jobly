"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");
const Job = require("../models/job");


const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1NonAdminToken,
  u2AdminToken,
  testJobs
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

const testJob = testJobs[0];
console.log("jobs.test.js testJobs=", testJobs);

/************************************** POST /jobs */

describe("POST /jobs", function () {
  const newJob = {
    title: "New",
    salary: 123,
    equity: 0.123,
    companyHandle: "c1",
  };

  test("authorized for admin users", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send(newJob)
      .set("authorization", `Bearer ${u2AdminToken}`);

    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      job: {
        ...newJob,
        id: expect.any(Number),
        equity: "0.123"
      },
    });
  });

  test("unauthorized for non-admin users", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send(newJob)
      .set("authorization", `Bearer ${u1NonAdminToken}`);
    expect(resp.statusCode).toEqual(401);
    expect(resp.body).toEqual({
      "error": {
        "message": "Unauthorized",
        "status": 401
      }
    });
  });

  test("unauthorized for anon", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send(newJob);
    expect(resp.statusCode).toEqual(401);
    expect(resp.body).toEqual({
      "error": {
        "message": "Unauthorized",
        "status": 401
      }
    });
  });

  test("bad request with missing data", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send({})
      .set("authorization", `Bearer ${u2AdminToken}`);
    expect(resp.statusCode).toEqual(400);
    expect(resp.body).toEqual({
      "error": {
        "message": [
          "instance requires property \"title\"",
          "instance requires property \"companyHandle\""
        ],
        "status": 400
      }
    });
  });

  test("bad request with invalid data", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send({
        ...newJob,
        salary: "one dollar",
      })
      .set("authorization", `Bearer ${u2AdminToken}`);
    expect(resp.statusCode).toEqual(400);
    expect(resp.body).toEqual({
      "error": {
        "message": [
          "instance.salary is not of a type(s) integer"
        ],
        "status": 400
      }
    });
  });
});

/************************************** GET /jobs */

describe("GET /jobs", function () {
  test("ok for anon: no filter", async function () {
    const resp = await request(app).get("/jobs");
    expect(resp.body).toEqual({
      jobs:
        [
          {
            id: expect.any(Number),
            title: "j1",
            salary: 1,
            equity: "0.1",
            companyHandle: "c1",
          },
          {
            id: expect.any(Number),
            title: "j2",
            salary: 2,
            equity: "0.2",
            companyHandle: "c2",
          },
          {
            id: expect.any(Number),
            title: "j3",
            salary: 3,
            equity: "0.3",
            companyHandle: "c3",
          },
          {
            id: expect.any(Number),
            title: "j4",
            salary: 4,
            equity: null,
            companyHandle: "c3",
          }
        ]
    });
  });

  test("ok for anon: with all valid filters", async function () {
    const resp = await request(app)
      .get('/jobs')
      .query(
        {
          title: '2',
          minSalary: 1,
          hasEquity: true
        });

    expect(resp.body).toEqual({
        jobs: [
          {
            id: expect.any(Number),
            title: "j2",
            salary: 2,
            equity: "0.2",
            companyHandle: "c2",
          }
        ]
    });
  });

  test("ok for anon: with only title", async function () {
    const resp = await request(app)
      .get('/jobs')
      .query(
        {
          title: 'j1',
        });

    expect(resp.body).toEqual({
      jobs:
        [
          {
            id: expect.any(Number),
            title: "j1",
            salary: 1,
            equity: "0.1",
            companyHandle: "c1",
          }
        ],
    });
  });

  test("ok for anon: with only minSalary", async function () {
    const resp = await request(app)
      .get('/jobs')
      .query(
        {
          minSalary: 2,
        });

    expect(resp.body).toEqual({
      jobs:
        [
          {
            id: expect.any(Number),
            title: "j2",
            salary: 2,
            equity: "0.2",
            companyHandle: "c2",
          },
          {
            id: expect.any(Number),
            title: "j3",
            salary: 3,
            equity: "0.3",
            companyHandle: "c3",
          },
          {
            id: expect.any(Number),
            title: "j4",
            salary: 4,
            equity: null,
            companyHandle: "c3",
          }
        ],
    });
  });

  test("ok for anon: with only hasEquity", async function () {
    const resp = await request(app)
      .get('/jobs')
      .query(
        {
          hasEquity: true,
        });

    expect(resp.body).toEqual({
      jobs:
        [
          {
            id: expect.any(Number),
            title: "j1",
            salary: 1,
            equity: "0.1",
            companyHandle: "c1",
          },
          {
            id: expect.any(Number),
            title: "j2",
            salary: 2,
            equity: "0.2",
            companyHandle: "c2",
          },
          {
            id: expect.any(Number),
            title: "j3",
            salary: 3,
            equity: "0.3",
            companyHandle: "c3",
          }
        ],
    });
  });

  test("ok for anon: with title and minSalary", async function () {
    const resp = await request(app)
      .get('/jobs')
      .query(
        {
          title: 'j',
          minSalary: 3,
        });

    expect(resp.body).toEqual({
      jobs:
        [
          {
            id: expect.any(Number),
            title: "j3",
            salary: 3,
            equity: "0.3",
            companyHandle: "c3",
          },
          {
            id: expect.any(Number),
            title: "j4",
            salary: 4,
            equity: null,
            companyHandle: "c3",
          }
        ],
    });
  });

  test("ok for anon: with minSalary and hasEquity", async function () {
    const resp = await request(app)
      .get('/jobs')
      .query(
        {
          minSalary: 2,
          hasEquity: false,
        });

    expect(resp.body).toEqual({
      jobs:
        [
          {
            id: expect.any(Number),
            title: "j2",
            salary: 2,
            equity: "0.2",
            companyHandle: "c2",
          },
          {
            id: expect.any(Number),
            title: "j3",
            salary: 3,
            equity: "0.3",
            companyHandle: "c3",
          },
          {
            id: expect.any(Number),
            title: "j4",
            salary: 4,
            equity: null,
            companyHandle: "c3",
          }
        ],
    });
  });

  test("ok for anon: with title and hasEquity", async function () {
    const resp = await request(app)
      .get('/jobs')
      .query(
        {
          title: "2",
          hasEquity: true,
        });

    expect(resp.body).toEqual({
      jobs:
        [
          {
            id: expect.any(Number),
            title: "j2",
            salary: 2,
            equity: "0.2",
            companyHandle: "c2",
          }
        ],
    });
  });

  test("return 400 error for invalid filter", async function () {
    const resp = await request(app)
      .get("/jobs")
      .query({ monkey: 3000 });
    expect(resp.body).toEqual({
      "error": {
        "message": [
          "instance is not allowed to have the additional property \"monkey\"",
        ],
        "status": 400
      }
    });
  });

  test("return 400 error for invalid title", async function () {
    const resp = await request(app)
      .get("/jobs")
      .query({ title: "fooooooooooooooooooooooooooooooooooooooooooooooooooo" });
    expect(resp.body).toEqual({
      "error": {
        "message": [
          "instance.title does not meet maximum length of 50",
        ],
        "status": 400
      }
    });
  });

  test("return 400 error for invalid minSalary", async function () {
    const resp = await request(app)
      .get("/jobs")
      .query({ minSalary: -100 });
    expect(resp.body).toEqual({
      "error": {
        "message": [
          "instance.minSalary must be greater than or equal to 0",
        ],
        "status": 400
      }
    });
  });

  test("return 400 error for invalid hasEquity", async function () {
    const resp = await request(app)
      .get("/jobs")
      .query({ hasEquity: "foo" });
    expect(resp.body).toEqual({
      "error": {
        "message": [
          "instance.hasEquity is not of a type(s) boolean",
        ],
        "status": 400
      }
    });
  });

});

/************************************** GET /jobs/:id */
describe("GET /jobs/:id", function () {

  test("works for anon", async function () {
    const testJob = testJobs[0];
    const resp = await request(app).get(`/jobs/${testJob.id}`);

    expect(resp.body).toEqual({ job: testJob });
  });

  test("not found for no such job", async function () {
    const resp = await request(app).get(`/jobs/-1`);
    expect(resp.statusCode).toEqual(404);
    expect(resp.body).toEqual({
      "error": {
        "message": "No job: -1",
        "status": 404
      }
    });
  });
});

/************************************** PATCH /jobs/:id */

describe("PATCH /jobs/:id", function () {
  // TODO: Add status code tests
  test("authorized for admin", async function () {
    const testJob = testJobs[0];
    const resp = await request(app)
      .patch(`/jobs/${testJob.id}`)
      .send({
        title: "j1-new",
      })
      .set("authorization", `Bearer ${u2AdminToken}`);
    expect(resp.body).toEqual({ job: {...testJob, title:"j1-new"} });
  });

  test("unauthorized for non-admin users", async function () {
    const testJob = testJobs[0];
    const resp = await request(app)
      .patch(`/jobs/${testJob.id}`)
      .send({
        title: "j1-new",
      })
      .set("authorization", `Bearer ${u1NonAdminToken}`);
    expect(resp.body).toEqual({
      "error": {
        "message": "Unauthorized",
        "status": 401
      }
    });
  });

  test("unauthorized for anon", async function () {
    const testJob = testJobs[0];
    const resp = await request(app)
      .patch(`/jobs/${testJob.id}`)
      .send({
        title: "j1-new",
      });
    expect(resp.statusCode).toEqual(401);
    expect(resp.body).toEqual({
      "error": {
        "message": "Unauthorized",
        "status": 401
      }
    });
  });

  test("not found on no such jobs", async function () {
    const testJob = testJobs[0];
    const resp = await request(app)
      .patch(`/jobs/-1`)
      .send({
        title: "new nope",
      })
      .set("authorization", `Bearer ${u2AdminToken}`);
    expect(resp.statusCode).toEqual(404);
    expect(resp.body).toEqual({
      "error": {
        "message": "No job: -1",
        "status": 404
      }
    });
  });

  test("bad request on companyHandle change attempt", async function () {
    const testJob = testJobs[0];
    const resp = await request(app)
      .patch(`/jobs/${testJob.id}`)
      .send({
        companyHandle: "c1-new",
      })
      .set("authorization", `Bearer ${u2AdminToken}`);
    expect(resp.statusCode).toEqual(400);
    expect(resp.body).toEqual({
      "error": {
        "message": [
          "instance is not allowed to have the additional property \"companyHandle\""
        ],
        "status": 400
      }
    });
  });

  test("bad request on invalid salary", async function () {
    const testJob = testJobs[0];
    const resp = await request(app)
      .patch(`/jobs/${testJob.id}`)
      .send({
        salary: "not-an-integer",
      })
      .set("authorization", `Bearer ${u2AdminToken}`);
    expect(resp.body).toEqual({
      "error": {
        "message": [
          "instance.salary is not of a type(s) integer"
        ],
        "status": 400
      }
    });
  });

  test("bad request on invalid equity", async function () {
    const testJob = testJobs[0];
    const resp = await request(app)
      .patch(`/jobs/${testJob.id}`)
      .send({
        equity: 2,
      })
      .set("authorization", `Bearer ${u2AdminToken}`);
    expect(resp.body).toEqual({
      "error": {
        "message": [
          "instance.equity must be less than or equal to 1"
        ],
        "status": 400
      }
    });
  });
});

/************************************** DELETE /jobs/:id */

describe("DELETE /jobs/:id", function () {
  test("works for admin", async function () {
    const testJob = testJobs[0];
    const resp = await request(app)
      .delete(`/jobs/${testJob.id}`)
      .set("authorization", `Bearer ${u2AdminToken}`);
    expect(resp.body).toEqual({ deleted: String(testJob.id) });
  });

  test("unauthorized for non-admin users", async function () {
    const testJob = testJobs[0];
    const resp = await request(app)
      .delete(`/jobs/${testJob.id}`)
      .set("authorization", `Bearer ${u1NonAdminToken}`);
    expect(resp.status).toEqual(401)
    expect(resp.body).toEqual({
      "error": {
        "message": "Unauthorized",
        "status": 401
      }
    });
  });

  test("unauthorized for anon", async function () {
    const testJob = testJobs[0];
    const resp = await request(app)
      .delete(`/jobs/${testJob.id}`)
    expect(resp.statusCode).toEqual(401);
    expect(resp.body).toEqual({
      "error": {
        "message": "Unauthorized",
        "status": 401
      }
    });
  });

  test("not found for no such job", async function () {
    const testJob = testJobs[0];
    const resp = await request(app)
      .delete(`/jobs/-1`)
      .set("authorization", `Bearer ${u2AdminToken}`);
    expect(resp.statusCode).toEqual(404);
    expect(resp.body).toEqual({
      "error": {
        "message": "No job: -1",
        "status": 404
      }
    });
  });
});