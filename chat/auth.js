let { PrivateKey, key_utils } = require('voilk/lib/auth/ecc');
let users = []
require("isomorphic-fetch")

/*

[{
    username,
    postingkey,
    profile_image,
    about,
    sessions: [id],
    groupids: [groupid],
    join_time: new Date()
}]
*/
function get_public_key(privWif) {

    if (/^[0-9A-Za-z]+$/.test(privWif))
    {
        var pubWif = PrivateKey.fromWif(privWif);
        pubWif = pubWif.toPublic().toString();
        return pubWif;
    }
    else {
        return false
    }

}
function authUser(username, key, id){

    if(!username || !key) return {error: "Invalid username or Key"}
    let postingkey = get_public_key(key)
    if(!postingkey) return {error: "Invalid posting key"}

    let found = users.find((userkey) => ( userkey.username==username && userkey.postingkey == postingkey ))
    if(found) {

        let sess = found.sessions.includes(id)
        if(!sess){
            found.sessions.push(id)
        }
        return found
    }

    let authPromise = new Promise((resolve, reject) => {
        fetch('http://gnexportal.com/graphql', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                query: `{ 
                    account(name: "${username}") 
                    { 
                        id
                        name
                        json_metadata {
                          profile_image
                          about
                        }
                        posting {
                          weight_threshold
                          key_auths
                        }
                        user_muted
                        user_ignored
                        user_followers
                        user_following
                        
                    }
                }` 
            }),
        })
        .then(res => res.json())
        .then(res => {
            if(res.data.account!==null)
            {
                let pb = res.data.account.posting.key_auths[0][0];
                let profile_image = res.data.account.json_metadata.profile_image
                let about = res.data.account.json_metadata.about
                let muted = res.data.account.user_muted
                let ignored = res.data.account.user_ignored
                let followers = res.data.account.user_followers
                let following = res.data.account.user_following

                console.log(pb)
                if(pb==postingkey){

                    let newUser = {
                        username,
                        postingkey,
                        profile_image,
                        about,
                        muted,
                        ignored,
                        followers,
                        following,
                        groups: [],
                        join_time: new Date(),
                        sessions: [id]
                    }
                    
                    users.push(newUser)
                    resolve(newUser)
                } else reject({error: "Could not verify.."})
            } else reject({error: "Could not Connect."})
        })
    })

    return authPromise.then(x => {
        if(x){
            return x
        }
        else {
            return x
        }
    }).catch(error => {
        console.log(error)
        return error
    })
}

function removeSession(id){

    console.log("Removing: " , id)
   
    let user = users.map(user => {
        if(user.sessions.includes(id)) return user
    })

    
    if(user[0])
        {
        const index = user[0].sessions.findIndex((session) => session === id);
        if(index !== -1) {
        let se = user[0].sessions.splice(index, 1)[0];

        if(se===id){
            return user[0]
        }
        }
    }
}

function cleanSockets(active, username){
    let user = users.find(user => user.username === username)
    if(user){
        if(user.sessions) {
            user.sessions.forEach(element => {
                if(!active.includes(element)){
                    const index = user.sessions.findIndex((session) => session === element);
                    let cl = user.sessions.splice(index, 1)[0];
                    //console.log(cl)
                }
            });
        }
    }
}

function joinGroup(username, groupid){
    const user = users.find(user => user.username==username)
    if(user){
        if(!user.groups){
            user.groups = [groupid]
            return true
        }
        else {
            if(!user.groups.includes(groupid)){
                user.groups.push(groupid)
                return true
            }
            else {
                return true
            }
        }
    }
    else return {error: "Could not find user.."}

    
}

function leaveGroup(username, groupid){
    const user = users.find(user => user.username==username)
    if(user){
        if(user.groups) {
        if(user.groups.includes(groupid)){
            const index = user.groups.findIndex((group) => group === groupid);
            if(index !== -1) return user.groups.splice(index, 1)[0];
        }
        else return {error: "You already left the group.."}
        }
        else return {error: "You don't exist in this group.."}
    }
    else return {error: "Could not find user.."}
}

function removeUserByUsername(username){
    const index = users.findIndex((userkey) => userkey.username === username);
    if(index !== -1) return users.splice(index, 1)[0];
}

function getUser(id){
    let userKey = users.find((user) => user.sessions.includes(id))
    return userKey
}

function getUserByUsername(username){
    let userKey = users.find((user) => user.username === username)
    return userKey
}

function getUsersInRoom(groupid){
    let newUSers = users.filter((user) => user.groups.includes(groupid))
    return newUSers
}

function updateKey(username, key){
    
    if(!username || !key ) return {error: "Invalid username or key "}
    let postingkey = get_public_key(key)

    if(!postingkey) return {error: "Invalid posting key"}

    let userKey = users.find((userkey) => userkey.username == username)
    
    userKey.postingkey = postingkey

    return {userKey}
}

const randomString = (prefix="P") => {
    let pass = prefix + key_utils.get_random_key().toWif();
    return pass;
}

module.exports = {
    getUser,
    cleanSockets,
    getUserByUsername,
    getUsersInRoom,
    removeUserByUsername,
    joinGroup,
    leaveGroup, 
    updateKey, 
    authUser, 
    randomString, 
    removeSession
}
