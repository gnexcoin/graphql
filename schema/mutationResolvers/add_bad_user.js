const { GraphQLString } = require("graphql")
const { BadUser } = require("../../models")
const assert = require("assert")
const { authorize } = require("../../constants/authenticate")
const { BadUserType } = require("../../types/BadUserType")
require('dotenv').config();

const add_bad_user = {
    type: BadUserType,
    args: {
        username: {type: GraphQLString},
        wif: {type: GraphQLString},
        bad: {type: GraphQLString}
    },
    async resolve(parent, args){
        

        let auth = await authorize(args.username, args.wif)
        assert(auth, "Could not authorize.")
        
        assert(args.username === "voilk" || args.username === "bilal", "You can't do this")

        let pack = new BadUser({
            username: args.bad
        })
        return pack.save()
    }
}

module.exports = {add_bad_user}