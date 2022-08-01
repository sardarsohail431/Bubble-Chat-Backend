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

const addUser=(uid,socketId,name,peerId)=>{
    !userCart.some((user)=>user.uid===uid) &&
    userCart.push({uid,socketId,name,peerId})
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
  socket.on('nUser',({uid,name,peerId})=>{
      console.log("ran")
      addUser(uid,socket.id,name,peerId);
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

  socket.on("groupCallIncoming",({initiatorName,initiator,admin,members,roomId,callType,groupImg,groupName,groupId})=>{
    socket.join(roomId)
    members.forEach((member)=>{
        const findSocket = getUser(member)
        if(findSocket){
            io.to(findSocket.socketId).emit("groupCallComing",{initiator,initiatorName,admin,roomId,callType,groupImg,groupName,groupId})
        }
    })
  })

  socket.on("joinRoom",(data)=>{
   socket.join(data.roomId)
   socket.broadcast.to(data.roomId).emit('userCame',data)
  })

//   socket.on("getDetails",({peerId,id})=>{
//     const filter = userCart.filter((item)=>item.peerId===peerId)
//     const filteredItem = filter[0]
//     console.log(filteredItem)
//     const userToSend = getUser(id)
//     if(userToSend){
//         io.to(userToSend.socketId).emit("takeDetails",{
//             user:filteredItem?.uid,
//             peerId:filteredItem.peerId,
//             name:filteredItem.name
//         })
//     }
//   })

  socket.on("groupInitiatorLeft",(mems)=>{
      mems.forEach((member)=>{
          const Member = getUser(member)
          if(Member){
              io.to(Member.socketId).emit("CallCanc")
          }
      })
  })

  socket.on("groupCallEnd",({peers,removedPeer})=>{
      peers.forEach((peer)=>{
          const filterPeer = userCart.filter((user)=>user.peerId===peer)
          const filterObj = filterPeer[0]
          if(filterObj){
              io.to(filterObj.socketId).emit("checkEnd",removedPeer)
          }
      })
  })

  socket.on("videoOff",({id,peerz})=>{
    peerz.forEach((peer)=>{
        const sockId = userCart.filter((item)=>item.peerId===peer)[0]
        if(sockId){
            io.to(sockId.socketId).emit("vidOff",id)
        }
    })
  })

  socket.on("audioOff",({id,peerz})=>{
    peerz.forEach((peer)=>{
        const sockId = userCart.filter((item)=>item.peerId===peer)[0]
        if(sockId){
            io.to(sockId.socketId).emit("audOff",id)
        }
    })
  })

  socket.on("videoOn",({id,peerz})=>{
    peerz.forEach((peer)=>{
        const sockId = userCart.filter((item)=>item.peerId===peer)[0]
        if(sockId){
            io.to(sockId.socketId).emit("vidOn",id)
        }
    })
  })

  socket.on("audioOn",({id,peerz})=>{
    peerz.forEach((peer)=>{
        const sockId = userCart.filter((item)=>item.peerId===peer)[0]
        if(sockId){
            io.to(sockId.socketId).emit("audOn",id)
        }
    })
  })


  socket.on('disconnect',()=>{
      const gettingUser = userCart.filter((item)=>item.socketId===socket.id)
      removeUser(socket.id)
      userCart.forEach((user)=>{
       io.to(user.socketId).emit("userOut",gettingUser[0]?.uid)
       io.to(user.socketId).emit("groupUserOut",gettingUser[0]?.peerId)
      })
      console.log(userCart)
  })
});

server.listen(process.env.PORT || 5000)