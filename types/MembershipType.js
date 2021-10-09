const graphql = require("graphql")
const {
    GraphQLObjectType,
    GraphQLString,
    GraphQLInt
} = graphql;

const MembershipType = new GraphQLObjectType({
    name: 'MembershipType',
    fields: () => ({
        username: {type: GraphQLString},
        membership: {type: GraphQLString},
        max_invites: {type: GraphQLInt},
        current_invites: {type: GraphQLInt},
        max_withdrawal: {type: GraphQLInt},
        current_withdrawal: {type: GraphQLInt},
        max_commission: {type: GraphQLInt},
        current_commission: {type: GraphQLInt},
        created_at: {type: GraphQLString},
        updated_at: {type: GraphQLString}
    })
});

module.exports = { MembershipType }