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