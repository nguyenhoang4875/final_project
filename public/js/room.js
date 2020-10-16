let options = [];
let select;
axios.get('/users/me')
    .then(res => {
        localStorage.setItem('datn_2020', JSON.stringify(res.data));
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
toogleModal = () => {
    $('#list_members').data('selectize').setValue("");
    $("#submit_room").attr("disabled", false).html('Submit');
    $("input[name='list_members']").val('');
    $("input[name='title']").val('');
    $("input[name='quantity']").val('');
    $("input[name='level']").val('');
    $("input[name='room_id']").val('');
};

showEditModal = function (id) {
    toogleModal();
    $('#modalHeader').html('Edit Room');
    $('#form_room').modal('toggle').attr('action', '/rooms/'+id+'/edit');
    $(".submitForm").attr("id","edit_room");
    $("#delete_room").attr("disabled", false).html('Delete').attr("style", "margin-right: 52%").show();

    axios.get('/rooms/' + id)
        .then(res => {
            const room = res.data.data;
            let users = room.users;
            $("input[name='title']").val(room.name);
            $("input[name='quantity']").val(room.quantity);
            $("input[name='level']").val(room.level);
            $("input[name='room_id']").val(room._id);
            if (!!users && !!users[0]) {
                let emails = users.map(user => user.email + "");
                $('#list_members').data('selectize').setValue(emails);
            }
        })
        .catch(err => {
            console.log(err);
        });

};

showCreateModal = function () {
    toogleModal();
    $('#modalHeader').html('Create Room');
    $('#form_room').modal('toggle').attr('action', '/rooms/create');
    $(".submitForm").attr("id","create_room");
    $("#delete_room").hide();
};

searchEvent = () => {
    let search = $("#search_room_input").val();
    $("#search_room_button").attr('href', '?search=' + search);
};
