'use strict';
var videoMode = false;
var audioMode = false;
const app = {

    rooms: function (userId) {
        const socket = io('/rooms', {transports: ['websocket']});

        // When socket connects, get a list of chat rooms
        socket.on('connect', function () {

            // Update rooms list upon emitting updateRoomsList event
            socket.on('updateRoomsList', function ({room, creator, users}) {
                console.log('room: in socket updateRoomList: ', room);
                console.log('create: in socket updateRoomList: ', creator);
                // Display an error message upon a user error(i.e. creating a room with an existing title)
                $('.message-create-first-room').remove();
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
                let roomPwd= $("input[name='password']").val();

                let local = localStorage.getItem('user');
                local = !!local ? JSON.parse(local) : null;
                let userId = local._id;

                if (name === '') {
                    toastr.error("Room's name and members is required !.");
                } else {
                    if (userId) {
                        if (roomId) {
                            $(this).attr("disabled", true).html('Updating ...');
                            $("#delete_room").attr("style", "margin-right: 43%");
                            socket.emit('editRoom', {name, level, quantity, userId, roomId,roomPwd});
                        } else {
                            $(this).attr("disabled", true).html('Creating ...');
                            socket.emit('createRoom', {name, level, quantity, userId, roomPwd});
                        }
                    }
                }
            });

            $('#delete_room').on('click', function (e) {
                e.preventDefault();
                let roomId = $("input[name='room_id']").val();
                $(this).attr("disabled", true).html('Deleting ...');
                $(this).attr("style", "margin-right: 46%");
                console.log('roomId before delete in main js: ', roomId)
                socket.emit('deleteRoom', {roomId, userId});
            });

            $('#submit_join_room').on('click', function (e) {
                let roomPwd = $("input[name='room_password']").val();
                let roomId = $("input[name='join_room_id']").val();
                let local = localStorage.getItem('user');
                local = !!local ? JSON.parse(local) : null;
                let userId = local._id;

                if (roomPwd === '') {
                    toastr.error("Room password is required !.");
                } else {
                    if (userId) {
                        console.log('roomPwd', roomPwd);
                        console.log('room Id', roomId);
                        console.log('userId', userId);
                        socket.emit('joinRoomAuth', {roomId, roomPwd, userId});
                    }
                }
            });

        });
    },

    helpers: {

        encodeHTML: function (str) {
            return $('<div />').text(str).html();
        },

        // Update rooms list
        updateRoomsList: function (manageRoom, users) {
            if (manageRoom.status === 200) {
                let room = manageRoom.room;
                console.log('room in updateRoomsList', room);

                if (manageRoom.isDelete) {
                    console.log('deleting room ne');
                    if ($(".room-list").length > 0) {
                        let id = room._id;
                        let query = $("#" + id);
                        if (query.length) {
                            query.remove();
                        }
                    }
                } else if(manageRoom.isUpdate){
                    let id = room._id;
                    let room_main = `<div class="card card-room" id="${id}">
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
                              </div>`
                    let room_join =
                             ` <footer>
                                <a class="card-link" href="/chat/${room._id}">
                                    <p class="card-text room-title__active">
                                        <i class="fa fa-phone" aria-hidden="true"></i>
                                        Join and talk now
                                    </p>
                                </a>
                            </footer>
                            </div>
                        </div>`
                    let room_auth =
                        `<footer>
                            <p class="card-text room-title__active" onclick="showEnterPasswordModal(${room._id})">
                                <i class="fa fa-lock" aria-hidden="true"></i>
                                Enter password and join
                            </p>
                        </footer>
                    </div>
                    </div>`
                    if (room.password != ''){
                        room_main = room_main + room_auth;
                    }
                    else {

                        room_main = room_main + room_join;
                    }
                $(room_main).replaceAll("#"+id);
                }


                else {
                    room.name = this.encodeHTML(room.name);
                    room.name = room.name.length > 25 ? room.name.substr(0, 25) + '...' : room.name;
                    let html = ` <div class="card card-room" id="${room._id}">
                                    <div class="card-body">
                                      <div class="card-title">
                                        <div class="room-topic">
                                         <p> Topic: ${room.name} </p>
                                        </div>
                                        <p class="card-text">Max people: ${room.quantity}</p>
                                        <p class="card-text">Level: ${room.level}</p>
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
                              </div> `;

                    let room_join =
                        ` <footer>
                                <a class="card-link" href="/chat/${room._id}">
                                    <p class="card-text room-title__active">
                                        <i class="fa fa-phone" aria-hidden="true"></i>
                                        Join and talk now
                                    </p>
                                </a>
                            </footer>
                            </div>
                        </div>`
                    let room_auth =
                        `<footer>
                            <p class="card-text room-title__active" onclick="showEnterPasswordModal('<%= room.id %>')">
                                <i class="fa fa-lock" aria-hidden="true"></i>
                                Enter password and join
                            </p>
                        </footer>
                    </div>
                    </div>`


                    //let users = room.users;
                    let local = localStorage.getItem('user');
                    local = !!local ? JSON.parse(local) : null;
                    let userId = local._id;

                    if ($(".room-list").length === 0) {
                        $('.room-list').html('');
                    }

                    for (let user of users) {
                        if (user._id === userId) {
                            htmlEdit = room.password ===''? htmlEdit+ room_join: htmlEdit + room_auth;
                            $('.room-list').prepend(htmlEdit);
                        } else {
                            html = room.password ===''? html+ room_join: html + room_auth;
                            $('.room-list').prepend(html);
                        }
                        break;
                    }

                }

                this.updateNumOfRooms();
            } else {
                toastr.error(manageRoom.message)
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

