const { GraphQLString } = require("graphql")
const { authorize } = require("../../constants/authenticate")
const { Transaction } = require("../../models")
const { UDeleteType } = require("../../types/UDeleteType")
const assert = require("assert")

const delete_deposit = {
    type: UDeleteType,
    args: {
        username:   {type: GraphQLString},
        wif:   {type: GraphQLString},
        trx_id:     {type: GraphQLString}
    }, 
    async resolve(parent, args) {
        let auth = await authorize(args.username, args.wif)
        assert(auth, "Could not authorize.")

        return Transaction.deleteOne({username: args.username, _id: args.trx_id, type: "deposit", status: "pending"})
    }
}

module.exports = {delete_deposit}