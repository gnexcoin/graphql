const graphql = require("graphql")
const {
    GraphQLObjectType,
    GraphQLString,
    GraphQLInt
} = graphql;

const PackageType = new GraphQLObjectType({
    name: 'PackageType',
    fields: () => ({
        username:        {type: GraphQLString},
        type:            {type: GraphQLString},
        cost:            {type: GraphQLString},
        created_at:      {type: GraphQLString}
    })
});

module.exports = { PackageType }