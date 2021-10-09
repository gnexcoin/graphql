const { GraphQLList, GraphQLString, GraphQLInt } = require("graphql")
const { authorize } = require("../../constants/authenticate")
const { packages } = require("../../mock/packages")
const { PackageType, PackagePaginateType } = require("../../types")
const assert = require("assert")
const { Package } = require("../../models")

const get_package_history_p = {
    type: PackagePaginateType,
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
        return Package.paginate({username: args.username}, options).then(result => {
            return result;
        })

    }
}


const get_package_history = {
    type: new GraphQLList(PackageType),
    args: { 
        username: {type: GraphQLString},
        wif: {type: GraphQLString}
    },  
    async resolve(parent, args) { 
        let auth = await authorize(args.username, args.wif)
        assert(auth, "Could not authorize.")
        const pkg = await Package.find({username: args.username}).sort({created_at: -1}).limit(5)

        return pkg;
    }
}

module.exports = {get_package_history, get_package_history_p}