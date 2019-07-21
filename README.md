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
* Express-GraphQL 

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

#### Create a PostgreSQL Adaptor

Create pgAdaptor.js at the root of the project with ...

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

/*
// test db connection
db.one('select title from book where id=1')
.then(res => {
    console.log(res);
}, (e) => {
    console.log(e)
});
*/

exports.db = db;

````

Create a .env file at the root of the project.  It should contain your connection info.

Add the .env (and any .env.dev, .denv.prod, etc.) in your .gitignore file.

````
DB_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=your_database
POSTGRES_USER=your_username
POSTGRES_PASSWORD=your_password
````

## GraphQL Schema

A GraphQL schema includes:

* Defining the types in the object graph.
* Defining how we query the types.
* Defining how we mutate the types.

Create a directory named schema with the following:

* /schema/types.js 
* /schema/query.js
* /schema/mutation.js


#### Type

* Each entity in data model is declared as a GraphQLObjectType
* All GraphQLObjectTypes require a __name__ property - a string.
* All GraphQLObjectTypes reuqire a __fields__ property - an object (or arrow function when using related objects)
  * The keys are the fields
  * The values are the types
      * The values are objects with __type__ properties using a GraphQL object type

Add /schema/types.js ...

````
const { db } = require('../pgAdaptor');
const graphql = require('graphql');
const {
    GraphQLObjectType,
    GraphQLString,
    GraphQLInt,
    GraphQLList
} = graphql;


// Defines an Book
const BookType = new GraphQLObjectType({
    name: 'Book',
    fields: () => ({
        id: { type: GraphQLInt },
        title: { type: GraphQLString },
        description: { type: GraphQLString },
        image_url: { type: GraphQLString },
        author: {
            type: AuthorType,
            resolve(parentValue, args) {
                const query = `SELECT * FROM author WHERE id=$1`;
                const param = [parentValue.id];

                return db.one(query, param)
                    .then(res => res)
                    .catch(err => err);
            }
        }
    })
});

// Defines an Author
const AuthorType = new GraphQLObjectType({
    name: 'Author',
    fields: () => ({
        id: { type: GraphQLInt },
        first_name: { type: GraphQLString },
        last_name: { type: GraphQLString },
        books: {
            type: new GraphQLList(BookType),
            resolve(parentValue, args) {
                const query = `SELECT * FROM book WHERE author_id=$1`;
                console.log(parentValue);
                console.log(args);
                const param = [parentValue.id];

                return db.manyOrNone(query, param)
                    .then(res => res)
                    .catch(err => err);
            }
        }
    })
});

exports.AuthorType = AuthorType;
exports.BookType = BookType;
````
      
#### Query
 
* The root query type provides us multiple access points to the object graph (e.g. start querying from user, start querying from company)
* The root query lets us know how to query by providing:
	*  the name of the field we can query
	*  the input arguments required
	*  the resolve function used to navigate to another type

Add to /schema/query.js ...

````
const { db } = require("../pgAdaptor");
const graphql = require('graphql');
const {
    GraphQLObjectType,
    GraphQLString,
    GraphQLInt,
    GraphQLSchema,
    GraphQLList,
    GraphQLNonNull
} = graphql;
const { AuthorType, BookType } = require("./types");

const RootQuery = new GraphQLObjectType({
    name: 'RootQueryType',
    fields: {
        author: {
            type: AuthorType,
            args: { 
                id: { 
                    type: GraphQLInt 
                } 
            },
            resolve(parentValue, args) {
                const query = `SELECT * FROM author WHERE id=$1`;
                const param = [args.id];

                return db.one(query, param)
                    .then(res => res)
                    .catch(err => err);
            }
        },
        book: {
            type: BookType,
            args: {
                id: {
                    type: GraphQLInt
                }
            },
            resolve(parentValue, args) {
                const query = `SELECT * FROM book WHERE id=$1`;
                const param = [args.id];

                return db.one(query, param)
                    .then(res => res)
                    .catch(err => err);
            }
        }
    }
});

exports.query = RootQuery;

````

#### Mutation

Mutations are a separate object from our types.  This is used to CRUD types in our object graph.

Add to /schema/mutation.js.

````
const { db } = require("../pgAdaptor");
const graphql = require('graphql');
const {
    GraphQLObjectType,
    GraphQLString,
    GraphQLInt,
    GraphQLNonNull
} = graphql;
const { AuthorType, BookType } = require("./types");

const RootMutation = new GraphQLObjectType({
    name: "RootMutationType",
    fields: {
        addAuthor: {
            type: AuthorType,
            args: {
                first_name: { type: new GraphQLNonNull(GraphQLString) },
                last_name: { type: new GraphQLNonNull(GraphQLString) }
            },
            resolve(parentValue, args) {
                const query = `INSERT INTO author(first_name, last_name) VALUES ($1, $2) RETURNING id, first_name, last_name`;
                const params = [args.first_name, args.last_name];

                return db.one(query, params)
                    .then(res => res)
                    .catch(err => err);
            }
        },
        deleteAuthor: {
            type: AuthorType,
            args: {
                id: { type: new GraphQLNonNull(GraphQLInt)}
            },
            resolve(parentValue, args) {
                const query = `DELETE FROM author WHERE id=$1 RETURNING id, first_name, last_name`;
                const params = [args.id];

                return db.one(query, params)
                    .then(res => res)
                    .catch(err => err);
            }
        }
    }
});

exports.mutation = RootMutation;
````

## Express App - GraphQL


Initialize a new npm application ...

````
npm init
````

Then install four packages ...

````
npm install --save pg-promise express express-graphql graphql dotenv nodemon
````

Then create server.js ...

````
const graphql = require("graphql");
const express = require('express');
const expressGraphQL = require('express-graphql');
const { GraphQLSchema } = graphql;
const { query } = require("./schema/query");
const { mutation } = require("./schema/mutation");

const schema = new GraphQLSchema({
    query,
    mutation
});

const app = express();

app.use('/graphql', expressGraphQL({
    schema,
    graphiql: true
}));

app.listen(4000, () => {
    console.log('Listening on port 4000');
});
````

Update package.json so that we use nodemon.

````
{
  ...
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1",
    "dev": "nodemon server.js"
  } ...
````

Run the app (with nodemon):

````
npm run dev
````

## GraphiQL 

Use the GraphiQL client by going to:

````
http://localhost:4000/graphql
````

Note the auto-docuemntation (on the right).

Query Author:

````
{
  author(id:1) {
    id, 
    first_name, 
    last_name, 
    books {
      id,
      title,
      description,
      image_url
    }
  }
}
````

* It says, find Author with id '1'.  
* When found, we want the id, first_name, last_name, and list of books returned.
* Changing the id will change the user.
* Changing the properties will allow for not over-fetching data not needed.
* Note, if id doesn't exist, we simply get null! :)
* Note, if no required id parameter is provided - it informs in response.

Returns:

````
{
  "data": {
    "author": {
      "id": 1,
      "first_name": "Chuck",
      "last_name": "Wendig",
      "books": [
        {
          "id": 1,
          "title": "Aftermath",
          "description": "As the Empire reels from its critical defeats at the Battle of Endor, the Rebel Alliance - now a fledgling New Republic - presses its advantage by hunting down the enemy's scattered forces before they can regroup and retaliate.",
          "image_url": "http://someurl/aftermath.png"
        },
        {
          "id": 2,
          "title": "Life Debt",
          "description": "The Emperor is dead, and the remnants of his former Empire are in retreat. As the New Republic fights to restore a lasting peace to the galaxy, some dare to imagine new beginnings and new destinies.  For Han Solo ...",
          "image_url": "http://someurl/life_debt.png"
        },
        {
          "id": 3,
          "title": "Empire's End",
          "description": "The Battle of Endor shattered the Empire, scattering its remaining forces across the galaxy. But the months following the Rebellion's victory have not been easy. The fledgling New Republic has suffered a devasting attack ...",
          "image_url": "http://someurl/empires_end.png"
        }
      ]
    }
  }
}
````

Query Book:

````
{
  book(id: 1){
    id, 
    title,
    description,
    image_url,
    author {
      id,
      first_name,
      last_name
    }
  }
}
````

Returns:

````
{
  "data": {
    "book": {
      "id": 1,
      "title": "Aftermath",
      "description": "As the Empire reels from its critical defeats at the Battle of Endor, the Rebel Alliance - now a fledgling New Republic - presses its advantage by hunting down the enemy's scattered forces before they can regroup and retaliate.",
      "image_url": "http://someurl/aftermath.png",
      "author": {
        "id": 1,
        "first_name": "Chuck",
        "last_name": "Wendig"
      }
    }
  }
}
````

Note: In ChromeDev tools, view network tab to see the POST Request parameters.


Build custom objects with multiople queries!!!!!!

````
{
  wendig: author(id:1) {
    books {
        id,
        title,
        description,
        image_url
    }
  },
  johnston: author(id:2){
    books{
        id,
        title,
        description,
        image_url 
    }
  }
}
````
Returns:

````
{
  "data": {
    "wendig": {
      "books": [
        {
          "id": 1,
          "title": "Aftermath",
          "description": "As the Empire reels from its critical defeats at the Battle of Endor, the Rebel Alliance - now a fledgling New Republic - presses its advantage by hunting down the enemy's scattered forces before they can regroup and retaliate.",
          "image_url": "http://someurl/aftermath.png"
        },
        {
          "id": 2,
          "title": "Life Debt",
          "description": "The Emperor is dead, and the remnants of his former Empire are in retreat. As the New Republic fights to restore a lasting peace to the galaxy, some dare to imagine new beginnings and new destinies.  For Han Solo ...",
          "image_url": "http://someurl/life_debt.png"
        },
        {
          "id": 3,
          "title": "Empire's End",
          "description": "The Battle of Endor shattered the Empire, scattering its remaining forces across the galaxy. But the months following the Rebellion's victory have not been easy. The fledgling New Republic has suffered a devasting attack ...",
          "image_url": "http://someurl/empires_end.png"
        }
      ]
    },
    "johnston": {
      "books": [
        {
          "id": 4,
          "title": "Ahsoka",
          "description": "Ahsoka Tano, once a loyal Jedi apprentice to Anakin Skywalker, planned to spend her life serving the Jedi Order. But after a heartbreaking betrayal, she turned her back on the Order to forge her own path, knowing Anakin ...",
          "image_url": "http://someurl/ashoka.png"
        },
        {
          "id": 5,
          "title": "Queen's Shadow",
          "description": "When Padme Amidala steps down from her position as Queen of Naboo, she is ready to set aside her title and return to life out of the spotlight.  But to her surprise, the new queen asks Padme to continue serving their people ...",
          "image_url": "http://someurl/queens_shadow.png"
        }
      ]
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

Mutate to create a new author:

````
mutation {
  addAuthor(first_name: "Claudia", last_name: "Gray") {
    id,
    first_name,
    last_name
  }
}
````
Returns:

````
{
  "data": {
    "addAuthor": {
      "id": 10,
      "first_name": "Claudia",
      "last_name": "Gray"
    }
  }
}
````

Mutate to delete an author:

````
mutation {
  deleteAuthor(id:4) {
    id, 
    first_name,
    last_name
  }
}
````

Returns: 

````
{
  "data": {
    "deleteAuthor": {
      "id": 4,
      "first_name": "Clint",
      "last_name": "Gray"
    }
  }
}
````

## Unit Testing GraphQL Queries and Mutations

* TODO


## JSON Web Tokens with GraphQL

* TODO

## Deploying GraphQL server to Heroku

* TODO
 
## Using GraphQL with React Web App

* TODO


## Using GraphQL with native iOS App

* TODO

## Using GraphQL with native iOS App

* TODO

