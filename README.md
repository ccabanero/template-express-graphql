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

Hooke up GraphQL with Express

````
const express = require('express');
const expressGraphQL = require('express-graphql');

const app = express();

app.use('/graphql', expressGraphQL({
    graphiql: true
}));

app.listen(4000, () => {

    console.log('Listening on port 4000');
});
````

Run the Express app.

````
node server.js
````

Then use Browser and navigate to:

````
http://localhost:4000/graphql
````

## GraphQL Schema

A schema is needed to define the data structures in the graph.

Create a file named ... schema.js

* All GraphQLObjectTypes require a __name__ property - a string.
* All GraphQLObjectTypes reuqire a __fields__ property - an object.
  * The keys are the fields
  * The values are the types
      * The values are objects with __type__ properties using a GraphQL object type
     