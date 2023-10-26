"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Job = require("./job");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe("create", function () {
  const newJob = {
    title: "new job",
    salary: 1234,
    equity: 0,
    companyHandle: "c1"
  };

  test("works", async function () {
    const job = await Job.create(newJob);
    expect(job).toEqual({
      ...newJob,
      id: job.id,
      equity: "0"
    });

    const result = await db.query(
      `SELECT id, title, salary, equity, company_handle AS "companyHandle"
           FROM jobs
           WHERE id = ${job.id}`);
    expect(result.rows).toEqual([
      {
        ...newJob,
        id: job.id,
        equity: "0",
      },
    ]);
  });

  test("bad request where company handle doesn't exist", async function () {
    try {
      const job = await Job.create({ ...newJob, companyHandle: "c8" });
      throw new Error("fail test, you shouldn't get here");
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});


/************************************** findAll */

describe("findAll", function () {
  test("works: no filter", async function () {
    let jobs = await Job.findAll();
    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: 'j1',
        salary: 100,
        equity: "0.01",
        companyHandle: "c1",
      },
      {
        id: expect.any(Number),
        title: 'j2',
        salary: 200,
        equity: null,
        companyHandle: "c2",
      },
      {
        id: expect.any(Number),
        title: 'j3',
        salary: 300,
        equity: "0",
        companyHandle: "c3",
      },
    ]);
  });
});

/************************************** get */

describe("get", function () {
  test("works", async function () {
    const jobs = await Job.findAll();
    const job = await Job.get(jobs[0].id);

    expect(job).toEqual(jobs[0]);
  });

  test("not found if no such job", async function () {
    try {
      await Job.get(-1);
      throw new Error("fail test, you shouldn't get here");
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});


/************************************** update */

describe("update", function () {
  const updateData = {
    title: "New",
    salary: 999,
    equity: 0.999
  };

  test("works", async function () {
    const jobs = await Job.findAll();
    const jobId = jobs[0].id;
    const jobCompanyHandle = jobs[0].companyHandle;

    const job = await Job.update(jobId, updateData);

    expect(job).toEqual({
      ...updateData,
      id: jobId,
      companyHandle: jobCompanyHandle,
      equity: "0.999"
    });

    const result = await db.query(
      `SELECT id, title, salary, equity, company_handle AS "companyHandle"
           FROM jobs
           WHERE id = ${jobId}`);
    expect(result.rows).toEqual([job]);
  });

  test("works: null fields", async function () {
    const jobs = await Job.findAll();
    const jobId = jobs[0].id;
    const jobCompanyHandle = jobs[0].companyHandle;

    const updateDataSetNulls = {
      title: "New",
      salary: null,
      equity: null
    };

    const job = await Job.update(jobId, updateDataSetNulls);
    expect(job).toEqual({
      id: jobId,
      companyHandle: jobCompanyHandle,
      ...updateDataSetNulls,
    });

    const result = await db.query(
      `SELECT id, title, salary, equity, company_handle AS "companyHandle"
           FROM jobs
           WHERE id = ${jobId}`);

    expect(result.rows).toEqual([job]);
  });

  test("not found if no such job", async function () {
    try {
      await Job.update(-1, updateData);
      throw new Error("fail test, you shouldn't get here");
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("bad request with no data", async function () {
    const jobs = await Job.findAll();
    const jobId = jobs[0].id;

    try {
      await Job.update(jobId, {});
      throw new Error("fail test, you shouldn't get here");
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** remove */

describe("remove", function () {

  test("works", async function () {
    const jobs = await Job.findAll();
    const jobId = jobs[0].id;

    await Job.remove(jobId);
    const res = await db.query(
        `SELECT id FROM jobs WHERE id=${jobId}`);
    expect(res.rows.length).toEqual(0);
  });

  test("not found if no such job", async function () {
    try {
      await Job.remove(-1);
      throw new Error("fail test, you shouldn't get here");
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});