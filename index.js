import { Server } from "socket.io";
import {createServer} from 'http'
import express from "express";


const app = express()
const server = createServer(app)
const io = new Server(server,{ 
    cors: {
        origin: '*',
      }
});


app.get('/',(req,res)=>{
    res.send("App Listening Success!")
})

let userCart=[];

const addUser=(uid,socketId)=>{
    !userCart.some((user)=>user.uid===uid) &&
    userCart.push({uid,socketId})
}

const removeUser=(socketId)=>{
    userCart = userCart.filter((user)=>user.socketId!==socketId);
}

const getUser=(uid)=>{
    return userCart.find((user)=>user.uid===uid);
}

io.on("connection", (socket) => {
    console.log('App Connected')
    console.log(userCart)
  socket.on('nUser',(uid)=>{
      addUser(uid,socket.id);
      console.log('nUser',userCart)
  })

  socket.on('callIncoming',({caller,callerName,callerImg,callType,CallerpeerId,callee})=>{
    const callea = getUser(callee)
    if(callea){
        io.to(callea.socketId).emit("callComing",{caller,callerName,callerImg,callType,CallerpeerId})
    }
  })

  socket.on("clientCancelled",(caleeId)=>{
      const callee = getUser(caleeId)
      if(callee){
          io.to(callee.socketId).emit("ClientCancel")
      }
  })

  socket.on("calleeDeclined",(callerId)=>{
    const caller = getUser(callerId)
    if(caller){
        io.to(caller.socketId).emit("calleeCancel")
    }
  })

// Adding Peer Value In UserCart
//   socket.on("addPeer",({peerId,id})=>{
//    const filter = userCart.filter((item)=>item.uid===id)
//    const newObj = filter[0]
//    const reformObj = {
//        ...newObj,
//        peerId
//    }
//    const filter2 = userCart.filter((item)=>item.uid!==id)
//    userCart=[...filter2,reformObj]
//    console.log(userCart,'uc')
//   })

 socket.on("callAccepted",({id,peerId})=>{
    const otherUser = getUser(id)
    if(otherUser){
        io.to(otherUser.socketId).emit("callAcceptHandler",peerId)
    }
 })

 socket.on("callClosed",({id,peerId})=>{
    const otherUser = getUser(id)
    if(otherUser){
        io.to(otherUser.socketId).emit("callEndHandler",peerId)
    }
 })

  socket.on("calleeBusy",(callerId)=>{
    const caller = getUser(callerId)
    if(caller){
        io.to(caller.socketId).emit("calleeisBusy")
    }
  })

  socket.on('checkOnline',async({receiverId,senderId})=>{
      let online;
     const receiver = await getUser(receiverId)
     const sender = userCart.filter((i)=>i.uid===senderId);
     const sandar = sender[0]

     if(!receiver){
        online = false;
     }
     else{
        online = true;
     }
     if(sandar){
        io.to(sandar.socketId).emit('onlineStatus',{online,receiver})
     }
  })

  socket.on('createGroup',(ids)=>{
      console.log(ids,'ids')
  ids?.forEach((id)=>{
   const getingUser = getUser(id)
   io.to(getingUser?.socketId).emit("YouAdded")
  })
  })

  socket.on("messageCame",(id)=>{
     const otherUser = userCart.filter((item)=>item.uid===id)
     const otherUserID = otherUser[0]
     if(otherUserID){
        io.to(otherUserID.socketId).emit("msgHandle")
     }
  })

  socket.on("messageCameGroup",({convId,members})=>{
    members.forEach((member)=>{
      const getuser = getUser(member)
      if(getuser){
          io.to(getuser.socketId).emit("msgHandleGroup")
      }
    })
 })

  socket.on("youAdmin",({id,convId,users})=>{
      users.forEach((user)=>{
        const otherUser = getUser(user)
        io.to(otherUser?.socketId).emit("adminHandle",{id,convId})
      })
  })

  socket.on("youUser",({id,convId,users})=>{
    users.forEach((user)=>{
        const otherUser = getUser(user)
        io.to(otherUser?.socketId).emit("userHandleAdd",{id,convId})
      })
  })

  socket.on("adminRem",({id,convId,users})=>{
    users.forEach((user)=>{
        const otherUser = getUser(user)
        io.to(otherUser?.socketId).emit("removeHandle",{id,convId})
      })
  })

  socket.on("memRem",({id,convId,users})=>{
     users.forEach((user)=>{
        const otherUser = getUser(user)
        io.to(otherUser?.socketId).emit("removeUserHandle",{id,convId})
     })
  })


  socket.on('disconnect',()=>{
      console.log(userCart)
      const gettingUser = userCart.filter((item)=>item.socketId===socket.id)
      removeUser(socket.id)
      userCart.forEach((user)=>{
       io.to(user.socketId).emit("userOut",gettingUser[0]?.uid)
      })
  })
});

server.listen(5000)