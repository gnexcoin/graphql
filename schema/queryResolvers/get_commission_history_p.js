const { GraphQLList, GraphQLString, GraphQLInt } = require("graphql")
const { authorize } = require("../../constants/authenticate")
const { Commission } = require("../../models")
const { CommissionType, CommissionPaginateType } = require("../../types")
const assert = require("assert")

const get_commission_history_p = {
    type: CommissionPaginateType,
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
        return Commission.paginate({to: args.username}, options).then(result => {
            return result;
        })

    }
}

module.exports = {get_commission_history_p}