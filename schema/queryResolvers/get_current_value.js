const { GraphQLString, GraphQLFloat } = require("graphql")
const voilk = require("voilk")


const get_current_value = {
    type: GraphQLFloat,
    async resolve(parent, args) { 
        let pm = new Promise((resolve, reject) => {
            voilk.api.getMarketOrderBook(1, function(err, data) {
             //console.log(err, data);
             if(err) resolve(0)
             if(data && data.asks && data.asks.length >0)
             resolve(parseFloat(data.asks[0].real_price).toFixed(2));
             else resolve(0)
            });
        })

        return pm
    }
}

module.exports = {get_current_value}