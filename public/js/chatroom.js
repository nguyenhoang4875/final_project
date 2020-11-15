
$("#chat-toggle").click(function () {
  $('.chat').slideToggle( "slow" );
})

let inputMessage = document.getElementById("input_chat_message");
let ul = document.querySelector("ul")

'use strict';

/**
 * The stream object used to send media
 */
let myStream = null;
/**
 * All peer connections
 */
let peers = {}

// redirect if not https
if(location.href.substr(0,5) !== 'https')
  location.href = 'https' + location.href.substr(4, location.href.length - 4)

//////////// CONFIGURATION //////////////////

/**
 * RTCPeerConnection configuration
 */
let configuration = {
  "iceServers": [{
    "urls": "stun:stun.l.google.com:19302"
  },
    // public turn server from https://gist.github.com/sagivo/3a4b2f2c7ac6e1b5267c2f1f59ac6c6b
    // set your own servers here
    {
      url: 'turn:192.158.29.39:3478?transport=udp',
      credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
      username: '28224511:1379330808'
    }
  ]
}

/**
 * UserMedia constraints
 */
let constraints = {
  audio: true,
  video: true
}

constraints.video.facingMode = {
  ideal: "user"
}

const rooms = {
  chat: async function (roomId, username, userId) {
    let socket = io('/chatroom', {transports: ['websocket']});
    let answersFrom = {}, offer;
    await socket.emit('getIceServer');
    await socket.on('returnIceServer', function (iceServer){
      configuration.iceServers = iceServer;
      console.log('ice server in returnIceServers ', configuration);
      // enabling the camera at startup
      navigator.mediaDevices.getUserMedia(constraints).then(stream => {
        console.log('Received local stream');
        myVideo.srcObject = stream;
        myStream = stream;
        joinRoom();
      }).catch(e => alert(`getUserMedia error ${e.name}`))
    });
      getHistoryMsg(roomId);

      /**
       * initialize the socket connections
       */
      function joinRoom() {

      socket.emit('join-room', {roomId, userId})
      socket.on('initReceive', socket_id => {
        console.log('INIT RECEIVE ' + socket_id)
        addPeer(socket_id, false)
        socket.emit('initSend', socket_id)
      })

      socket.on('initSend', socket_id => {
        console.log('INIT SEND ' + socket_id)
        addPeer(socket_id, true)
      })

      socket.on('removePeer', socket_id => {
        console.log('removing peer ' + socket_id)
        removePeer(socket_id)
      })

      socket.on('disconnect', () => {
        console.log('GOT DISCONNECTED')
        for (let socket_id in peers) {
          removePeer(socket_id)
        }
      })

      socket.on('signal', data => {
        peers[data.socket_id].signal(data.signal)
      })
    }

    /**
     * Remove a peer with given socket_id.
     * Removes the video element and deletes the connection
     * @param {String} socket_id
     */
    function removePeer(socket_id) {

      let videoEl = document.getElementById(socket_id)
      if (videoEl) {

        const tracks = videoEl.srcObject.getTracks();

        tracks.forEach(function (track) {
          track.stop()
        })

        videoEl.srcObject = null
        videoEl.parentNode.removeChild(videoEl)
      }
      if (peers[socket_id]) peers[socket_id].destroy()
      delete peers[socket_id]
    }

    /**
     * Creates a new peer connection and sets the event listeners
     * @param {String} socket_id
     *                 ID of the peer
     * @param {Boolean} am_initiator
     *                  Set to true if the peer initiates the connection process.
     *                  Set to false if the peer receives the connection.
     */
    function addPeer(socket_id, am_initiator) {
      peers[socket_id] = new SimplePeer({
        initiator: am_initiator,
        stream: myStream,
        config: configuration
      })

      peers[socket_id].on('signal', data => {
        socket.emit('signal', {
          signal: data,
          socket_id: socket_id
        })
      })

      peers[socket_id].on('stream', stream => {
        let newVid = document.createElement('video')
        newVid.srcObject = stream
        newVid.id = socket_id
        newVid.playsinline = false
        newVid.autoplay = true
        newVid.className = "vid"
        newVid.controls = true
        newVid.onclick = () => openPictureMode(newVid)
        newVid.ontouchstart = (e) => openPictureMode(newVid)
        videos.appendChild(newVid)
      })
    }

    /**
     * Opens an element in Picture-in-Picture mode
     * @param {HTMLVideoElement} el video element to put in pip mode
     */
    function openPictureMode(el) {
      el.requestPictureInPicture()
    }


    function error(err) {
      console.warn('Error', err);
    }

    function getHistoryMsg(roomId) {
      axios.get('/chat/' + roomId + '/messages')
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
        rooms.helpers.addMessage(message);
      }
    }

    // When socket connects, join the current chatroom
    socket.on('connect', function () {
      // Whenever the user hits the save button, emit newMessage event.
      $('.fa-paper-plane').on('click', function (e) {
        const messageContent = inputMessage.value.trim();
        if (messageContent !== '') {
          const message = {
            content: messageContent,
            username: username,
            date: Date.now(),
          };
          socket.emit('newMessage', {roomId, message, userId});
          rooms.helpers.addMessage(message);
          inputMessage.value = '';
        }
      });

      // Enter in input send message
      $('#input_chat_message').keypress(function (e) {
        if (e.which == 13) {
          $('.fa-paper-plane').click();
        }
      });

      // Whenever a user leaves the current room, remove the user from users list
      socket.on('removeUser', function (userId) {
        console.log(userId);
        $('li#user-' + userId).remove();
        rooms.helpers.updateNumOfUsers();
      });

      // Append a new message
      socket.on('addMessage', function (message) {
        rooms.helpers.addMessage(message);
      });

      socket.on('remove-user', function ({id}) {
        console.log('in remove user id: ', id);
        const removeId = id.trim().substr(10);
        const div = document.getElementById(id);

       /* if (!!div) {
          document.getElementById('users').removeChild(div);
        }

        $("#" + removeId).remove();*/
      });
      console.log('end join room!');
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

    addMessage: function (messageCome) {
      console.log('in addMessage method');
      let message = messageCome.content;
      let username = messageCome.username;
      if ($(".main__right").css('display') === "none") {
        $(".chat_count").css('display','block');
        $(".chat_count").innerText = ++chat_count;
      }
      let li_node = document.createElement("LI");                 // Create a <li> node
      li_node.innerHTML = `<strong>${username}</strong><br><p>${message}</p>`
      ul.appendChild(li_node);

      if (username === NAME) {
        li_node.classList.add("message__user");
        li_node.classList.add("message__userCard");

      } else {
        li_node.classList.add("message__other");
        li_node.classList.add("message__guestCard");
      }

      $(".main__chat_window").animate({scrollTop: $('.main__chat_window')[0].scrollHeight}, 100);

    },

    scrollToBottom: function (){
      let d = $('.main__chat_window');
      d.scrollTop = d.scrollHeight;
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

/**
 * Switches the camera between user and environment. It will just enable the camera 2 cameras not supported.
 */
function switchMedia() {
  if (constraints.video.facingMode.ideal === 'user') {
    constraints.video.facingMode.ideal = 'environment'
  } else {
    constraints.video.facingMode.ideal = 'user'
  }

  const tracks = myStream.getTracks();

  tracks.forEach(function (track) {
    track.stop()
  })

  myVideo.srcObject = null
  navigator.mediaDevices.getUserMedia(constraints).then(stream => {

    for (let socket_id in peers) {
      for (let index in peers[socket_id].streams[0].getTracks()) {
        for (let index2 in stream.getTracks()) {
          if (peers[socket_id].streams[0].getTracks()[index].kind === stream.getTracks()[index2].kind) {
            peers[socket_id].replaceTrack(peers[socket_id].streams[0].getTracks()[index], stream.getTracks()[index2], peers[socket_id].streams[0])
            break;
          }
        }
      }
    }

    myStream = stream
    myVideo.srcObject = stream

    updateButtons()
  })
}

/**
 * Enable screen share
 */
// Enable screen share

function setScreen() {
  navigator.mediaDevices.getDisplayMedia().then(stream => {
    toggleVid()
    // document.querySelector(".screen_sharing").style.display = "block";
    return stream;
  })
      .then(stream => {
        const screenTrack = stream.getTracks()[0];
        // console.log("stream.getTracks() ", stream.getTracks())
        for (let socket_id in peers) {
          // console.log("peers[socket_id].streams[0].getTracks() ", peers[socket_id].streams[0].getTracks())
          for (let index in peers[socket_id].streams[0].getTracks()) {
            for (let index2 in stream.getTracks()) {
              if (peers[socket_id].streams[0].getTracks()[index].kind === stream.getTracks()[index2].kind) {
                peers[socket_id].replaceTrack(peers[socket_id].streams[0].getTracks()[index], stream.getTracks()[index2], peers[socket_id].streams[0])
                break;
              }
            }
          }
        }

        screenTrack.onended = function () {
          console.log("ended")
          // document.querySelector(".screen_sharing").style.display = "none";
          navigator.mediaDevices.getUserMedia(constraints).then(stream => {
            for (let socket_id in peers) {
              for (let index in peers[socket_id].streams[0].getTracks()) {
                for (let index2 in stream.getTracks()) {
                  if (peers[socket_id].streams[0].getTracks()[index].kind === stream.getTracks()[index2].kind) {
                    console.log("entered")
                    peers[socket_id].replaceTrack(peers[socket_id].streams[0].getTracks()[index], stream.getTracks()[index2], peers[socket_id].streams[0])
                    break;
                  }
                }
              }
            }
            myStream = stream
            myVideo.srcObject = myStream
          }).catch(function (error) {
            console.log(error);
          });
        }
      })
}

/**
 * Disables and removes the local stream and all the connections to other peers.
 */
function removeLocalStream() {
  if (myStream) {
    const tracks = myStream.getTracks();

    tracks.forEach(function (track) {
      track.stop()
    })

    myVideo.srcObject = null
  }

  for (let socket_id in peers) {
    removePeer(socket_id)
  }
}

/**
 * Enable/disable microphone
 */
function toggleMute() {
  for (let index in myStream.getAudioTracks()) {
    myStream.getAudioTracks()[index].enabled = !myStream.getAudioTracks()[index].enabled
    muteButton.innerText = myStream.getAudioTracks()[index].enabled ? "Unmuted" : "Muted"
  }
}
/**
 * Enable/disable video
 */
function toggleVid() {
  for (let index in myStream.getVideoTracks()) {
    myStream.getVideoTracks()[index].enabled = !myStream.getVideoTracks()[index].enabled
    //vidButton.innerText = myStream.getVideoTracks()[index].enabled ? "Video Enabled" : "Video Disabled"
  }
}

/**
 * updating text of buttons
 */
function updateButtons() {
  for (let index in myStream.getVideoTracks()) {
    vidButton.innerText = myStream.getVideoTracks()[index].enabled ? "Video Enabled" : "Video Disabled"
  }
  for (let index in myStream.getAudioTracks()) {
    muteButton.innerText = myStream.getAudioTracks()[index].enabled ? "Unmuted" : "Muted"
  }
}

$('#microphone-mode').on('click', function (e) {

  for (let index in myStream.getAudioTracks()) {
    myStream.getAudioTracks()[index].enabled = !myStream.getAudioTracks()[index].enabled
    if (myStream.getAudioTracks()[index].enabled){
      $('#path-micro-off').css('visibility', 'hidden');
      $('#path-micro-on').css('visibility', 'visible');
    }
    else {
      $('#path-micro-off').css('visibility', 'visible');
      $('#path-micro-on').css('visibility', 'hidden');
    }
  }
});

$('#video-mode').on('click', function (e) {

  for (let index in myStream.getVideoTracks()) {
    myStream.getVideoTracks()[index].enabled = !myStream.getVideoTracks()[index].enabled
    if (myStream.getVideoTracks()[index].enabled) {
      $('#path-camera-off').css('visibility', 'hidden');
      $('#path-camera-on').css('visibility', 'visible');
    } else {
      $('#path-camera-off').css('visibility', 'visible');
      $('#path-camera-on').css('visibility', 'hidden');
    }
  }
});

<!-- chat section toggle -->
  let isChat = true;
  function handleChat(){
  let main_right = $(".main__right");
  if (isChat) {
    $(".main__right").css('display','none')
    $(".main__left").css('flex',1) ;
    isChat = false;
  } else {
    $(".main__right").css('display','flex')
    $(".main__left").css('flex','0.7')
    $(".chat_count").css('display','none');
    isChat = true;
  }
}
