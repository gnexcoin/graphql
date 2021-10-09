const graphql = require("graphql")
const {
    GraphQLObjectType,
    GraphQLString,
    GraphQLInt
} = graphql;

const DataType = new GraphQLObjectType({
    name: 'DataType',
    fields: () => ({
        x:    {type: GraphQLString},
        y:    {type: GraphQLInt}
    })
});

module.exports = { DataType }