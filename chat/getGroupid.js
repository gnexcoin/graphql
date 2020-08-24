
const parseGroupid  = (id, username) => {

    if(id.includes(":")){
        let chat_users = id.split(":")
        if(chat_users.includes(username)&&chat_users.length==2){
              //console.log(result)

              let gid = chat_users.sort().toString().replace(",", ":")
              return gid;
        } return null
    }
    else return id
}

module.exports = {parseGroupid}