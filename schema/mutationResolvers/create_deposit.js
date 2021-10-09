const { GraphQLString, GraphQLFloat } = require("graphql")
const { authorize } = require("../../constants/authenticate")
const Transaction = require("../../models/TransactionModel/TransactionModel")
const { UTransactionType } = require("../../types")
const assert = require("assert")

const create_deposit = {
    type: UTransactionType,
    args: {
        username:   {type: GraphQLString},
        wif:        {type: GraphQLString},

        method:     {type: GraphQLString},
        deposo:     {type: GraphQLString},
        amount:     {type: GraphQLString}
    },
    async resolve(parent, args){

        let auth = await authorize(args.username, args.wif)
        assert(auth, "Could not authorize.")


        let cnt = await Transaction.find({username: args.username, status: "pending", type: "deposit"}).count()
        assert(cnt < 1, "There is already a pending request.")



        
        let transaction = new Transaction({
            username:   args.username,
            method:     args.method,
            deposo:     args.deposo,
            amount:     args.amount,
            status:     "pending",
            type:       "deposit",
            created_at: new Date(),
            updated_at: new Date()
        })
        return transaction.save();
    }
}

module.exports = {create_deposit}