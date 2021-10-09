const { 
    GraphQLObjectType, 
    GraphQLInt, 
    GraphQLBoolean, 
    GraphQLList 
} = require("graphql");
const { CommissionType } = require("./CommissionType");

const CommissionPaginateType = new GraphQLObjectType({
    name: "CommissionPaginateType",
    fields: () => ({
        docs: { type: GraphQLList(CommissionType) },
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

module.exports = { CommissionPaginateType }