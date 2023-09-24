const express = require('express');
const app = express();
const server = require('http').createServer(app);
const { Server } = require('socket.io');
const io = new Server(server);
let room = 0;
app.get('/', (req, res) => {
    room++;
    res.sendFile(__dirname + '/index.html');
})
//Whenever someone connects this gets executed
io.on('connection', socket => {
    console.log('User connected. Socket Id ' + socket.id);
    socket.emit('Notification','User connected. Socket Id ' + socket.id);
    socket.broadcast.emit('Notification','User: ' + socket.id + ' connected.');


    // when a user sends a message, broadcast it to all other users
    socket.on('message', message => {
        socket.emit('Notification','Server get a message' + message);
        //Send message to all client except the sender.
        socket.broadcast.emit('message', message);
    })

    // Start Ignore Code
    // Send a message after a time
    setTimeout(function(){
        // Sending an object when emmiting an event
        socket.emit('testerEvent', 'This message was sent after 4 seconds. Send By server.');
    }, 4000);
    //Listen from client
    socket.on('clientEvent', function(data){
        socket.emit('Notification','Server get a clientEvent' + data);
    });
    // End Ignore Code

    socket.join("room-"+room);
    socket.emit('Notification',"Joined room-"+room);
    //socket.leave("room-"+1);

    socket.on("disconnecting", (reason) => {
        console.log('Disconnecting: ' + socket.id);
        for (const room of socket.rooms) {
            if (room !== socket.id) {
                socket.to(room).emit("user has left", socket.id);
            }
        }
    });

    //Start Test Socket Callback or Server Acknowledgement
    socket.emit("update item", "1", { name: "updated" }, (response) => {
        console.log(response.status);
    });
    //End Test Socket Callback or Server Acknowledgement

    //Whenever someone disconnects this piece of code executed
    socket.on('disconnect', reason => {
        console.log('Disconnect: ' + socket.id + '. Reason '+ reason);
        socket.emit('Notification','Disconnect: ' + socket.id + '. Reason '+ reason);
        socket.broadcast.emit('Notification','User: ' + socket.id + ' has left ');
        //io.emit('Notification','Disconnect: ' + socket.id + '. Reason '+ reason);
    })
});
app.get("/notificationToARoom", (req, res) => {
    const roomName = req.query.roomName;
    const message = req.query.message;
    io.to(roomName).emit('message',message);
    return res.send("Done");
})
app.get("/notificationToAllClient", (req, res) => {
    const message = req.query.message;
    console.log("notificationToAllClient. " + message);
    io.emit('message',message);
    //io.to("some room").emit("some event");
    //io.except("some room").emit("some event");
    //io.to("room1").to("room2").to("room3").emit("some event");
    return res.send("Done");
})
server.listen(3000, () => {
    console.log('Server listening on port 3000');
})