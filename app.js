const express = require("express");

// messaging
const http = require('http');
const socketio = require('socket.io');
const router = require('./router');


const {addNotification, getNotificationOfUser, clearNotifications} = require('./chat/notifications')
const {addpmessage, getpmessageOfUser, clearpmessages} = require('./chat/pmessages')


const { addMessage, getMessagesOfRoom, deleteMessage } = require('./chat/messages');
const {
  authUser, 
  getUserByUsername,
  removeSession, 
  randomString,
  joinGroup,
  leaveGroup,
  getUsersInRoom,
  cleanSockets
} = require("./chat/auth")

const {parseGroupid} = require("./chat/getGroupid")



// end messaging
const graphqlHTTP = require("express-graphql");
const schema = require("./schema/schema");
const cors = require("cors");
const mongoose = require("mongoose");
const app = express();
const bodyParser = require("body-parser");
const path = require("path");
const crypto = require("crypto");
const multer = require("multer");
const GridFsStorage = require("multer-gridfs-storage");
const Grid = require("gridfs-stream");
let { PrivateKey, key_utils } = require("voilk/lib/auth/ecc");

const mongoURI = process.env.MONGO_URL;
const FileURL = "https://graphql.voilk.com/image/";
const MongoClient = require("mongodb").MongoClient;
require('dotenv').config();
require("isomorphic-fetch");

/// messaging
const server = http.createServer(app);
const io = socketio(server);
// messaging

app.use(cors());
app.use(router);


const parseUsernames = (text) => {

  let usernames = []
let str = text.split(" ")
str.map(word => {
  if(word[0]=="@"){
    word = word.replace("@", "")
  usernames.push(word)
  }
  })
  //console.log(usernames)
  return usernames
}
const get_public_key = privWif => {
  var pubWif = PrivateKey.fromWif(privWif);
  pubWif = pubWif.toPublic().toString();
  return pubWif;
};
const verifykey = (e, p) => {
  let pub;
  try {
    pub = get_public_key(e);
  } catch (error) {
    return false;
  }
  if (pub === p) {
    return true;
  } else return false;
};
// for file and photos
app.use(bodyParser.json());
app.use(
  "/graphql",
  graphqlHTTP({
    schema,
    graphiql: true
  })
);

const promise = mongoose.connect(mongoURI, {   
  useNewUrlParser: true,
  useUnifiedTopology: true });
const conn = mongoose.connection;

// Init gfs
let gridFSBucket;
let gfs;

conn.once("open", () => {
  gfs = Grid(conn, mongoose.mongo);
  gridFSBucket = new mongoose.mongo.GridFSBucket(conn, {
    bucketName: 'uploads'
  });
  gfs.collection('uploads');
});
const validateFile = (file, cb) => {
  allowedFileTypes = /jpeg|jpg|png|gif/;
  const extension = allowedFileTypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimeType = allowedFileTypes.test(file.mimetype);
  if (extension && mimeType) {
    return cb(null, true);
  } else {
    cb("Invalid file type. Only JPEG, PNG and GIF file are allowed.");
  }
};
// Create storage engine
const storage = new GridFsStorage({
  db: promise,
  file: (req, file) => {
    return new Promise((resolve, reject) => {
      crypto.randomBytes(16, (err, buf) => {
        if (err) {
          return reject(err);
        }
        const filename = buf.toString("hex") + path.extname(file.originalname);

        var metadata = {
          originalname: file.originalname,
          fieldname: file.fieldname,
          encoding: file.encoding,
          mimetype: file.mimetype,
          // get this information somehow
          //username : file.metadata.username,
          fileurl: FileURL + filename
        };
        const fileInfo = {
          filename: filename,
          bucketName: "uploads",
          metadata: metadata
        };
        resolve(fileInfo);
      });
    });
  }
});
const upload = multer({
  storage: storage,
  //limits: { fileSize: 200000 },
  fileFilter: function(req, file, callback) {
    validateFile(file, callback);
  }
});
// @route POST /upload
// @desc  Uploads file to DB

app.post("/upload/:username/:key", upload.single("file"), (req, res) => {
  // let fileurl = "http://localhost:5000/image/" + req.file.filename;
  let file = req.file;
  let params = req.params;
  let key = params.key;

  file.username = params.username;
  MongoClient.connect(mongoURI,{ useNewUrlParser: true }, function(err, db) {
    if (err) throw err;
    var dbo = db.db("voilk");
    var query = { filename: file.filename };
    dbo
      .collection("uploads.files")
      .updateOne(query, { $set: { username: params.username } });
    db.close();
  });
  res.json({ file });
    
});
app.post('/upload/files/:username/:key', upload.array('photos', 20), function (req, res, next) {
    // req.files is array of `photos` files
    // req.body will contain the text fields, if there were any
    let files = req.files;
    let params = req.params;
    let key = params.key;
    let username = params.username;
    
    let authenticate = new Promise((resolve, reject) => {

    fetch('http://localhost:4000/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: '{ account(name: "'+username+'") { name posting {key_auths}} }' }),
    })
    .then(res => res.json())
    .then(res => {
        let data = res.data.account;

        if(data!==null)
        {
          if(data.name=="null"){
            resolve({authenticated: false})
          }
          let pb = data.posting.key_auths[0][0];
          let u = data.name;
          let e = verifykey(key, pb);
          if (e==true&&u==username)
          {
             resolve({
                 authenticated: true,
                 public_key: pb,
                 private_key: key
             })
          }
          else {
            resolve({authenticated: false})
          }
        }
        else { resolve({authenticated: false})}
    })
    })
    
    authenticate.then(x => {
      if(x.authenticated){
        MongoClient.connect(mongoURI,{ useNewUrlParser: true }, function(err, db) {
          if (err) throw err;
          var dbo = db.db("voilk");
          files.forEach(file => {
            file.username = params.username;
            var query = { filename: file.filename };
            dbo
            .collection("uploads.files")
            .updateOne(query, { $set: { username: params.username } });
          })
          
          db.close();
        });
        res.json({ files});
      }
      else
      res.json({ files})
    })    

    
})
app.post('/upload/files/', upload.array('photos', 20), function (req, res, next) {
  // req.files is array of `photos` files
  // req.body will contain the text fields, if there were any
  let files = req.files;
  res.json({ files})

  
})
// @route GET /image/:filename
// @desc Display Image
app.get('/image/:filename', (req, res) => {
    gfs.files.findOne({ filename: req.params.filename }, (err, file) => {
      // Check if file
      if (!file || file.length === 0) {
        return res.status(404).json({
          err: 'No file exists'
        });
      }
      console.log(file, err)
  
      // Check if image
      if (file.contentType === 'image/jpeg' || 
      file.contentType === 'image/png' ||
      file.contentType === 'image/jpg' ||
      file.contentType === 'image/gif'
      ) {
        // Read output to browser
        
        const readstream = gridFSBucket.openDownloadStream(file._id);
        //gfs.createReadStream(file.filename);
        readstream.pipe(res);
      } else {
        res.status(404).json({
          err: 'Not an image'
        });
      }
    });
  });

  io.on('connection', (socket) => {

    socket.on("join", async (data, callback) => {
        console.log("A user wants to join a room " + socket.id)
        // check if data is null


        if(!data) {
            callback("Invalid request code [123]")
            return
        }

        let {username, groupid, key} = data

        if(!username || !groupid || !key ) {
            callback("Username, groupid and key are required.")
            return
        }

        const result = await authUser(username, key, socket.id)

        if(result.error){
            callback(result.error)
            return false
        }

        cleanSockets(Object.keys(io.sockets.sockets), username)


        groupid = parseGroupid(groupid, username)

        if(!groupid){
          callback("You are not allowed in this group!!")
          return false
        }

        console.log("Joined ", groupid)
        //console.log(result)
        socket.join(groupid)
        const result1 = joinGroup(username, groupid)

        if(result1.error){
            callback(result1.error)
            return false
        }


        /// send messages to all sessions
        let newMEssage = {
            username: "admin", 
            text: `Welcome ${result.username}! to ${groupid}`,
            profile_image: "https://image.flaticon.com/icons/svg/1372/1372315.svg", 
            id: randomString("M"), 
            groupid,
            created_at: new Date()}

        let m = getMessagesOfRoom(groupid)
        let u = getUsersInRoom(groupid)

        let n = getNotificationOfUser(username)
        let pn = getpmessageOfUser(username)

        console.log("Notifications: ")
        console.log(n)

        io.to(socket.id).emit("roomdata", m)
        io.to(groupid).emit("roomusers", u)
        io.to(socket.id).emit("message", newMEssage)
        if(n)
        io.to(socket.id).emit("notifications", n)

        if(pn)
        io.to(socket.id).emit("pmessages", pn)
        callback();
        return
  
    })

    socket.on("send_message", async (data, callback) => {

        console.log("Received a message from " + socket.id)
        // check if data is null

        if(!data) {
            callback("Invalid request code [123]")
            return
        }

        let {username, groupid, key, text} = data

        if(!username || !groupid || !key || !text ) {
            callback("Username, groupid and key are required.")
            return
        }

        groupid = parseGroupid(groupid, username)

        /// check if user exists and it has joined the group
        const user = getUserByUsername(username)

        if(!user){
            callback("Looks like you are not signed in")
            return
        }


        if(!user.groups.includes(groupid)){
            callback("You must join the group first..")
            return
        }

        const result = await authUser(username, key, socket.id)

        if(result.error){
            callback(result.error)
            return false
        }


        if(groupid.includes(":")){
          let users = groupid.split(":")

          if(users.length==2){
            let user1 = users[0]
            let user2 = users[1]

            if(user1===username) {

              let msg_user = getUserByUsername(user2)
              if(msg_user){

                let pms = { 
                  to: user2, 
                  from: username, 
                  text, 
                  profile: user.profile_image, 
                  groupid, created_at: new Date() }

                const {pmessage, error} = addpmessage(pms, groupid)
                console.log(pmessage)

                if(pmessage){
                  if(msg_user.sessions){
                    msg_user.sessions.forEach(item => {
                      io.to(item).emit("pmessage", pmessage)
                    })
                  }
                }

              }

            } else if( user2 ===username) {
              let msg_user = getUserByUsername(user1)
              if(msg_user){

                let pms = { 
                  to: user1, 
                  from: username, 
                  text, 
                  profile: user.profile_image, 
                  groupid, created_at: new Date() }

                const {pmessage, error} = addpmessage(pms, groupid)

                console.log(pmessage)
                if(pmessage){
                  if(msg_user.sessions){
                    msg_user.sessions.forEach(item => {
                      io.to(item).emit("pmessage", {pmessage})
                    })
                  }
                }

              }
            }

          }
        }

        
        let newMEssage = {
            username, 
            profile_image: result.profile_image, 
            about: result.about, 
            groupid,
            text, 
            id: randomString("M"), 
            created_at: new Date()
        }

        const {newMSG, error} = addMessage(newMEssage, groupid)
        if(error){
            callback(error)
            return
        }

        /// Get mentions in the text

        const usernames = parseUsernames(text)


        /// trim array to unique elements
        const unique_usernames = usernames.filter((v, i, a) => a.indexOf(v) === i); 

        console.log(unique_usernames)

        unique_usernames.forEach(usr => {

          let ntf = {
            to: usr, 
            from: username, 
            text: `${username} has mentioned you in ${groupid}`, 
            profile: result.profile_image, 
            created_at: new Date()
          }

          const {notification, error} = addNotification(ntf, groupid)

          if(notification){
            let n_user = getUserByUsername(usr)
            if(n_user){
              if(n_user.sessions){
                n_user.sessions.forEach(session =>{
                  console.log("Emitting notification ...", session)
                  io.to(session).emit("notification", {notification: ntf})
                })
              }
            }
          }

        })

        io.to(groupid).emit("message", newMSG)

    })

    socket.on("delete_message", async (data, callback) => {
        console.log("Delete message request ...")

        if(!data) {
            callback("Invalid request code [123]")
            return
        }

        let {username, id, key, groupid} = data

        if(!username || !id || !key || !groupid ) {
            callback("Username, message and key are required.")
            return
        }

        const result = await authUser(username, key, socket.id)

        if(result.error){
            callback(result.error)
            return false
        }

        const msg = deleteMessage(id, groupid, username)

        if(msg.error){
            callback(msg.error)
            return false
        }

        io.to(groupid).emit("remove_message_user", id)
    })

    socket.on("leave", async (data, callback) => {
        console.log("Leave group request ...")
        if(!data) {
            callback("Invalid request code [123]")
            return
        }

        let {username, key, groupid} = data

        if(!username || !key || !groupid ) {
            callback("Username, message and key are required.")
            return
        }

        const result = await authUser(username, key, socket.id)

        if(result.error){
            callback(result.error)
            return false
        }

        const result1 = leaveGroup(username, groupid)

        if(result1.error){
            callback(result1.error)
            return false
        }

        const u = getUsersInRoom(groupid)
        io.to(groupid).emit("roomusers", u)
    })

    socket.on("disconnect", () => {
        const user = removeSession(socket.id)  
        //console.log(user)      
    })

  });

server.listen(process.env.PORT || 4000, () => console.log(`Server has started.`));
// app.listen(4000, () => {
//   //console.log("Listening");
// });
