let pmessages = [];
let MAX_LENGTH = 50
/*
[
    { username: "", pmessages: [
        { to, from, text, profile, groupid, created_at }
    ]}
]
*/

const addpmessage = (data, groupid) => {
  
    const {to, from, text, profile, created_at} = data

    if(!from || !groupid || !text) return { error: 'Username, message and groupid are required.' };
    var x = pmessages.find(pmessage => pmessage.username == to)
    const pmessage = { to, from, text, profile, groupid, created_at };

    if(x){
        x.pmessages.push(pmessage)
        if(x.pmessages.length>MAX_LENGTH)
        x.pmessages.shift()
    }
    else{
        var newentry = {username: to, pmessages: [pmessage]}
        pmessages.push(newentry)
    }
  
    console.log(pmessages)
    return { pmessage };

}

const clearpmessages = (username) => {
    var x = pmessages.find(pmessage => pmessage.username == username)
    x.pmessages = []
}

const getpmessageOfUser = (username) => {
    var x = pmessages.find(pmessage => pmessage.username == username)
    console.log(pmessages)
    if(x)
    return x.pmessages
    else return false
}


module.exports = { addpmessage, getpmessageOfUser, clearpmessages }