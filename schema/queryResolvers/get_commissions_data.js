
const { authorize } = require("../../constants/authenticate")
const { DataType } = require("../../types")
const assert = require("assert")
const { GraphQLString, GraphQLList } = require("graphql")
const { Commission } = require("../../models")

const get_commissions_data = {
    type: new GraphQLList(DataType), 
    args: {
        username: {type: GraphQLString},
        wif: {type: GraphQLString}
    },
    async resolve(parent, args) { 
        let auth = await authorize(args.username, args.wif)
        assert(auth, "Could not authorize.")

        let curr_year = (new Date()).getFullYear()
        let curr_month = (new Date()).getMonth()
        let labels = []
        let months = [
            "January", 
            "February", 
            "March", 
            "April", 
            "May", 
            "June", 
            "July", 
            "August", 
            "September", 
            "October", 
            "November", 
            "December"
        ]

        const result = await Commission.aggregate([
            {
              '$match': {
                'to': args.username,
                'created_at': {
                    '$gte': new Date(`01-01-${curr_year}`)
                }
              }
            }, {
              '$group': {
                '_id': {
                  '$month': '$created_at'
                }, 
                'count': {
                  '$sum': '$commission'
                }
              }
            }
          ])
          const rest = []
          result.sort((a, b)=> a._id - b._id).map(res => {
              let item = {
                  x: months[res._id-1] + " " + curr_year,
                  y: res.count
              }
              rest.push(item)
          }) 
        return rest
    }
}

module.exports = {get_commissions_data}