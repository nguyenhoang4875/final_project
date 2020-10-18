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
const users = [];

/**
 * Encapsulates all code for emitting and listening to socket events
 *
 */
const ioEvents = function (io) {
  // Rooms namespace
  io.of('/rooms').on('connection', function (socket) {
    // Create a new room
    socket.on('createRoom', async function ({ name,level, quantity,  id }) {
      const newRoom = await RoomService.create({ name,level,quantity, id });
      console.log('NEW ROOM: ', newRoom);
      const users = await UserService.getUser();
      socket.emit('updateRoomsList', { room: newRoom, creator: id , users: users});
      socket.broadcast.emit('updateRoomsList', { room: newRoom, creator: id ,users: users});
    });

    // Edit a room
    socket.on('editRoom', async function ({ name,level,quantity, id, roomId }) {
      const room = await RoomService.update({ name,level, quantity,id, roomId });
      socket.emit('updateRoomsList', { room, creator: id });
      socket.broadcast.emit('updateRoomsList', { room, creator: id });
    });

    // Delete a room
    socket.on('deleteRoom', async function ({ roomId, userId }) {
      const room = await RoomService.delete({ id: roomId });
      socket.emit('updateRoomsList', { room, creator: userId });
      socket.broadcast.emit('updateRoomsList', { room, creator: userId });
    });
  });

  // Chatroom namespace
  io.of('/chatroom').on('connection', function (socket) {
    // Join a chatroom
    socket.on('join', async function ({ roomId, userId }) {
      const result = await RoomService.findRoom({ id: roomId });
      const room = result.data;
      const users = room.users;

      if (!result || result.status !== 200) {
        socket.emit('updateUsersList', { error: 'Room doesnt exist.' });
      } else {
        // Check if user exists in the session
        if (socket.request.session.passport == null) {
          return;
        }

        socket.join(room._id);
        socket.chatRoomId = room._id;
        socket.userId = userId;
        /*if (users.length === 1) {
					socket.broadcast.to(room._id).emit('updateUsersList', users[users.length - 1]);
				}*/

        socket.broadcast.to(room._id).emit('add-users', {
          users: [socket.id],
        });

        const connect = await ConnectService.newConnect({ roomId, userId });

        if (connect.status === 200) {
          const userConnected = connect.conn.users;
          socket.emit('updateUsersList', users, true, userConnected);
          socket.broadcast.to(room._id).emit('updateUsersList', users, true, userConnected);
        }
      }
    });

    // When a socket exits
    socket.on('disconnect', async function () {
      console.log('DISCONNECTED', socket.chatRoomId);
      let roomId = socket.chatRoomId;
      let userId = socket.userId;
      users.splice(users.indexOf(socket.id), 1);

      //socket.emit('remove-user', socket.id);

      // Check if user exists in the session
      if (socket.request.session.passport == null) {
        return;
      }

      const conn = await ConnectService.removeConnect({ roomId, userId });

      if (conn.status === 200) {
        const userConnected = conn.conn.users;
        socket.leave(roomId);
        socket.broadcast.to(roomId).emit('remove-user', { id: socket.id });
        socket.broadcast.to(roomId).emit('updateUsersList', conn.usersInRoom, true, userConnected);
        //socket.broadcast.to(roomId).emit('removeUser', userId);
      }
    });

    socket.on('leave-room', async ({ roomId, userId }) => {
      // Leave the room channel
    });

    // When a new message arrives
    socket.on('newMessage', async function ({ roomId, message, userId }) {
      // No need to emit 'addMessage' to the current socket
      // As the new message will be added manually in 'main.js' file
      // socket.emit('addMessage', message);
      await ChatService.createMsg({ roomId, message: message.content, userId });
      socket.broadcast.to(roomId).emit('addMessage', message);
    });

    /*socket.broadcast.emit('add-users', {
			users: [socket.id]
		});*/

    socket.on('make-offer', function (data) {
      socket.to(data.to).emit('offer-made', {
        offer: data.offer,
        socket: socket.id,
      });
    });

    socket.on('make-answer', function (data) {
      socket.to(data.to).emit('answer-made', {
        socket: socket.id,
        answer: data.answer,
      });
    });
  });

  // User namespace
  io.of('/users').on('connection', function (socket) {
    // Create a new room
    // id: Creator
    socket.on('createUser', async function ({ name, email, role, password, id }) {
      const data = await UserService.createUser({ username: name, email, role, id, password });
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
    }) {
      const data = await UserService.updateUser({
        username: name,
        email,
        id,
        role,
        oldPassword,
        newPassword,
        userId,
      });
      socket.emit('updateUsersList', data, id);
      socket.broadcast.emit('updateUsersList', data, id);
    });

    // Delete a user
    // userId: User's ID DELETE
    socket.on('deleteUser', async function ({ userId, creator }) {
      const data = await UserService.deleteUser({ userId });
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
  const mongoAdapter = require('socket.io-adapter-mongo');

  // Force Socket.io to ONLY use "websockets"; No Long Polling.
  io.set('transports', ['websocket']);

  io.adapter(mongoAdapter('mongodb://localhost:27017'));

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
