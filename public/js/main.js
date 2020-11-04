'use strict';
var videoMode = false;
var audioMode = false;
const app = {

    rooms: function (userId) {
        const socket = io('/rooms', {transports: ['websocket']});

        // When socket connects, get a list of chatrooms
        socket.on('connect', function () {

            // Update rooms list upon emitting updateRoomsList event
            socket.on('updateRoomsList', function ({room, creator, users}) {
                console.log('room: in socket updateRoomList: ', room);
                console.log('create: in socket updateRoomList: ', creator);
                // Display an error message upon a user error(i.e. creating a room with an existing title)
                $('.room-create p.message').remove();
                if (room.status !== 200) {
                    if (userId === creator) {
                        toastr.error(room.message);
                        $('.room-create').append(`<p class="message error">${room.message}</p>`);
                    }
                } else {
                    if (userId === creator) {
                        toastr.info(room.message);
                        $('#form_room').modal('toggle');
                    }
                    app.helpers.updateRoomsList(room, users);
                }
            });

            // Whenever the user hits the create button, emit createRoom event.
            $('#submit_room').on('click', function (e) {
                e.preventDefault();
                let roomId = $("input[name='room_id']").val();
                let name = $("input[name='topic']").val().trim();
                let quantity = $("#selectMaxPeople").val();
                let level = $("#selectLevels").val();

                let local = localStorage.getItem('user');
                local = !!local ? JSON.parse(local) : null;
                let id = local._id;

                if (name === '') {
                    toastr.error("Room's name and members is required !.");
                } else {
                    if (id) {
                        if (roomId) {
                            $(this).attr("disabled", true).html('Updating ...');
                            $("#delete_room").attr("style", "margin-right: 43%");
                            socket.emit('editRoom', {name, level, quantity, id, roomId});
                        } else {
                            $(this).attr("disabled", true).html('Creating ...');
                            socket.emit('createRoom', {name, level, quantity, id});
                        }
                    }
                }
            });

            $('#delete_room').on('click', function (e) {
                e.preventDefault();
                let roomId = $("input[name='room_id']").val();
                $(this).attr("disabled", true).html('Deleting ...');
                $(this).attr("style", "margin-right: 46%");
                socket.emit('deleteRoom', {roomId, userId});
            });

        });
    },

    helpers: {

        encodeHTML: function (str) {
            return $('<div />').text(str).html();
        },

        // Update rooms list
        updateRoomsList: function (newRoom, users) {
            if (newRoom.status === 200) {
                let room = newRoom.room;

                if (room.isDelete) {
                    if ($(".room-list").length > 0) {
                        let id = room._id;
                        let query = $("#" + id);
                        if (query.length) {
                            query.remove();
                        }
                    }
                } else {
                    room.name = this.encodeHTML(room.name);
                    room.name = room.name.length > 25 ? room.name.substr(0, 25) + '...' : room.name;
                    let html = ` <div class="card card-room" id="${room.id}">
                                    <div class="card-body">
                                      <div class="card-title">
                                        <div class="room-topic">
                                         <p> Topic: ${room.name} </p>
                                        </div>
                                        <p class="card-text">Max people: ${room.quantity}</p>
                                        <p class="card-text">Level: ${room.level}</p>
                                      </div>
                                      <footer>
                                        <a class="card-link" href="/chat/${room._id}">
                                          <p class="card-text text-center">Join and talk now</p>
                                        </a>
                                      </footer>
                                    </div>
                                  </div>`

                    let htmlEdit = `
                        <div class="card card-room" id="${room.id}">
                            <div class="card-body">
                              <div class="card-title">
                                <div class="room-topic">
                                 <p>
                                    Topic: ${room.name}
                                 </p>
                                <i class="fa fa-cog "
                                   aria-hidden="true"
                                   onclick="showEditModal('${room._id}')"
                                   style="color:#495c68;cursor:pointer">
                                </i>
                                </div>
                                <p class="card-text">Max people: ${room.quantity}</p>
                                <p class="card-text">Level: ${room.level}</p>
                              </div>
                              <footer>
                                <a class="card-link" href="/chat/${room._id}">
                                  <p class="card-text text-center">Join and talk now</p>
                                </a>
                              </footer>
                            </div>
                        </div>

                        `;

                    if (html === '') {
                        return;
                    }

                    //let users = room.users;
                    let local = localStorage.getItem('user');
                    local = !!local ? JSON.parse(local) : null;
                    let userId = local._id;

                    if ($(".room-list").length === 0) {
                        $('.room-list').html('');
                    }

                    for (let user of users) {
                        if (user._id === userId) {
                            $('.room-list').prepend(htmlEdit);
                        } else {
                            $('.room-list').prepend(html);
                        }
                        break;
                    }

                }

                this.updateNumOfRooms();
            } else {
                toastr.error(newRoom.message)
            }
        },

        // Update users list
        updateUsersList: function (users, clear, userConnected) {
            if (users.constructor !== Array) {
                users = [users];
            }

            let html = '';
            for (const user of users) {
                user.username = this.encodeHTML(user.username);
                html += `<li class="clearfix" id="user-${user._id}">
                     <img src="${user.avatar ? user.avatar : '/img/user.png'}" alt="${user.username}" />
                     <div class="about">
                        <div class="name text-info">${user.username}</div>
                        <div class="status">
                            <i class="fa fa-circle ${(!!userConnected && userConnected.indexOf(user._id + '') !== -1) ? 'online' : 'offline'}"></i>
                                ${(!!userConnected && userConnected.indexOf(user._id + '') !== -1) ? 'online' : 'offline'}
                         </div>
                     </div></li>`;
            }

            if (html === '') {
                return;
            }

            if (clear != null && clear == true) {
                $('.users-list ul').html('').html(html);
            } else {
                $('.users-list ul').prepend(html);
            }

            this.updateNumOfUsers();
        },

        // Update number of rooms
        // This method MUST be called after adding a new room
        updateNumOfRooms: function () {
            const num = $('.room-list ul li').length;
            $('.room-num-rooms').text(num + " Room(s)");
        },

        // Update number of online users in the current room
        // This method MUST be called after adding, or removing list element(s)
        updateNumOfUsers: function () {
            const num = $('.users-list ul li').length;
            $('.chat-num-users').text(num + " User(s)");
        }
    }
};

