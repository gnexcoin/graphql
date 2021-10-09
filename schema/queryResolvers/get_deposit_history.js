const { GraphQLList } = require("graphql")
const { GraphQLString, GraphQLInt } = require("graphql/type")
const { authorize } = require("../../constants/authenticate")
const { Transaction } = require("../../models")
const { UTransactionType, TransactionPaginateType } = require("../../types")
const assert = require("assert")

const get_deposit_history_p = {
    type: TransactionPaginateType,
    args: {
        username: { type: GraphQLString },
        wif: {type: GraphQLString},
        page: { type: GraphQLInt },
        limit: { type: GraphQLInt }
    },
    async resolve(parent, args) {
        let auth = await authorize(args.username, args.wif)
        assert(auth, "Could not authorize.") 

        var options = {
            sort: { created_at: -1 },
            page: args.page,
            limit: args.limit
        };
        return Transaction.paginate({ username: args.username,type: "deposit" }, options).then(result => {
            return result;
        })

    }
}
const get_deposit_history = {
    type: new GraphQLList(UTransactionType), 
    args: {
        username: {type: GraphQLString},
        wif: {type: GraphQLString},
        limit: {type: GraphQLInt}
    },
    async resolve(parent, args) { 
        
        let auth = await authorize(args.username, args.wif)
        assert(auth, "Could not authorize.")    

        let limit = args.limit
        if(!limit || limit < 5) limit = 5
        let trns = await Transaction.find({username: args.username, type: "deposit"})
        .sort({created_at: -1})
        .limit(limit)
        return trns
    }
}

module.exports = {get_deposit_history, get_deposit_history_p}