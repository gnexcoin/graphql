const graphql = require("graphql")
const {
    GraphQLObjectType,
    GraphQLString,
    GraphQLInt
} = graphql;

const CommissionType = new GraphQLObjectType({
    name: 'CommissionType',
    fields: () => ({
        from:        {type: GraphQLString},
        to:          {type: GraphQLString},
        commission:  {type: GraphQLInt},
        created_at:      {type: GraphQLString}
    })
});

module.exports = { CommissionType }