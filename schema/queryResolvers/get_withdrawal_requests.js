const { GraphQLString, GraphQLInt } = require("graphql/type")
const { authorize } = require("../../constants/authenticate")
const { Transaction } = require("../../models")
const { TransactionPaginateType } = require("../../types")
const assert = require("assert")

const get_withdrawal_requests = {
    type: TransactionPaginateType,
    args: {
        username: { type: GraphQLString },
        wif: {type: GraphQLString},
        page: { type: GraphQLInt },
        limit: { type: GraphQLInt }
    },
    async resolve(parent, args) {

        assert(args.username === "voilk", "You don't have access to this.")

        let auth = await authorize(args.username, args.wif)
        assert(auth, "Could not authorize.") 

        var options = {
            sort: { created_at: 1 },
            page: args.page,
            limit: args.limit
        };
        return Transaction.paginate({ type: "withdrawal", status: "pending" }, options).then(result => {
            return result;
        })

    }
}

module.exports = {get_withdrawal_requests}