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

showEnterPasswordModal = function (roomId) {
    toggleEnterPasswordModal(roomId);

}

toggleEnterPasswordModal = (roomId) => {
    $('#form_join_room').modal('toggle');
    $("input[name='join_room_id']").val(roomId);
};

const $dropdown_menu_user = $('.dropdown-menu-user');

$(document).mouseup(e => {
    $dropdown_menu_user.removeClass('is-active');
});

$('.user_avatar_parent').on('click', function () {
    if (($dropdown_menu_user.hasClass("is-active")) == false){
        $dropdown_menu_user.addClass("is-active")
    }
    else {
        $dropdown_menu_user.removeClass("is-active")
    }
});

