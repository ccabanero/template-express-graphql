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
        author_id: { type: GraphQLInt },
        title: { type: GraphQLString },
        description: { type: GraphQLString },
        image_detail: { type: GraphQLString },
        image_thumb: { type: GraphQLString },
        author: {
            type: AuthorType,
            resolve(parentValue, args) {
                const query = `SELECT * FROM author WHERE id=$1`;
                const param = [parentValue.author_id];

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