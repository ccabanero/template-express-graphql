# GraphQL-snippets

Notes and snippets for setting up a GraphQL Server and using it with multiple client platforms.


## Technology Stack

This solution using the following technology stack:

__Clients__

* GraphiQL
* React
	* Apollo Client
	* apollo-react
* iOS native app
	* apollos-ios
* Android native app
	* apollo-android

	



__GraphQL Server__

* Express
* Express-GraphQL library.  

__Data Store__

* PostgreSQL

## Data Store - PostgreSQL

#### Create Tables in PostgreSQL DB

First, create some basic tables.

````
CREATE TABLE author(
	ID serial PRIMARY KEY,
    first_name VARCHAR(40),
    last_name VARCHAR(40)
);

INSERT INTO author (first_name, last_name)
VALUES ('Chuck', 'Wendig');

INSERT INTO author (first_name, last_name)
VALUES ('E. K.', 'Johnston');
````

````
CREATE TABLE book(
	ID serial PRIMARY KEY,
	author_id integer NOT NULL,
	title VARCHAR (100),
	description VARCHAR (2500),
	image_url VARCHAR (255),
	CONSTRAINT fk_book_author
		FOREIGN KEY (author_id)
		REFERENCES author (ID)
);

INSERT INTO book (author_id, title, description, image_url)
VALUES (1, 'Aftermath', 'As the Empire reels from its critical defeats at the Battle of Endor, the Rebel Alliance - now a fledgling New Republic - presses its advantage by hunting down the enemy''s scattered forces before they can regroup and retaliate.', 'http://someurl/aftermath.png');

INSERT INTO book (author_id, title, description, image_url)
VALUES (1, 'Life Debt', 'The Emperor is dead, and the remnants of his former Empire are in retreat. As the New Republic fights to restore a lasting peace to the galaxy, some dare to imagine new beginnings and new destinies.  For Han Solo ...', 'http://someurl/life_debt.png');

INSERT INTO book (author_id, title, description, image_url)
VALUES (1, 'Empire''s End', 'The Battle of Endor shattered the Empire, scattering its remaining forces across the galaxy. But the months following the Rebellion''s victory have not been easy. The fledgling New Republic has suffered a devasting attack ...', 'http://someurl/empires_end.png');

INSERT INTO book (author_id, title, description, image_url)
VALUES (2, 'Ahsoka', 'Ahsoka Tano, once a loyal Jedi apprentice to Anakin Skywalker, planned to spend her life serving the Jedi Order. But after a heartbreaking betrayal, she turned her back on the Order to forge her own path, knowing Anakin ...', 'http://someurl/ashoka.png');

INSERT INTO book (author_id, title, description, image_url)
VALUES (2, 'Queen''s Shadow', 'When Padme Amidala steps down from her position as Queen of Naboo, she is ready to set aside her title and return to life out of the spotlight.  But to her surprise, the new queen asks Padme to continue serving their people ...', 'http://someurl/queens_shadow.png');

````

#### Create a PostgreSQL Adapter

Create pgAdapter.js at the root of the project.  It should contain:

````
require('dotenv').config()
const pgPromise = require('pg-promise');

const pgp = pgPromise({});

const config = {
    host: process.env.POSTGRES_HOST,
    port: process.env.POSTGRES_PORT,
    database: process.env.POSTGRES_DB,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD
};

const db = pgp(config);

// test db connection via ... node pgAdapter.js
db.one('select title from book where id=1')
.then(res => {
    console.log(res);
}, (e) => {
    console.log(e)
});

exports.db = db;

````

Create a .env file at the root of the project.  It should contain your actual connection info:

````
DB_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=your_database
POSTGRES_USER=your_username
POSTGRES_PASSWORD=your_password
````

## Express App - GraphQL


Initialize a new npm application ...

````
npm init
````

Then install four packages ...

````
npm install --save pg-promise express express-graphql graphql dotenv
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

* Each entity in data model is declared as a GraphQLObjecType
* All GraphQLObjectTypes require a __name__ property - a string.
* All GraphQLObjectTypes reuqire a __fields__ property - an object.
  * The keys are the fields
  * The values are the types
      * The values are objects with __type__ properties using a GraphQL object type

Example...

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
* The root query type provides us multiple access points to the object graph (e.g. start querying from user, start querying from company)
* The root query lets us know how to query by providing:
	*  the name of the field we can query
	*  the input arguments required
	*  the resolve function to navigate to another type
     
     
#### Resolve Functions   

Resolve functions let us navigate from one GraphQLObjectType to another.  

Common cases are:

* When querying ... going from a RootQuery type to UserType.
* Object relationships ... from User type to Company type.  Going from Company type to list of User types

In this sample, the resolve function implementation uses async http calls to our fake API.

#### Mutations

Mutations are a separate object from our types.  This is used to CRUD types in our object graph.


#### Schema

````
const graphql = require('graphql');
const axios = require('axios');
const {
    GraphQLObjectType,
    GraphQLString,
    GraphQLInt,
    GraphQLSchema,
    GraphQLList
} = graphql;

// Defines a Company
const CompanyType = new GraphQLObjectType({
    name: 'Company',
    fields: () => ({
        id: { type: GraphQLString },
        name: { type: GraphQLString },
        description: { type: GraphQLString },
        users: {
            type: new GraphQLList(UserType),
            resolve(parentValue, args) {
                return axios.get(`http://localhost:3000/companies/${parentValue.id}/users`).then(res => res.data);
            }
        }
    })
});

// Defines a User
const UserType = new GraphQLObjectType({
    name: 'User',
    fields: () => ({
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
    })
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
                return axios.get(`http://localhost:3000/users/${args.id}`)
                    .then(response => response.data);
            }
        },
        company: {
            type: CompanyType,
            args: {
                id: {
                    type: GraphQLString
                }
            },
            resolve(parentValue, args) {
                return axios.get(`http://localhost:3000/companies/${args.id}`).then(response => response.data);
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

Note the free docs!!!

Query for a user:

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

Alterantively, create a named query (useful for client-side use).

````
query findUser {
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

both variations retuns:

````
{
  "data": {
    "user": {
      "id": "40",
      "firstName": "Alex",
      "age": 40,
      "company": {
        "id": "2",
        "name": "Google",
        "description": "search"
      }
    }
  }
}
````

* It says, look through Users, find User with id '40'.  When found, we ask for the four passed fields of interest.
* Changing the id will change the user.
* Changing the properties will allow for not over-fetching data not needed.
* Note, if id doesn't exist, we simply get null! :)
* Note, if no required id parameter is provided - it informs in response.

Query of a company:

````
{
  company(id:"2") {
    id,
    name,
    description,
    users {
      id,
      firstName,
      age
    }
  }
}
````

returns: 

````
{
  "data": {
    "company": {
      "id": "2",
      "name": "Google",
      "description": "search",
      "users": [
        {
          "id": "40",
          "firstName": "Alex",
          "age": 40
        },
        {
          "id": "41",
          "firstName": "Nick",
          "age": 44
        }
      ]
    }
  }
}
````

Build custom objects:

````
{
  apple: company(id:"1"){
    id
    name
    description
  }
  google: company(id:"2") {
    id
    name
    description
  }
}
````
returns 

````
{
  "data": {
    "apple": {
      "id": "1",
      "name": "Apple",
      "description": "iphone"
    },
    "company": {
      "id": "2",
      "name": "Google",
      "description": "search"
    }
  }
}
````

Use fragments as an alterantive to the above:

````
{
  apple: company(id:"1"){
    ...companyDetails
  }
  google: company(id:"2") {
    ...companyDetails
  }
}

fragment companyDetails on Company {
  id
  name
  description
}
````

Mutate to create a new user:

````
mutation {
  addUser(firstName: "Stephen", age: 26) {
    id
    firstName
    age
  }
}
````

returns:

````
{
  "data": {
    "addUser": {
      "id": "W6BqeAG",
      "firstName": "Stephen",
      "age": 26
    }
  }
}
````

Mutate to delete a user:

````
mutation {
  deleteUser(id:"K2_HKl-") {
    firstName,
    age
  }
}
````

returns:

````
{
  "data": {
    "deleteUser": {
      "firstName": null,
      "age": null
    }
  }
}
````

You can also confirm deletion by hitting the fake REST API: http://localhost:3000/users

Mutate to edit a user (i.e. patch by only updating optional passed in values):

````
mutation {
  editUser(id:"jIMhy-p", age: 23, companyId: "1") {
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

returns:

````
{
  "data": {
    "editUser": {
      "id": "jIMhy-p",
      "firstName": "Stephen",
      "age": 23,
      "company": {
        "id": "1",
        "name": "Apple",
        "description": "iphone"
      }
    }
  }
}
````

Note: In ChromeDev tools, view network tab to see the POST Request parameters.