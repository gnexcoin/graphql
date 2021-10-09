const { GraphQLList } = require("graphql")
const { packages } = require("../../constants/packages")
const { UPlanType } = require("../../types/UPlanType")

const get_memberships = {
    type: new GraphQLList(UPlanType), 
    resolve(parent, args) { return packages}
}

module.exports = {get_memberships}