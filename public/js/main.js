'use strict';
const app = {

    rooms: function (userId) {
        const socket = io('/rooms', {transports: ['websocket']});

        // When socket connects, get a list of chatrooms
        socket.on('connect', function () {

            // Update rooms list upon emitting updateRoomsList event
            socket.on('updateRoomsList', function ({ room, creator }) {
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
                    app.helpers.updateRoomsList(room);
                }
            });

            // Whenever the user hits the create button, emit createRoom event.
            $('#submit_room').on('click', function (e) {
                e.preventDefault();
                let roomId = $("input[name='room_id']").val();
                let name = $("input[name='topic']").val().trim();
                let quantity = $("input[name='quantity']").val().trim();
                let level = $("input[name='level']").val().trim();
                let members = $("input[name='list_members']").val().trim();
                members = members.split(",");

                let local = localStorage.getItem('datn_2020');
                local = !!local ? JSON.parse(local) : null;
                let id = local._id;

                if (name === '' || !members.length) {
                    toastr.error("Room's name and members is required !.");
                } else {
                    if (id) {
                        if (roomId) {
                            $(this).attr("disabled", true).html('Updating ...');
                            $("#delete_room").attr("style", "margin-right: 43%");
                            socket.emit('editRoom', {name, members, id, roomId});
                        } else {
                            $(this).attr("disabled", true).html('Creating ...');
                            socket.emit('createRoom', {name,level, quantity, members, id});
                        }
/*                        $("input[name='title']").val('');
                        $("input[name='list_members']").val('')*/
                    }
                }
                //$('#form').modal('toggle')
            });

            $('#delete_room').on('click', function (e) {
                e.preventDefault();
                let roomId = $("input[name='room_id']").val();
                $(this).attr("disabled", true).html('Deleting ...');
                $(this).attr("style", "margin-right: 46%");
                socket.emit('deleteRoom', { roomId, userId });
            });

        });
    },

    chat: function (roomId, username, userId ) {
        const socket = io('/chatroom', {transports: ['websocket']});
        let answersFrom = {}, offer;
        const peerConnection = window.RTCPeerConnection ||
            window.mozRTCPeerConnection ||
            window.webkitRTCPeerConnection ||
            window.msRTCPeerConnection;

        const sessionDescription = window.RTCSessionDescription ||
            window.mozRTCSessionDescription ||
            window.webkitRTCSessionDescription ||
            window.msRTCSessionDescription;

        navigator.getUserMedia = navigator.getUserMedia ||
            navigator.webkitGetUserMedia ||
            navigator.mozGetUserMedia ||
            navigator.msGetUserMedia;

        const pc = new peerConnection({
            iceServers: [{
                url: "stun:stun.services.mozilla.com",
                username: "somename",
                credential: "somecredentials"
            }]
        });

        pc.onaddstream = function (obj) {
            const vid = document.createElement('video');
            vid.setAttribute('class', 'video-small');
            vid.setAttribute('autoplay', 'autoplay');
            vid.setAttribute('id', 'video-remote');
            vid.setAttribute("style", "width:300px");
            $("#local-video").after(vid);
            vid.srcObject = obj.stream;
        };

        pc.oniceconnectionstatechange = function(e) {
            if(pc.iceConnectionState === 'disconnected') {
                console.log('One user has disconnected');
            }
        };

        navigator.getUserMedia({video: true, audio: true}, function (stream) {
            const video = document.querySelector('video');
            video.srcObject = stream;
            pc.addStream(stream);
        }, error);

        function createOffer(id) {
            pc.createOffer(function (offer) {
                pc.setLocalDescription(new sessionDescription(offer), function () {
                    socket.emit('make-offer', {
                        offer: offer,
                        to: id
                    });
                }, error);
            }, error);
        }

        function error(err) {
            console.warn('Error', err);
        }

        function getHistoryMsg(roomId) {
            axios.get('/chat/'+roomId+'/messages')
                .then(res => {
                    showHistoryMsg(res.data);
                })
                .catch(err => {
                    console.log(err);
                });
        }

        function showHistoryMsg(messages) {
            for (let mess of messages) {
                let message = {
                    content: mess.message,
                    username: !!mess.sender_id.username ? mess.sender_id.username : 'User',
                    date: mess.created
                };
                app.helpers.addMessage(message);
            }
        }

        // When socket connects, join the current chatroom
        socket.on('connect', function () {

            socket.emit('join', { roomId, userId });
            getHistoryMsg(roomId);

            // Update users list upon emitting updateUsersList event
            socket.on('updateUsersList', function (users, clear, userConnected) {
                $('.container p.message').remove();
                if ((!!users && users.error) != null) {
                    $('.container').html(`<p class="message error">${users.error}</p>`);
                } else {
                    app.helpers.updateUsersList(users, clear, userConnected);
                }
            });

            // Whenever the user hits the save button, emit newMessage event.
            $(".chat-message button").on('click', function (e) {

                const textareaEle = $("textarea[name='message']");
                const messageContent = textareaEle.val().trim();
                if (messageContent !== '') {
                    const message = {
                        content: messageContent,
                        username: username,
                        date: Date.now()
                    };

                    socket.emit('newMessage', { roomId, message, userId });
                    textareaEle.val('');
                    app.helpers.addMessage(message);
                }
            });

            // Whenever a user leaves the current room, remove the user from users list
            socket.on('removeUser', function (userId) {
                console.log(userId);
                $('li#user-' + userId).remove();
                app.helpers.updateNumOfUsers();
            });

            // Append a new message
            socket.on('addMessage', function (message) {
                app.helpers.addMessage(message);
            });

            socket.on('add-users', function (data) {
                for (let i = 0; i < data.users.length; i++) {
                    const el = document.createElement('div'),
                        id = data.users[i];

                    el.setAttribute('id', id);
                    el.setAttribute('style', 'color: white');
                    el.innerHTML = id;
                    el.addEventListener('click', function () {
                        createOffer(id);
                    });
                    document.getElementById('users').appendChild(el);
                    setTimeout(function () {
                        console.log('Called');
                        document.getElementById(id).click();
                    }, 2000);
                }
            });

            socket.on('remove-user', function ({ id }) {
                const removeId = id.trim().substr(10);
                const div = document.getElementById(id);

                if (!!div) {
                    document.getElementById('users').removeChild(div);
                }

                $("#"+removeId).remove();
            });


            socket.on('offer-made', function (data) {
                console.log('OFFER: ', data);
                let videoId = data.socket.trim().substr(10);
                $("#video-remote").attr("id", videoId);
                offer = data.offer;

                pc.setRemoteDescription(new sessionDescription(data.offer), function () {
                    pc.createAnswer(function (answer) {
                        pc.setLocalDescription(new sessionDescription(answer), function () {
                            socket.emit('make-answer', {
                                answer: answer,
                                to: data.socket
                            });
                        }, error);
                    }, error);
                }, error);
            });

            socket.on('answer-made', function (data) {
                console.log('ANSWER: ', data);
                let videoId = data.socket.trim().substr(10);
                $("#video-remote").attr("id", videoId);
                pc.setRemoteDescription(new sessionDescription(data.answer), function () {
                    document.getElementById(data.socket).setAttribute('class', 'active');
                    if (!answersFrom[data.socket]) {
                        createOffer(data.socket);
                        answersFrom[data.socket] = true;
                    }
                }, error);
            });
        });
    },

    helpers: {

        encodeHTML: function (str) {
            return $('<div />').text(str).html();
        },

        // Update rooms list
        updateRoomsList: function (newRoom) {
            if (newRoom.status === 200) {
                let room = newRoom.room;

                if (room.isDelete) {
                    if ($(".room-list ul li").length > 0) {
                        let id = room._id;
                        let query = $("#" + id);
                        if (query.length) {
                            query.remove();
                        }
                    }
                } else {
                    room.name = this.encodeHTML(room.name);
                    room.name = room.name.length > 25 ? room.name.substr(0, 25) + '...' : room.name;
                    let html = `<div id="${room._id}" class="d-flex w-100">
                            <a href="/chat/${room._id}" class="w-100">
                                <li class="room-item w-100">${room.name}</li>
                            </a>
                        </div>`;

                    let htmlEdit = `<div id="${room._id}" class="d-flex w-100">
                            <a href="/chat/${room._id}" class="w-100">
                                <li class="room-item w-100">${room.name}</li>
                            </a>
                            <i class="fa fa-pencil-square-o fa-2x px-3 mt-4 "
                               aria-hidden="true"
                               onclick="showEditModal('${room._id}')"
                               style="color:#86BB71;cursor:pointer">
                            </i>
                        </div>`;

                    if (html === '') {
                        return;
                    }

                    let id = room._id;
                    let query = $("#" + id);
                    if (query.length) {
                        query.remove();
                    }
                    let users = room.users;
                    let local = localStorage.getItem('datn_2020');
                    local = !!local ? JSON.parse(local) : null;
                    let userId = local._id;

                    if ($(".room-list ul li").length === 0) {
                        $('.room-list ul').html('');
                    }
                    for (let user of users) {
                        if (user._id === userId) {
                            if (user.role === 3 || user.role === 2) {
                                $('.room-list ul').prepend(htmlEdit);
                            } else {
                                $('.room-list ul').prepend(html);
                            }
                            break;
                        }
                    }

                    this.updateNumOfRooms();
                }
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
                            <i class="fa fa-circle ${(!!userConnected && userConnected.indexOf(user._id+'') !== -1) ? 'online' : 'offline' }"></i> 
                                ${(!!userConnected && userConnected.indexOf(user._id+'') !== -1) ? 'online' : 'offline' }
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

        // Adding a new message to chat history
        addMessage: function (message) {
            message.date = (new Date(message.date)).toLocaleString();
            message.username = this.encodeHTML(message.username);
            message.content = this.encodeHTML(message.content);

            const html = `<li>
                    <div class="message-data">
                      <span class="message-data-name">${message.username}</span>
                      <span class="message-data-time">${message.date}</span>
                    </div>
                    <div class="message my-message" dir="auto">${message.content}</div>
                  </li>`;
            $(html).hide().appendTo('.chat-history ul').slideDown(200);

            // Keep scroll bar down
            $(".chat-history").animate({scrollTop: $('.chat-history')[0].scrollHeight}, 1000);
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
