const { GraphQLString } = require("graphql")
const { BadUser } = require("../../models")
const assert = require("assert")
const { authorize } = require("../../constants/authenticate")
const { BadUserType } = require("../../types/BadUserType")
const { UDeleteType } = require("../../types/UDeleteType")
require('dotenv').config();

const remove_bad_user = {
    type: UDeleteType,
    args: {
        username: {type: GraphQLString},
        wif: {type: GraphQLString},
        bad: {type: GraphQLString}
    },
    async resolve(parent, args){

        let auth = await authorize(args.username, args.wif)
        assert(auth, "Could not authorize.")
        assert(args.username === "voilk" || args.username === "bilal", "You can't do this")

        let pack = await BadUser.deleteOne({username: args.bad})
        console.log(pack)
        assert(pack, "Could not delete")
        return pack
    }
}

module.exports = {remove_bad_user}