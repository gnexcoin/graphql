const { GraphQLString, GraphQLInt } = require("graphql/type")
const { authorize } = require("../../constants/authenticate")
const { Transaction } = require("../../models")
const { TStatsType } = require("../../types")
const assert = require("assert")

const get_deposits_stats = {
    type: TStatsType,
    args: {
        username: { type: GraphQLString },
        wif: {type: GraphQLString}
    },
    async resolve(parent, args) {

        assert(args.username === "voilk", "You don't have access to this.")

        let auth = await authorize(args.username, args.wif)
        assert(auth, "Could not authorize.") 

        const pending = await Transaction.find({ type: "deposit", status: "pending" }).count()
        const processed = await Transaction.find({ type: "deposit", status: "processed" }).count()
        const rejected = await Transaction.find({ type: "deposit", status: "rejected" }).count()

        return {
            pending: pending,
            processed: processed,
            rejected: rejected
        }
    }
}

module.exports = {get_deposits_stats}