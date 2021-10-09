const graphql = require("graphql")
const {
    GraphQLObjectType,
    GraphQLString
} = graphql;

const ProfileType = new GraphQLObjectType({
    name: 'ProfileType',
    fields: () => ({
        cover_image: {type: GraphQLString},
        full_name:{type: GraphQLString},
        about:{type: GraphQLString},
        location:{type: GraphQLString},
        website:{type: GraphQLString},
        profile_image: {type: GraphQLString}
    })
});

module.exports = { ProfileType }