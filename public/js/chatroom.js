
$("#chat-toggle").click(function () {
  $('.chat').slideToggle( "slow" );
})

'use strict';
var localStream = null;


/**
 * Socket.io socket
 */
// let socket;
/**
 * The stream object used to send media
 */
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
const configuration = {
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

/////////////////////////////////////////////////////////

constraints.video.facingMode = {
  ideal: "user"
}



const rooms = {
  chat: function (roomId, username, userId) {
    let socket = io('/chatroom', {transports: ['websocket']});
    let answersFrom = {}, offer;



// enabling the camera at startup
    navigator.mediaDevices.getUserMedia(constraints).then(stream => {
      console.log('Received local stream');
      localVideo.srcObject = stream;
      localStream = stream;
    }).catch(e => alert(`getusermedia error ${e.name}`))

      getHistoryMsg(roomId);
      /**
       * initialize the socket connections
       */
      function init() {

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
      console.log("in addPeer !")
      peers[socket_id] = new SimplePeer({
        initiator: am_initiator,
        stream: localStream,
        config: configuration
      })

      peers[socket_id].on('signal', data => {
        console.log('peer in signal')
        socket.emit('signal', {
          signal: data,
          socket_id: socket_id
        })
      })

      peers[socket_id].on('stream', stream => {
        console.log('peer in stream')
        let newVid = document.createElement('video')
        newVid.srcObject = stream
        newVid.id = socket_id
        newVid.playsinline = false
        newVid.autoplay = true
        newVid.className = "vid"
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
      console.log('opening pip')
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
        app.helpers.addMessage(message);
      }
    }


    // When socket connects, join the current chatroom
    socket.on('connect', function () {
      console.log("joined room!")
      init();
      // Whenever the user hits the save button, emit newMessage event.
      $('.chat-message button').on('click', function (e) {
        const textareaEle = $("input[name='message']");
        const messageContent = textareaEle.val().trim();
        if (messageContent !== '') {
          const message = {
            content: messageContent,
            username: username,
            date: Date.now(),
          };

          socket.emit('newMessage', {roomId, message, userId});
          textareaEle.val('');
          app.helpers.addMessage(message);
        }
      });

      // Enter in input send message
      $('#input-message').keypress(function (e) {
        if (e.which == 13) {
          $('.chat-message button').click();
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

/**
 * Switches the camera between user and environment. It will just enable the camera 2 cameras not supported.
 */
function switchMedia() {
  if (constraints.video.facingMode.ideal === 'user') {
    constraints.video.facingMode.ideal = 'environment'
  } else {
    constraints.video.facingMode.ideal = 'user'
  }

  const tracks = localStream.getTracks();

  tracks.forEach(function (track) {
    track.stop()
  })

  localVideo.srcObject = null
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

    localStream = stream
    localVideo.srcObject = stream

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
            localStream = stream
            localVideo.srcObject = localStream
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
  if (localStream) {
    const tracks = localStream.getTracks();

    tracks.forEach(function (track) {
      track.stop()
    })

    localVideo.srcObject = null
  }

  for (let socket_id in peers) {
    removePeer(socket_id)
  }
}

/**
 * Enable/disable microphone
 */
function toggleMute() {
  for (let index in localStream.getAudioTracks()) {
    localStream.getAudioTracks()[index].enabled = !localStream.getAudioTracks()[index].enabled
    muteButton.innerText = localStream.getAudioTracks()[index].enabled ? "Unmuted" : "Muted"
  }
}
/**
 * Enable/disable video
 */
function toggleVid() {
  for (let index in localStream.getVideoTracks()) {
    localStream.getVideoTracks()[index].enabled = !localStream.getVideoTracks()[index].enabled
    //vidButton.innerText = localStream.getVideoTracks()[index].enabled ? "Video Enabled" : "Video Disabled"
  }
}

/**
 * updating text of buttons
 */
function updateButtons() {
  for (let index in localStream.getVideoTracks()) {
    vidButton.innerText = localStream.getVideoTracks()[index].enabled ? "Video Enabled" : "Video Disabled"
  }
  for (let index in localStream.getAudioTracks()) {
    muteButton.innerText = localStream.getAudioTracks()[index].enabled ? "Unmuted" : "Muted"
  }
}

$('#microphone-mode').on('click', function (e) {

  for (let index in localStream.getAudioTracks()) {
    localStream.getAudioTracks()[index].enabled = !localStream.getAudioTracks()[index].enabled
    if (localStream.getAudioTracks()[index].enabled){
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

  for (let index in localStream.getVideoTracks()) {
    localStream.getVideoTracks()[index].enabled = !localStream.getVideoTracks()[index].enabled
    if (localStream.getVideoTracks()[index].enabled) {
      $('#path-camera-off').css('visibility', 'hidden');
      $('#path-camera-on').css('visibility', 'visible');
    } else {
      $('#path-camera-off').css('visibility', 'visible');
      $('#path-camera-on').css('visibility', 'hidden');
    }
  }

});









