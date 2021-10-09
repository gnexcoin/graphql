const graphql = require("graphql")
const {
    GraphQLObjectType,
    GraphQLString,
    GraphQLInt
} = graphql;

const TStatsType = new GraphQLObjectType({
    name: 'TStatsType',
    fields: () => ({
        pending:    {type: GraphQLInt},
        processed:    {type: GraphQLInt},
        rejected:    {type: GraphQLInt}
    })
});

module.exports = { TStatsType }