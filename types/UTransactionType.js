const graphql = require("graphql")
const {
    GraphQLObjectType,
    GraphQLString,
    GraphQLInt,
    GraphQLFloat
} = graphql;

const UTransactionType = new GraphQLObjectType({
    name: 'UTransactionType',
    fields: () => ({
        username:   {type: GraphQLString},
        _id:     {type: GraphQLString},

        method:     {type: GraphQLString},
        deposo:     {type: GraphQLString},
        amount:     {type: GraphQLFloat},
        status:     {type: GraphQLString},
        type:       {type: GraphQLString},
        created_at: {type: GraphQLString},
        updated_at: {type: GraphQLString},
        error:       {type: GraphQLString}
    })
});

module.exports = { UTransactionType }