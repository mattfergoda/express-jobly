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
  u2AdminToken
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

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
          }
        ]
    });
  });
});

/************************************** GET /companies/:handle */
describe("GET /jobs/:id", function () {

  test("works for anon", async function () {
    const jobs = await Job.findAll();
    const jobId = jobs[0].id;
    const job = await Job.get(jobId);

    const resp = await request(app).get(`/jobs/${jobId}`);

    expect(resp.body).toEqual({ job });
  });

  test("not found for no such company", async function () {
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
  test("authorized for admin", async function () {
    const jobs = await Job.findAll();
    const jobId = jobs[0].id;
    const job = await Job.get(jobId);

    console.log("job id", jobId)
    const resp = await request(app)
      .patch(`/jobs/${jobId}`)
      .send({
        title: "j1-new",
      })
      .set("authorization", `Bearer ${u2AdminToken}`);
    expect(resp.body).toEqual({ job: {...job, title:"j1-new"} });
  });
});