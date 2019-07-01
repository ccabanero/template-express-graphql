const graphql = require('graphql');
const axios = require('axios');
const {
    GraphQLObjectType,
    GraphQLString,
    GraphQLInt,
    GraphQLSchema
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
