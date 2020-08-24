let notifications = [];
let MAX_LENGTH = 50
/*
[
    { username: "", notifications: [
        { to, from, text, profile, groupid, created_at }
    ]}
]
*/

const addNotification = (data, groupid) => {
  
    const {to, from, text, profile, created_at} = data

    if(!from || !groupid || !text) return { error: 'Username, message and groupid are required.' };
    var x = notifications.find(notification => notification.username == to)
    const notification = { to, from, text, profile, groupid, created_at };

    if(x){
        x.notifications.push(notification)
        if(x.notifications.length>MAX_LENGTH)
        x.notifications.shift()
    }
    else{
        var newentry = {username: to, notifications: [notification]}
        notifications.push(newentry)
    }
  
    console.log(notifications)
    return { notification };

}

const clearNotifications = (username) => {
    var x = notifications.find(notification => notification.username == username)
    x.notifications = []
}

const getNotificationOfUser = (username) => {
    var x = notifications.find(notification => notification.username == username)
    console.log(notifications)
    if(x)
    return x.notifications
    else return false
}


module.exports = { addNotification, getNotificationOfUser, clearNotifications }