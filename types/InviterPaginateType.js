const { 
    GraphQLObjectType, 
    GraphQLInt, 
    GraphQLBoolean, 
    GraphQLList 
} = require("graphql");
const { InviterBoardType } = require("./InviterBoardType");

const InviterPaginateType = new GraphQLObjectType({
    name: "InviterPaginateType",
    fields: () => ({
        docs: { type: GraphQLList(InviterBoardType) },
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

module.exports = { InviterPaginateType }