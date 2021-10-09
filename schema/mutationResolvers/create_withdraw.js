const { GraphQLString, GraphQLFloat } = require("graphql");
const { Transaction, Membership } = require("../../models");
const { UTransactionType } = require("../../types");
const assert = require("assert");
const { authorize } = require("../../constants/authenticate");
const { transfer } = require("../../constants/transfer");
const create_withdraw = {
    type: UTransactionType,
    args: {
        username:   {type: GraphQLString},
        wif:   {type: GraphQLString},

        method:     {type: GraphQLString},
        deposo:     {type: GraphQLString},
        amount:     {type: GraphQLString}
    },
    async resolve(parent, args){
        let auth = await authorize(args.username, args.wif)
        assert(auth, "Could not authorize.")

        let cnt = await Transaction.find({username: args.username, status: "pending", type: "withdrawal"}).count()
        assert(cnt < 1, "There is already a pending request.")
        assert(parseFloat(args.amount)>=50, "Minimum withdrawal amount is 50$")
        

        const membership = await Membership.findOne({username: args.username})
        assert(membership, "Could not get membership details.")

        // check if last 30 days withdrawal limit has reached
        const a_month = 30 * 24 * 60 * 60000
        const month_s = await Transaction.aggregate([
            {
              '$match': {
                'username': args.username, 
                'type': 'withdrawal', 
                'status': 'processed',
                'created_at': { $gte: new Date(Date.now() - a_month)}
              }
            }, {
              '$group': {
                '_id': null, 
                'count': {
                  '$sum': '$amount'
                }
              }
            }
          ])
        assert(month_s, "Could not get monthly limit.")
        
        let amount = parseFloat(args.amount)
        let ltm = (month_s.length===1)?month_s[0].count:0
        
        assert((ltm+amount)<=membership.max_withdrawal, `Withdrawal limit Try: ${membership.max_withdrawal - ltm}$`)
        let amt = amount.toFixed(3) + " VSD" 

        const tr = await transfer(args.username, args.wif, "company", amt, "Withdrawal: " + args.method)
        assert(tr, "We could not deduct the balance.")

        let transaction = new Transaction({
            username:   args.username,
            method:     args.method,
            deposo:     args.deposo,
            amount:     args.amount,
            status:     "pending",
            type:       "withdrawal",
            created_at: new Date(),
            updated_at: new Date()
        })
        return transaction.save();
    }
}

module.exports = {create_withdraw}