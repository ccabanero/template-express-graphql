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