const graphql = require("graphql")
const {
    GraphQLObjectType,
    GraphQLString,
    GraphQLInt,
    GraphQLBoolean
} = graphql;

const TradeType = new GraphQLObjectType({
    name: 'TradeType',
    fields: () => ({
        owner: {type: GraphQLString},
        orderid: {type: GraphQLInt},
        amount_to_sell: {type: GraphQLString},
        min_to_receive: {type: GraphQLString},
        fill_or_kill: {type: GraphQLBoolean},
        expiration: {type: GraphQLString}
    })
});

module.exports = { TradeType }