const { GraphQLList, GraphQLString, GraphQLInt } = require("graphql")
const { authorize } = require("../../constants/authenticate")
const { Commission } = require("../../models")
const { CommissionType, CommissionPaginateType } = require("../../types")
const assert = require("assert")


const get_commission_history = {
    type: new GraphQLList(CommissionType), 
    args: { 
        username: {type: GraphQLString},
        wif: {type: GraphQLString},
        limit: {type: GraphQLInt}
    }, 
    async resolve(parent, args) { 
        let auth = await authorize(args.username, args.wif)
        assert(auth, "Could not authorize.")

        let limit = args.limit
        if(limit < 5 || !limit) limit = 5
        
        const cmm = await Commission.find({to: args.username}).sort({created_at: -1}).limit(limit)
        return cmm
    }
}

module.exports = {get_commission_history}