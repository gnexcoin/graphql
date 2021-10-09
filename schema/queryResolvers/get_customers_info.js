const { GraphQLString } = require("graphql/type")
const { authorize } = require("../../constants/authenticate")
const { InfoType } = require("../../types")
const assert = require("assert")
const User = require("../../models/User")

const get_customers_info = {
    type: InfoType,
    args: { 
        username: {type: GraphQLString},
        wif: {type: GraphQLString}
    }, 
    async resolve(parent, args) { 
        let auth = await authorize(args.username, args.wif)
        assert(auth, "Could not authorize.")

        const a_month = 30 * 24 * 60 * 60000
        const a_year  = 365 * 24 * 60 * 60000
        const a_day   = 1 * 24 * 60 * 60000

        const lifeTime = await User.find({inviter: args.username}).count();
        const aYear = await User.find({inviter: args.username, created_at: { $gte: new Date(Date.now() - a_year)}}).count();
        const aMonth = await User.find({inviter: args.username, created_at: { $gte: new Date(Date.now() - a_month)}}).count();
        const aDay = await User.find({inviter: args.username, created_at: { $gte: new Date(Date.now() - a_day)}}).count();


        return {LT: lifeTime, H24: aDay, D30: aMonth, Y1: aYear}
    }
}

module.exports = {get_customers_info}