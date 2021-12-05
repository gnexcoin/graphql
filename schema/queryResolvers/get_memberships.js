const { GraphQLList } = require("graphql")
const { packages } = require("../../constants/packages")
const { UPlanType } = require("../../types/UPlanType")
const voilk = require("voilk")

const get_memberships = {
    type: new GraphQLList(UPlanType), 
    async resolve(parent, args) { 
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
            pk.cost = ((pk.promoter_share + pk.buyer_share + pk.company_share)*result).toFixed(3)
            console.log(pk)
            newPackages.push(pk)
        })

        console.log(newPackages)
        return newPackages
    
    }
}

module.exports = {get_memberships}