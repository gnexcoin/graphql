const { GraphQLString, GraphQLFloat, GraphQLInt, GraphQLList } = require("graphql")
const { authorize } = require("../../constants/authenticate")
const { TradeType } = require("../../types")
const assert = require("assert")
const voilk = require("voilk")

const open_sell = {
    type: new GraphQLList(TradeType),
    args: {
        username:   {type: GraphQLString},
        wif:        {type: GraphQLString},

        exchange_rate: {type: GraphQLFloat},
        amount: {type: GraphQLFloat},
        count: {type: GraphQLInt},
        step: {type: GraphQLFloat}
        
    },
    async resolve(parent, args){

        let auth = await authorize(args.username, args.wif)
        assert(auth, "Could not authorize.")

        let { exchange_rate, amount, count, step} = args
        console.log(args)
        if(count > 10) count = 10

        let amountToSell = amount.toFixed(3) + " VOILK"
        let receive = amount * exchange_rate
        let minToReceive = receive.toFixed(3) + " VSD"
        const fillOrKill = false
        const t28 = 28 * 24 * 60 * 60
        const current = Date.now() / 1000 | 0
        const expiration = current + t28
        let orderid = Math.floor(Math.random() * 10000000) + 10000;

        let orders = []
        for (let i = 0; i < count; i++) {
            if(i !=0 ) exchange_rate += step
            
            amountToSell = amount.toFixed(3) + " VOILK"
            receive = amount * exchange_rate
            minToReceive = receive.toFixed(3) + " VSD"
            orderid = Math.floor(Math.random() * 10000000) + 10000;
        
            
            let limit_order = new Promise((resolve, reject) => {
               voilk.broadcast.limitOrderCreate(
                args.wif, args.username, orderid, amountToSell, minToReceive, fillOrKill, expiration, function (err, result) {
                if (result && result.operations && result.operations.length > 0) {
                    console.log(result.operations[0][1])
                    resolve(result.operations[0][1])
                }
                }); 
            })
            await limit_order.then(x => orders.push(x))
            
        }
        return orders
    }
}

module.exports = {open_sell}