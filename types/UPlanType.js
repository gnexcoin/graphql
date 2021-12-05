const graphql = require("graphql")
const {
    GraphQLObjectType,
    GraphQLString,
    GraphQLInt,
    GraphQLFloat
} = graphql;

const UPlanType = new GraphQLObjectType({
    name: 'UPlanType',
    fields: () => ({
        id: {type: GraphQLInt},
        type: {type: GraphQLString},
        increment: {type: GraphQLInt},
        max_commission: {type: GraphQLInt},
        buyer_share: {type: GraphQLInt},
        promoter_share: {type: GraphQLInt},
        company_share: {type: GraphQLInt},
        max_withdrawal: {type: GraphQLInt},
        cost: {type: GraphQLFloat}
    })
});

module.exports = { UPlanType }