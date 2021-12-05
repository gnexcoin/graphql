const { GraphQLString, GraphQLInt } = require("graphql")
const { packages } = require("../../constants/packages")
const { Package, Membership, Commission } = require("../../models")
const { PackageType } = require("../../types/PackageType")
const assert = require("assert")
const { authorize } = require("../../constants/authenticate")
const { account } = require("../../constants/account")
const User = require("../../models/User")
const { is_exists } = require("../../constants/is_exists")
const { transfer } = require("../../constants/transfer")
const voilk = require("voilk")

require('dotenv').config();
const USERNAME = process.env.USERNAME;
const PASSWORD = process.env.PASSWORD;

const activate_package = {
    type: PackageType,
    args: {
        username: {type: GraphQLString},
        wif: {type: GraphQLString},
        package_id: {type: GraphQLInt}
    },
    async resolve(parent, args){
        
        let pm = new Promise((resolve, reject) => {
            voilk.api.getMarketOrderBook(1, function(err, data) {
             //console.log(err, data);
             if(err) resolve(0)
             if(data && data.asks && data.asks.length >0)
             resolve(parseFloat(data.asks[0].real_price).toFixed(4));
             else resolve(0)
            });
        })
        let result = await pm 
        
        if(!result || result < 0.01) {
            result = 0.01
        }
        
        let newPackages = []
        packages.map(pk => {
            //console.log(pk)
            pk.cost = parseFloat(((pk.promoter_share + pk.buyer_share + pk.company_share)*result).toFixed(3))
            //console.log(pk)
            newPackages.push(pk)
        })

        let auth = await authorize(args.username, args.wif)
        assert(auth, "Could not authorize.")
        
        let planIndex = newPackages.findIndex(el => el.id === args.package_id)
        assert(planIndex !== -1, "This package does not exist.")

        let plan = newPackages[planIndex]
        let bal = await account(args.username)
        assert(bal >= plan.cost, "You don't have sufficient balance.")


        let user = await User.findOne({invitee: args.username})
        let promoter = "promoter"
        let company  = "company"
        if(user && user.inviter){
            promoter = user.inviter
        }

        const promoter_exist =  await is_exists(promoter)
        // const company_exist  =  await is_exists(company)

        assert(promoter_exist, "Promoter account does not exist.")

        const promoter_membership = await Membership.findOne({username: promoter})
        assert(promoter_membership, "Could not get promoter's membership")

        const amt = plan.cost.toFixed(3) + " VSD"
        console.log(args, company, amt, plan)
        const pay = await transfer(args.username, args.wif, company, amt, plan.type)
        assert(pay, "Could not pay the fee.")

        const promoter_s = (plan.promoter_share <= promoter_membership.max_commission)?plan.promoter_share:promoter_membership.max_commission
        const promoter_share = promoter_s.toFixed(3) + " VOILK"
        const buyer_share    = plan.buyer_share.toFixed(3) + " VOILK"
        const company_share = plan.company_share.toFixed(3) + " VOILK"

        const ps = await transfer(USERNAME, PASSWORD, promoter, promoter_share, plan.type)
        assert(ps, "Could not transfer promoter's share.")

        const psCom = new Commission({
            from: args.username,
            to: promoter,
            commission: promoter_s,
            created_at: new Date()
        })

        await psCom.save();

        const bs = await transfer(USERNAME, PASSWORD, args.username, buyer_share, plan.type)
        assert(bs, "Could not transfer buyer's share.")

        const bsCom = new Commission({
            from: args.username,
            to: args.username,
            commission: plan.buyer_share,
            created_at: new Date()
        })

        await bsCom.save();

        const cs = await transfer(USERNAME, PASSWORD, company, company_share, plan.type)
        assert(cs, "Could not transfer company's share.")

        const csCom = new Commission({
            from: args.username,
            to: company,
            commission: plan.company_share,
            created_at: new Date()
        })

        await csCom.save();

        let pack = new Package({
            username: args.username,
            type: plan.type,
            cost: plan.cost,
            created_at: new Date()
        })

        let mem = await Membership.findOne({username: args.username})
        
        mem.max_invites=mem.max_invites + plan.increment
        if(mem.max_withdrawal < plan.max_withdrawal)
        {
            mem.membership=plan.type
            mem.max_withdrawal= plan.max_withdrawal
        }
        
        if(mem.max_commission < plan.max_commission)
        mem.max_commission= plan.max_commission
        mem.updated_at= new Date()

        await mem.save()
        return pack.save()
    }
}

module.exports = {activate_package}