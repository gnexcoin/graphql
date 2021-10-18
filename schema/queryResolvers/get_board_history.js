const { GraphQLInt, GraphQLList } = require("graphql");
const User = require("../../models/User");
const { InviterBoardType } = require("../../types")


const get_board_history = {
    type: new GraphQLList(InviterBoardType),
    async resolve(parent, args) {

        const result = await User.aggregate([
            {
              '$group': {
                '_id': '$inviter', 
                'count': {
                  '$sum': 1
                }
              }
            }
          ]).limit(50)
          result.sort((a, b)=> b.count - a.count)
        return result

    }
}

module.exports = {get_board_history}