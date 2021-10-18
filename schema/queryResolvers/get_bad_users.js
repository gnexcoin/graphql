const { GraphQLList, GraphQLString } = require("graphql")
const { BadUserType } = require("../../types")
const { BadUser } = require("../../models")


const get_bad_users = {
    type: new GraphQLList(BadUserType),
    
    async resolve(parent, args) {
        let users = await BadUser.find({})
        return users
    }
}

module.exports = {get_bad_users}