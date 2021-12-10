const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const formatMessage = require('./utils/messages');
const { userJoin, getCurrentUser, userLeave, getRoomUsers } = require('./utils/users');

const app = express(); // express-> app
const server = http.createServer(app);  // server객체 생성
const io = socketio(server)

// Set static folder
app.use('https://camstudyday.shop');

const botName = 'ChatCord Bot';

// Run when client connects
io.on('connection', socket=> {
    socket.on('joinRoom', ({ username, room }) => {
        const user = userJoin(socket.id, username, room);

        socket.join(user.room);

    // Welcome current user
    socket.emit('message', 
    formatMessage(botName, 'Welcom to ChatCord!')); // 싱글 클라이언트에게 메시지

    // Broadcast when a user connects
    socket.broadcast.to(user.room).emit('message', 
    formatMessage(botName, `${user.username} has joined the chat`)); // 모든 사용자에게 메시지

    // Send users and room info
    io.to(user.room).emit('roomUsers', {
        room: user.room,
        users: getRoomUsers(user.room)
    });
    });


    // Listen for chatMessage 사용자로부터 메시지를 수신
    socket.on('chatMessage', msg => {
        const user = getCurrentUser(socket.id);

        io.emit('message', formatMessage(user.username, msg));
    });

    // Runs when client disconnects
    socket.on('disconnect', () => {
        const user = userLeave(socket.id);

        if(user) {
            io.to(user.room).emit('message', formatMessage(botName, `${user.username} has left the chat`)); // 접속 종료
        }
    });

});

const PORT = 3000 || process.env.PORT;

server.listen(PORT, () => console.log('Server running on port ' + PORT)); // 서버 실행