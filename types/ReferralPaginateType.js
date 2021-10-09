const { GraphQLObjectType, GraphQLInt, GraphQLBoolean, GraphQLList } = require("graphql");
const { ReferralType } = require("./ReferralType");

const ReferralPaginateType = new GraphQLObjectType({
    name: "ReferralPaginateType",
    fields: () => ({
        docs: { type: GraphQLList(ReferralType) },
        totalDocs: { type: GraphQLInt },
        offset: { type: GraphQLInt },
        limit: { type: GraphQLInt },
        totalPages: { type: GraphQLInt },
        page: { type: GraphQLInt },
        pagingCounter: { type: GraphQLInt },
        hasPrevPage: { type: GraphQLBoolean },
        hasNextPage: { type: GraphQLBoolean },
        prevPage: { type: GraphQLInt },
        nextPage: { type: GraphQLInt }
    })
})

module.exports = { ReferralPaginateType }