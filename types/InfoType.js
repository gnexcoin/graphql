const graphql = require("graphql")
const {
    GraphQLObjectType,
    GraphQLString,
    GraphQLInt
} = graphql;

const InfoType = new GraphQLObjectType({
    name: 'InfoType',
    fields: () => ({
        H24: {type: GraphQLInt},
        D30:{type: GraphQLInt},
        Y1: {type: GraphQLInt},
        LT: {type: GraphQLInt}
    })
});

module.exports = { InfoType }