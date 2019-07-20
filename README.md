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

* A DB, your REST API, a 3rd party API

## Data Store

We use a fake API as a data store.  This is what is queried via GraphQL.

````
npm install --save json-server
````

Then make db.json as the data 

````
{
    "users": [
        { "id": "23", "firstName": "Bill", "age": 20, "companyId": "1" },
        { "id": "40", "firstName": "Alex", "age": 40, "companyId": "2" },
        { "id": "41", "firstName": "Nick", "age": 44, "companyId": "2" }
    ],
    "companies": [
        { "id": "1", "name": "Apple", "description": "iphone" },
        { "id": "2", "name": "Google", "description": "search" }
    ]
}
````

Then start this server and add a helper script in package.json: 

````
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1", 
    "json:server": "json-server --watch db.json" // <!-- ADDED THIS
  },
````

Now run in a new Terminal tab with:

````
npm run json:server
````

Then visit in the brower localhost:3000/users and see:

````
[
  {
    "id": "23",
    "firstName": "Bill",
    "age": 20
  },
  {
    "id": "40",
    "firstName": "Alex",
    "age": 40
  }
]
````

## GraphQL with Express


Initialize a new npm application ...

````
npm init
````

Then install four packages ...

````
npm install --save express express-graphql graphql
````

Then create server.js in project. I server.js scaffold a basic Express app ...


````
const express = require('express');

const app = express();

app.listen(4000, () => {

    console.log('Listening on port 4000');
});
````

Hooke up GraphQL with Express.

````
const express = require('express');
const expressGraphQL = require('express-graphql');
const schema = require('./schema/schema');

const app = express();

app.use('/graphql', expressGraphQL({
    schema: schema,
    graphiql: true
}));

app.listen(4000, () => {

    console.log('Listening on port 4000');
});
````

Thats all for the base Express app.  Now we'll define the GraphQL Schema.

## GraphQL Schema

A schema is used to define the data structures in the graph and provide how we will query the data.

Create a file named ... schema.js

#### GraphQLObjectType

* Each entity in data model is a GraphQLObjecType
* All GraphQLObjectTypes require a __name__ property - a string.
* All GraphQLObjectTypes reuqire a __fields__ property - an object.
  * The keys are the fields
  * The values are the types
      * The values are objects with __type__ properties using a GraphQL object type

````
const graphql = require('graphql');
const {
    GraphQLObjectType,
    GraphQLString,
    GraphQLInt
} = graphql;

// Defines a User
const UserType = new GraphQLObjectType({
    name: 'User',
    fields: {
        id: { type: GraphQLString},
        firstName: { type: GraphQLString },
        age: { type: GraphQLInt }
    }
});
````
      
#### Root Query

* A root query 'jumps into the object graph'.  
* A root query is an entry point into our data (i.e. object graph).
     
     
#### Async Resolvers     

Install axios (alternative to fetch) with:

````
npm install --save axios
````
We use axios to make async calls to our dev json server.  

````
const graphql = require('graphql');
const axios = require('axios');
const {
    GraphQLObjectType,
    GraphQLString,
    GraphQLInt,
    GraphQLSchema
} = graphql;

// Defines a Company
const CompanyType = new GraphQLObjectType({
    name: 'Company',
    fields: {
        id: { type: GraphQLString },
        name: { type: GraphQLString },
        description: { type: GraphQLString }
    }
});

// Defines a User
const UserType = new GraphQLObjectType({
    name: 'User',
    fields: {
        id: { type: GraphQLString },
        firstName: { type: GraphQLString },
        age: { type: GraphQLInt },
        company: {
            type: CompanyType,
            resolve(parentValue, args) {
                return axios.get(`http://localhost:3000/companies/${parentValue.companyId}`)
                .then(res => res.data);
            }
        }
    }
});

// The root query is an entry point into our object graph.
const RootQuery = new GraphQLObjectType({
    name: 'RootQueryType',
    fields: {
        user: {
            type: UserType,
            args: { 
                id: { 
                    type: GraphQLString 
                } 
            },
            resolve(parentValue, args) {
                // go into datastore and find the data we're looking for
                return axios.get(`http://localhost:3000/users/${args.id}`)
                    .then(response => response.data);
            }
        }
    }
});

module.exports = new GraphQLSchema({
    query: RootQuery,
});
````

Now that we have defined the GraphQL schema for our Express app ...


Run the Express app.

````
node server.js
````

## GraphiQL 

Use the GraphiQL client by going to:

````
http://localhost:4000/graphql
````

Go to app in browser and query for a user with:

````
{
  user(id:"40") {
    id, 
    firstName,
    age
    company {
      id,
      name,
      description
    }
  }
}
````

* It says, look through Users, find User with id '23'.  When found, we ask for the three passed fields of interest.
* Changing the id will change the user.
* Changing the properties will allow for not over-fetching data not needed.
* Note, if id doesn't exist, we simply get null! :)
* Note, if no required id parameter is provided - it informs in response.



