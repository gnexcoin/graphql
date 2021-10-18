const graphql = require("graphql")
const {
    GraphQLObjectType,
    GraphQLString,
    GraphQLInt
} = graphql;

const BadUserType = new GraphQLObjectType({
    name: 'BadUserType',
    fields: () => ({
        username: {type: GraphQLString}
    })
});

module.exports = { BadUserType }