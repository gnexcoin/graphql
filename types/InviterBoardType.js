const graphql = require("graphql")
const {
    GraphQLObjectType,
    GraphQLString,
    GraphQLInt
} = graphql;

const InviterBoardType = new GraphQLObjectType({
    name: 'InviterBoardType',
    fields: () => ({
        _id:        {type: GraphQLString},
        count:  {type: GraphQLInt}
    })
});

module.exports = { InviterBoardType }