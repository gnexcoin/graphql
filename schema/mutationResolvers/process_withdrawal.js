const { GraphQLString } = require("graphql")
const { Transaction } = require("../../models")
const { UTransactionType } = require("../../types")
const assert = require("assert")
const { authorize } = require("../../constants/authenticate")

const process_withdrawal = {
    type: UTransactionType,
    args: {
        username:   {type: GraphQLString},
        wif:   {type: GraphQLString},
        trx_id: {type: GraphQLString}
    },
    async resolve(parent, args){

        const allowed = ["voilk", "company", "promoter"]
        assert(allowed.includes(args.username), "You are not allowed to do this task.")

        let auth = await authorize(args.username, args.wif)
        assert(auth, "Could not authorize.")

        let doc = await Transaction.findOne({_id: args.trx_id})
        assert(doc, "Transaction was not found. ")

        doc.status = "processed"
        doc.updated_at = new Date()
        return doc.save()
    }
}
module.exports = {process_withdrawal}