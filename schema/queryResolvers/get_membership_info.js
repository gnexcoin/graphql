const { GraphQLString } = require("graphql/type");
const { authorize } = require("../../constants/authenticate");
const { Membership, Transaction } = require("../../models");
const { MembershipType } = require("../../types")
const assert = require("assert");
const User = require("../../models/User");

const get_membership_info = { 
    type: MembershipType, 
    args: {
        username: {type: GraphQLString},
        wif: {type: GraphQLString}
    },
    async resolve(parent, args) { 
        let auth = await authorize(args.username, args.wif)
        assert(auth, "Could not authorize.")
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
        let ltm = (month_s.length===1)?month_s[0].count:0

        const custs = await User.find({inviter: args.username}).count()

        let member = await Membership.findOne({username: args.username})
        member.current_invites = custs
        member.current_withdrawal = ltm
        member.current_commission = 10000

        return member
    } 
}

module.exports = {get_membership_info}