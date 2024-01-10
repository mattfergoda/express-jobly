# Jobly Backend

This is the RESTful API for Jobly, an application for browsing companies and job postings. Routes are protected with both user authentication and authorization using middleware. Current testing coverage is between 99-100%.

[Live Application Demo](https://jobly.demo.mattfergoda.me/)

[Frontend Code](https://github.com/mattfergoda/jobly-frontend)

## Running Locally
From the root directory of the project, run:

    npm install

Create a PostgreSQL database called `jobly`:
    
    createdb jobly

If you plan to run the projects tests, you'll also want to create a test database:

    createdb jobly_test
 
To run the development server, run:

    node server.js
    
## Tests
To run the tests:

    jest -i

To run test coverage:
    
    jest -i --coverage
