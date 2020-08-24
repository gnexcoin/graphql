let messages = [];
/*

[
    {groupid: "photography", messages: []}
]

*/
let MAX_LENGTH = 200

const addMessage = ({id, username, text, profile_image, about, groupid, created_at}) => {
  
    if(!username || !groupid || !text) return { error: 'Username, message and groupid are required.' };
  

    var x = messages.find(msg => msg.groupid == groupid)
    var newMSG = { id, username, text, profile_image, about, created_at, groupid };

    if(x){
        x.messages.push(newMSG)
        if(x.messages.length>MAX_LENGTH)
        x.messages.shift()
    }
    else{
        var newentry = {groupid: groupid, messages: [newMSG]}
        messages.push(newentry)
    }
  
    return { newMSG };

}

const deleteMessage = (id, groupid, username) =>{

    let group = messages.find(msg => (msg.groupid === groupid))
    if (!group) return {error: "Can't find the group..."}

    let msgIndex = group.messages.findIndex((msg) => (msg.id === id&&msg.username=== username));
    if(msgIndex !== -1) {
        return group.messages.splice(msgIndex, 1)[0];
    }
    else return {error: "You can't delete this.."}

} 

const getMessagesOfRoom = (groupid) => {
    var x = messages.find(msg => msg.groupid == groupid)
    if(x)
    return x.messages
    else return []
};


module.exports = { addMessage, getMessagesOfRoom, deleteMessage }