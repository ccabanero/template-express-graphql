const { db } = require("../pgAdaptor");
const graphql = require('graphql');
const {
    GraphQLObjectType,
    GraphQLInt,
    GraphQLList
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
        },
        books: {
            type: new GraphQLList(BookType),
            args: { },
            resolve(parentValue, args) {
                const query = 'SELECT * FROM book';
                const param = [];

                return db.many(query, param)
                    .then(res => res)
                    .catch(err => err);
                }
        }
    }
});

exports.query = RootQuery;
