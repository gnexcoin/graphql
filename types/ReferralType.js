const { GraphQLObjectType, GraphQLString } = require("graphql");

const ReferralType = new GraphQLObjectType({
    name: "ReferralType",
    fields: () => ({
        inviter: {type: GraphQLString},
        invitee: {type: GraphQLString},
        creation_time: {type: GraphQLString},
        error: {type: GraphQLString}
    })
});

module.exports = {ReferralType}