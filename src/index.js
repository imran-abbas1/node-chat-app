// importing installing packages
const path = require('path')
const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const Filter = require('bad-words')
const { generateMessage, generateLocationMessage } = require('./utils/messages')
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users')


const app = express()
const server = http.createServer(app)
const io = socketio(server)

const port = process.env.PORT || 3000
const publicDirectoryPath = path.join(__dirname, '../public')

app.use(express.static(publicDirectoryPath))

 //this will run n n. of times for n connection requests
io.on('connection', (socket) => {
    console.log('New WebSocket connection')

    socket.on('join', (options, callback) => {

        const { error, user } = addUser({ id: socket.id, ...options })
        
        if(error) {
           return callback(error)
        }
        
        socket.join(user.room)

        //This will emit once for a socket
        socket.emit('message', generateMessage('Admin', 'Welcome!'))

        // this will emit to all except the sender in the room
        socket.broadcast.to(user.room).emit('message', generateMessage('Admin', `${user.username} has joined!`))
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })

        callback()


        // socket.emit, io.emit, socket.broadcast.emit
        // io.to.emit, socket.broadcast.to.emit
    })

    //listening for sendMessage event. We have recieved a message and a callback for acknowldegement
    socket.on('sendMessage', (message, callback) => {
        
        const user = getUser(socket.id)

        const filter = new Filter()

         // To check for bad words in text
        if (filter.isProfane(message)) {
            return callback('Profanity is not allowed!')
        }

        // To emit message to all users simultaneously
        io.to(user.room).emit('message', generateMessage(user.username, message))

         //Acknowledgment send back to client has message has been recieved successfully
        callback()
    })

    
   // Listening for sendLocation events, which pass the coordinates and has a callback
    socket.on('sendLocation', (coords, callback) => {

        const user = getUser(socket.id)

         //Emit locationMessage event to all users with the link with latitude and longitutude passed
        io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, `https://google.com/maps?q=${coords.latitude},${coords.longitude}`))

        // Callback sent to client with message
        callback()
    })

    
     // This will listen for disconnect request on socket
    socket.on('disconnect', () => {

       const user = removeUser(socket.id)

       if(user) {
             // This will emit message to every user expect the user who has disconnect
            io.to(user.room).emit('message', generateMessage('Admin', `${user.username} has left`))
            io.to(user.room).emit('roomData', {
               room: user.room,
               users: getUsersInRoom(user.room) 
            })
       }
        
    })
})

server.listen(port, () => {
    console.log(`Server is up on port ${port}!`)
})