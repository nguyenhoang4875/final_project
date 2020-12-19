let options = [];
let select;
axios.get('/users/me')
    .then(res => {
        localStorage.setItem('user', JSON.stringify(res.data));
    })
    .catch(err => {
        console.log(err);
    });

axios.get('/users/')
    .then(function (response) {
        // handle success
        const users = response.data.users;
        options = users.map(user => {
            return {email: user.email, name: user.username, selected: true};
        });
        select = $('#list_members').selectize({
            persist: false,
            maxItems: null,
            valueField: 'email',
            labelField: 'name',
            searchField: ['name', 'email'],
            options,
            render: {
                item: function (item, escape) {
                    return '<div>' + (item.email ? '<span class="email">' + escape(item.email) + '</span>' : '') +
                        '</div>';
                },
                option: function (item, escape) {
                    const label = item.name || item.email;
                    const caption = item.name ? item.email : null;
                    return '<div class="px-2 pt-3">' +
                        '<span class="label"><b>' + escape(label) + '</b></span>' +
                        (caption ? '<span class="caption">' + ' ( ' + escape(caption) + ' )' + '</span>' : '') +
                        '</div>';
                }
            },
            createFilter: function (input) {
                let match, regex;

                // email@address.com
                regex = new RegExp('^' + REGEX_EMAIL + '$', 'i');
                match = input.match(regex);
                if (match) return !this.options.hasOwnProperty(match[0]);

                // name <email@address.com>
                regex = new RegExp('^([^<]*)\<' + REGEX_EMAIL + '\>$', 'i');
                match = input.match(regex);
                if (match) return !this.options.hasOwnProperty(match[2]);

                return false;
            },
            create: function (input) {
                if ((new RegExp('^' + REGEX_EMAIL + '$', 'i')).test(input)) {
                    return {email: input};
                }
                const match = input.match(new RegExp('^([^<]*)\<' + REGEX_EMAIL + '\>$', 'i'));
                if (match) {
                    return {
                        email: match[2],
                        name: $.trim(match[1])
                    };
                }
                alert('Invalid email address.');
                return false;
            }
        });
    })
    .catch(function (error) {
        // handle error
        console.log(error);
    })
    .finally(function () {
        // always executed
    });
toggleModal = () => {
    $("#submit_room").attr("disabled", false).html('Submit');
    $("input[name='topic']").val('');
    $("#selectMaxPeople").val('Unlimited');
    $("#selectLevels").val('Any Level');
    $("input[name='room_id']").val('');
    $("input[name='password']").val('');
};

showEditModal = function (id) {
    toggleModal();
    $('#modalHeader').html('Edit Room');
    $('#form_room').modal('toggle').attr('action', '/rooms/'+id+'/edit');
    $(".submitForm").attr("id","edit_room");
    $("#delete_room").attr("disabled", false).html('Delete').attr("style", "margin-right: 52%").show();

    axios.get('/rooms/' + id)
        .then(res => {
            const room = res.data.data;
            $("input[name='topic']").val(room.name);
            $("#selectMaxPeople").val(room.quantity);
            $("#selectLevels").val(room.level);
            $("input[name='room_id']").val(room._id);
            $("input[name='password']").val(room.password);
        })
        .catch(err => {
            console.log(err);
        });
};

showCreateModal = function () {
    toggleModal();
    $('#modalHeader').html('Create Room');
    $('#form_room').modal('toggle').attr('action', '/rooms/create');
    $(".submitForm").attr("id","create_room");
    $("#delete_room").hide();
};

searchEvent = () => {
    let search = $("#search_room_input").val();
    $("#search_room_button").attr('href', '?search=' + search);
};

$("#search_room_input").on('keyup', function (e) {
    let search = $("#search_room_input").val();
    $("#search_room_button").attr('href', '?search=' + search);
    if (e.key === 'Enter' || e.key === 13){
        if (search.trim() === ''){
            window.location.href = '/rooms/me';
        }
        else {
        window.location.href = '?search=' + search;
        }
    }
})


axios.get('/utils/max-peoples').then(res => {
    let maxPeoples = res.data;
    maxPeoples.forEach(x => $("#selectMaxPeople").append(new Option(x,x)));
    })
    .catch(err => {
        console.log(err);
    }
);

axios.get('/utils/levels').then(res => {
    let levels = res.data;
    levels.forEach(x => $("#selectLevels").append(new Option(x,x)));
})
    .catch(err => {
            console.log(err);
        }
);

const socket = io('/rooms', {transports: ['websocket']});

// When socket connects, get a list of chat rooms
socket.on('connect', function () {

    //let users = room.users;
    let local = localStorage.getItem('user');
    local = !!local ? JSON.parse(local) : null;
    let userId = local._id;

    // When socket connects, get a list of chat rooms
        // Update rooms list upon emitting updateRoomsList event
        socket.on('updateRoomsList', function ({room, creator, users}) {
            // Display an error message upon a user error(i.e. creating a room with an existing title)
            console.log('room in delete manage', room);
            $('#form_room').modal('toggle');
            toastr.info(room.message);
            setTimeout(function () {
                location.reload();
            },1000);

        });

    // Whenever the user hits the create button, emit createRoom event.
    $('#submit_room').on('click', function (e) {
        e.preventDefault();
        let roomId = $("input[name='room_id']").val();
        let name = $("input[name='topic']").val().trim();
        let quantity = $("#selectMaxPeople").val();
        let level = $("#selectLevels").val();
        let roomPwd = $("input[name='password']").val();

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
                    socket.emit('editRoom', {name, level, quantity, userId, roomId, roomPwd});
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
                socket.on('invalid-room-password', function (inValid) {
                    toastr.error("Room password is invalid");
                })
            }
        }
    });
});

