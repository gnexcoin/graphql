
const { authorize } = require("../../constants/authenticate")
const { DataType } = require("../../types")
const assert = require("assert")
const { GraphQLString, GraphQLList } = require("graphql")
const User = require("../../models/User")

const get_customers_data = {
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

        const result = await User.aggregate([
            {
              '$match': {
                'inviter': args.username, 
                'creation_time': {
                  '$gte': new Date(`01-01-${curr_year}`)
                }
              }
            }, {
              '$group': {
                '_id': {
                  '$month': '$creation_time'
                }, 
                'count': {
                  '$sum': 1
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

module.exports = {get_customers_data}
