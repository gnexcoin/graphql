const { GraphQLObjectType, GraphQLInt, GraphQLBoolean, GraphQLList } = require("graphql");
const { UTransactionType } = require("./UTransactionType");

const TransactionPaginateType = new GraphQLObjectType({
    name: "TransactionPaginateType",
    fields: () => ({
        docs: { type: GraphQLList(UTransactionType) },
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

module.exports = { TransactionPaginateType }