'use strict';

const config = require('../config');
const redis = require('redis').createClient;
const adapter = require('socket.io-redis');
const https = require('https');
const fs = require('fs');

const RoomService = require('../services/RoomService');
const ChatService = require('../services/ChatService');
const ConnectService = require('../services/ConnectionService');
const UserService = require('../services/UserService');
const { TWILIO } = require('../config/constant');
const client = require('twilio')(TWILIO.ACCOUNT_SID, TWILIO.AUTH_TOKEN);
const users = [];
const peers = {}

const { STATUS_ROOM } = require('../config/constant');


/**
 * Encapsulates all code for emitting and listening to socket events
 *
 */
const ioEvents = function (io) {
    // Rooms namespace
    io.of('/rooms').on('connection', function (socket) {
        // Create a new room
        socket.on('createRoom', async function ({name, level, quantity, userId, roomPwd}) {
            const newRoom = await RoomService.create({name, level, quantity, userId, roomPwd});
            console.log('NEW ROOM: ', newRoom);
            const users = await UserService.getUser();
            socket.emit('updateRoomsList', {room: newRoom, creator: userId, users: users});
            socket.broadcast.emit('updateRoomsList', {room: newRoom, creator: userId, users: users});
        });

        // Edit a room
        socket.on('editRoom', async function ({name, level, quantity, userId, roomId, roomPwd}) {
            const room = await RoomService.update({name, level, quantity,userId, roomId, roomPwd});
            const users = await UserService.getUser();
            socket.emit('updateRoomsList', {room: room, creator: userId, users: users});
            socket.broadcast.emit('updateRoomsList', {room: room, creator: userId, users: users});
        });

        // Delete a room
        socket.on('deleteRoom', async function ({roomId, userId}) {
            const room = await RoomService.delete({id: roomId});
            const users = await UserService.getUser();
            socket.emit('updateRoomsList', {room: room, creator: userId, users: users});
            socket.broadcast.emit('updateRoomsList', {room: room, creator: userId, users: users});

        });
        socket.on('joinRoomAuth', async function ({roomId, roomPwd, userId}) {
            const RoomPassword = await RoomService.checkValidRoomPassword({roomId, roomPwd});
            if (RoomPassword.data){
                console.log('valid password');
                socket.emit('join-room',{roomId, userId});
            }
            else {
                socket.emit('invalid-room-password', {isValid: false})
                console.log('invalid password');
            }
        });
    });

    // Chatroom namespace
    io.of('/chatroom').on('connection', function (socket) {

        socket.on('getIceServer', async function (){
            await client.tokens.create().then(token => {
                socket.emit('returnIceServer',token.iceServers);
            });
        });

        socket.on('join-room',async function ({roomId, userId}) {
            const result = await RoomService.findRoom({id: roomId});
            const room = result.data;

            const checkCanJoinRoomByLimitPeople = await ConnectService.checkLimitPeopleInRoom({roomId});
            if (!checkCanJoinRoomByLimitPeople){
                console.log('this room was full!');
                return;
            }

            if (!result || result.status !== 200) {
                console.log('fail in check result');
                socket.emit('updateUsersList', {error: 'Room doesnt exist.'});
            }
            else {
                // Check if user exists in the session
                if (socket.request.session.passport == null) {
                    console.log('passport session is null');
                    return;
                }

                socket.roomId = roomId;
                socket.userId = userId;

                if (peers[roomId]) {
                    peers[roomId][socket.id] = {}
                } else {
                    peers[roomId] = {}
                    peers[roomId][socket.id] = {}
                }

                peers[roomId][socket.id] = socket

                for (let id in peers[roomId]) {
                    if (id === socket.id) continue
                    peers[roomId][id].emit('initReceive', socket.id)
                }

                socket.join(roomId)

                const connect = await ConnectService.newConnect({roomId, userId});

                if (connect.status === 200) {
                    const userConnected = connect.conn.users;
                    socket.emit('updateUsersList', users, true, userConnected);
                    socket.broadcast.to(room._id).emit('updateUsersList', users, true, userConnected);
                }


                socket.on('signal', data => {
                    if (!peers[socket.roomId][data.socket_id]) return
                    peers[socket.roomId][data.socket_id].emit('signal', {
                        socket_id: socket.id,
                        signal: data.signal
                    })
                })

                socket.on('initSend', init_socket_id => {
                    peers[socket.roomId][init_socket_id].emit('initSend', socket.id)
                })

                const checkCanJoinRoomByLimitPeople = await ConnectService.checkLimitPeopleInRoom({roomId});
                if (!checkCanJoinRoomByLimitPeople) {
                    const roomSetFull = await RoomService.setStatusRoom(roomId,STATUS_ROOM.FULL);
                    let roomStatus = roomSetFull.room.status;
                    const userInConnection = await ConnectService.getUsersInConnection(roomId);
                    io.of('/rooms').on('connection', function (socket_temp) {
                        socket_temp.emit('change-room-status-join', {roomId,roomStatus});
                        socket_temp.broadcast.emit('change-room-status-join', {roomId,roomStatus});
                        socket_temp.emit('update-user-in-room', userInConnection.usersInRoom);
                        socket_temp.broadcast.emit('update-user-in-room', userInConnection.usersInRoom);
                    });
                }

                const temp = await  ConnectService.getUsersInConnectionAllRoom(roomId);
            }
        })

        // When a socket exits
        socket.on('disconnect', async function () {
            let roomId = socket.roomId;
            let userId = socket.userId;

            socket.emit('remove-user', socket.id);
            socket.broadcast.to(roomId).emit('remove-user', {id: socket.id});

            // Check if user exists in the session
            if (socket.request.session.passport == null) {
                return;
            }
            const conn = await ConnectService.removeConnect({roomId, userId});
            console.log('roomId in disconnect:', roomId);
            const checkCanChangeRoomStatus = await ConnectService.canChangeRoomStatus({roomId});
            const roomStatus = await  RoomService.getRoomStatus(roomId);
            const room= await RoomService.findRoom({id: roomId});
            console.log('room status: ', roomStatus);
            if (conn.status === 200) {
                if (checkCanChangeRoomStatus){
                    if (room.data.password ===''){
                        await RoomService.setStatusRoom(roomId,STATUS_ROOM.ACTIVE);
                    }
                    else {
                        await RoomService.setStatusRoom(roomId,STATUS_ROOM.AUTH);
                    }

                    const userInConnection = await ConnectService.getUsersInConnection(roomId);
                    const roomStatus = await RoomService.getRoomStatus(roomId);
                    io.of('/rooms').on('connection', function (socket_temp) {
                        console.log('change room status in disconnect room');
                        socket_temp.emit('change-room-status', {roomId,roomStatus});
                        socket_temp.broadcast.emit('change-room-status', {roomId,roomStatus});
                        socket_temp.emit('update-user-in-room', userInConnection.usersInRoom);
                        socket_temp.broadcast.emit('update-user-in-room', userInConnection.usersInRoom);
                    })
                    //socket.to.emit('change-room-status', roomStatus);
                }
                console.log('disconnect room');
                const userConnected = conn.conn.users;
                socket.leave(roomId);
                socket.broadcast.to(roomId).emit('remove-user', {id: socket.id});
                socket.broadcast.to(roomId).emit('updateUsersList', conn.usersInRoom, true, userConnected);
                console.log('socket disconnected ' + socket.id)
                socket.broadcast.emit('removePeer', socket.id)
                delete peers[roomId][socket.id];
            }
        });

        socket.on('leave-room', async ({roomId, userId}) => {
            // Leave the room channel
        });

        // When a new message arrives
        socket.on('newMessage', async function ({roomId, message, userId}) {
            // No need to emit 'addMessage' to the current socket
            // As the new message will be added manually in 'main.js' file
            // socket.emit('addMessage', message);
            await ChatService.createMsg({roomId, message: message.content, userId});
            socket.broadcast.to(roomId).emit('addMessage', message);
        });
    });


    // User namespace
    io.of('/users').on('connection', function (socket) {
        // Create a new room
        // id: Creator
        socket.on('createUser', async function ({name, email, role, password, id}) {
            const data = await UserService.createUser({username: name, email, role, id, password});
            socket.emit('updateUsersList', data, id);
            socket.broadcast.emit('updateUsersList', data, id);
        });

        // Edit a user
        // id: creator
        // userId: User's ID edit
        socket.on('editUser', async function ({
                                                  name,
                                                  email,
                                                  id,
                                                  role,
                                                  oldPassword,
                                                  newPassword,
                                                  userId,
                                                  avatar
                                              }) {
            const data = await UserService.updateUser({
                username: name,
                email,
                id,
                role,
                oldPassword,
                newPassword,
                userId,
                avatar
            });
            socket.emit('updateUsersList', data, id);
            socket.broadcast.emit('updateUsersList', data, id);
        });

        // Delete a user
        // userId: User's ID DELETE
        socket.on('deleteUser', async function ({userId, creator}) {
            const data = await UserService.deleteUser({userId});
            socket.emit('updateUsersList', data, creator);
            socket.broadcast.emit('updateUsersList', data, creator);
        });
    });
};

/**
 * Initialize Socket.io
 * Uses Mongo as Adapter for Socket.io
 *
 */
const init = function (app) {

    // set https server
    const options = {
        key: fs.readFileSync('./certificates/key.pem', 'utf8'),
        cert: fs.readFileSync('./certificates/cert.pem', 'utf8'),
    };

    const server = https.createServer(options, app);

    const io = require('socket.io')(server);

    /*
        const mongoAdapter = require('socket.io-adapter-mongo');
        // Force Socket.io to ONLY use "websockets"; No Long Polling.
        //io.set('transports', ['websocket']);

        io.adapter(mongoAdapter('mongodb://localhost:27017'));

    */
    // Allow sockets to access session data
    io.use((socket, next) => {
        require('../session')(socket.request, {}, next);
    });

    // Define all Events
    ioEvents(io);

    // The server object will be then used to list to a port number
    return server;
};

module.exports = init;
