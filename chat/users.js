const users = [];

const addUser = ({ id, username, groupid, profile, about, join_time,
  followers, 
  following, 
  ignored, 
  muted  }) => {
  username = username.trim().toLowerCase();
  groupid = groupid.trim().toLowerCase();

  const existingUser = users.find((user) => user.groupid === groupid && user.username === username);

  if(!username || !groupid) return { error: 'Username and room are required.' };
  if(existingUser) return existingUser;

  const user = { id, username, groupid, profile, about, join_time,followers, 
    following, 
    ignored, 
    muted };
  //console.log(user)
  users.push(user);

  return { user };
}

const removeUser = (id) => {
  const index = users.findIndex((user) => user.id === id);

  if(index !== -1) return users.splice(index, 1)[0];
}
const removeUserbyName = (username) => {
  const index = users.findIndex((user) => user.username === username);

  if(index !== -1) return users.splice(index, 1)[0];
}

const getUser = (id) => users.find((user) => user.id === id);
const getUserbyName = (username) => users.find((user) => user.username === username);

const getUsersInRoom = (groupid) => users.filter((user) => user.groupid === groupid);


module.exports = { addUser, removeUser, removeUserbyName, getUser,getUserbyName, getUsersInRoom };