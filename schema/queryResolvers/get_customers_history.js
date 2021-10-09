const { GraphQLList, GraphQLString, GraphQLInt } = require("graphql")
const { authorize } = require("../../constants/authenticate")
const { ReferralType } = require("../../types")
const assert = require("assert")
const User = require("../../models/User")
const { ReferralPaginateType } = require("../../types/ReferralPaginateType")

const get_customers_history_p = {
    type: ReferralPaginateType,
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
            sort: { creation_time: -1 },
            page: args.page,
            limit: args.limit
        };
        return User.paginate({ inviter: args.username }, options).then(result => {
            return result;
        })

    }
}
const get_customers_history = {
    type: new GraphQLList(ReferralType), 
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
        let trns = await User.find({inviter: args.username })
        .sort({creation_time: -1})
        .limit(limit)
        return trns
    }
}

module.exports = {get_customers_history, get_customers_history_p}