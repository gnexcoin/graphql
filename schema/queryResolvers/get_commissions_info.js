const { GraphQLString } = require("graphql")
const { authorize } = require("../../constants/authenticate")
const { InfoType } = require("../../types")
const assert = require("assert")
const { Commission } = require("../../models")

const get_commissions_info = {
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


        const year_s = await Commission.aggregate([
            {
              '$match': {
                'to': args.username, 
                'created_at': { $gte: new Date(Date.now() - a_year)}
              }
            }, {
              '$group': {
                '_id': null, 
                'count': {
                  '$sum': '$commission'
                }
              }
            }
          ])

          const month_s = await Commission.aggregate([
            {
              '$match': {
                'to': args.username, 
                'created_at': { $gte: new Date(Date.now() - a_month)}
              }
            }, {
              '$group': {
                '_id': null, 
                'count': {
                  '$sum': '$commission'
                }
              }
            }
          ])

          const day_s = await Commission.aggregate([
            {
              '$match': {
                'to': args.username, 
                'created_at': { $gte: new Date(Date.now() - a_day)}
              }
            }, {
              '$group': {
                '_id': null, 
                'count': {
                  '$sum': '$commission'
                }
              }
            }
          ])

          const life_s = await Commission.aggregate([
            {
              '$match': {
                'to': args.username
              }
            }, {
              '$group': {
                '_id': null, 
                'count': {
                  '$sum': '$commission'
                }
              }
            }
          ])
          console.log("life", life_s)
          console.log("day", day_s)
          console.log("month", month_s)
          console.log("year", year_s)

        return {
            LT: life_s.length>0?life_s[0].count:0,
             H24: day_s.length>0?day_s[0].count:0, 
             D30: month_s.length>0?month_s[0].count:0, 
             Y1: year_s.length>0?year_s[0].count:0
            }
    }
}

module.exports = {get_commissions_info}