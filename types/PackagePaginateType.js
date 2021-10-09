const { GraphQLObjectType, GraphQLInt, GraphQLBoolean, GraphQLList } = require("graphql");
const { PackageType } = require("./PackageType");

const PackagePaginateType = new GraphQLObjectType({
    name: "PackagePaginateType",
    fields: () => ({
        docs: { type: GraphQLList(PackageType) },
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

module.exports = { PackagePaginateType }