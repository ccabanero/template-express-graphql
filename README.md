# learn-graphQL

Snippets learning GraphQL.

Notes for the course 'GraphQL with React: the Complete Developers Guide' from Udemy.


## Architecture

__Web Page__

* GraphiQL


__Express/GraphQL Server__

* Express for handling HTTP request/responses
* GraphQL library

__Data Store__

* A DB

## GraphQL with Express

We will create the above architecture.

Initialize a new npm application ...

````
npm init
````

Then install four packages ...

````
npm install --save express express-graphql graphql lodash
````

Then create server.js in project. I server.js scaffold a basic Express app ...


````
const express = require('express');

const app = express();

app.listen(4000, () => {

    console.log('Listening on port 4000');
});
````

