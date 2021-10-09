const graphql = require("graphql")
const {
    GraphQLObjectType,
    GraphQLString,
    GraphQLInt,
    GraphQLFloat
} = graphql;

const UDeleteType = new GraphQLObjectType({
    name: 'UDeleteType',
    fields: () => ({
        n:   {type: GraphQLInt},
        ok:     {type: GraphQLInt},
        deletedCount:     {type: GraphQLInt}
    })
});

module.exports = { UDeleteType }