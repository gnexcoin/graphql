const { GraphQLList } = require("graphql")
const { DataType } = require("../../types")

const get_sales_data = {
    type: new GraphQLList(DataType), 
    resolve(parent, args) { 
        return [{x: "September",y: 40},{x: "October",y: 45},{x: "November",y: 70},{x: "December",y: 250},{x: "January",y: 45},{x: "February",y: 50}]
    }
}

module.exports = {get_sales_data}