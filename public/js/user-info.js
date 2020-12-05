
$("#btn_back_to_home").on('click', function (){
    history.back();
})


const TYPES = {
    DELETE: 'DELETE',
    CREATE: 'CREATE',
    UPDATE: 'UPDATE'
};

showEditUser = function (id, status) {
    $('#modalHeader').html('Edit User');
    $("#label_psw").html('New password');
    if ( status === '3' ) {
        $('#submit_user').hide();
        $('#delete_user').hide();
    } else {
        $('#submit_user').show();
        $("#delete_user").attr("style", "margin-right: 50%").show();
    }
    $("#old-password").html(`
        <label id="label_psw">Old password</label>
        <input type="password" class="form-control mb-2" name="oldPassword" placeholder="Old password">`
    );
    toggleModal();

    axios.get('/users/' + id)
        .then(res => {
            console.log(res)
            const user = res.data;
            $("input[name='name']").val(user.username);
            $("input[name='email']").val(user.email);
            $("input[name='user_id']").val(user._id);
            $("#role").val(user.role);
        })
        .catch(err => {
            console.log(err);
        });
};


toggleModal = function () {
    $('#form').modal('toggle');
    $("input[name='name']").val('');
    $("input[name='email']").val('');
    $("input[name='newPassword']").val('');
    $("input[name='user_id']").val('');
    $("#submit_user").attr("disabled", false).html('Submit');
    $("#role").val(1);
};

let local = localStorage.getItem('user');
local = !!local ? JSON.parse(local) : null;
const creator = local._id;

const socket = io('/users', {transports: ['websocket']});

// When socket connects, get a list of chatrooms
socket.on('connect', function () {
    socket.on('updateUsersList', function (data, userId) {
        if (data.status === 200) {
            if (userId === creator) {
                setTimeout(function () {
                    toastr.info(data.message);
                    if (data.type !== TYPES.DELETE) {
                        $('#form').modal('toggle');
                    }
                }, 1000);
            }
            setTimeout(function () {
                location.reload();
            }, 2000);
        } else {
            if ( userId === creator)
            {
                if (data.type !== TYPES.DELETE) {
                    $("#submit_user").attr("disabled", false).html('Submit');
                }
                toastr.error(data.message);
            }
        }
    });

    // Whenever the user hits the create button, emit createRoom event.
    $('#submit_user').on('click', function (e) {
        e.preventDefault();
        let userId = $("input[name='user_id']").val();
        let avatar = $("input[name='avatar']").val();
        console.log('avatar ne', avatar);
        let name = $("input[name='name']").val().trim();
        let email = $("input[name='email']").val().trim();
        let role = $("#role").val();
        let newPassword = $("input[name='newPassword']").val().trim();
        let local = localStorage.getItem('user');
        local = !!local ? JSON.parse(local) : null;
        let id = local._id;

        if (!!id) {
            if (userId) {
                let oldPassword = $("input[name='oldPassword']").val().trim();
                if (!!name && !!email && !!role) {
                    $("#submit_user").attr("disabled", true).html('Updating ...');
                    $("#delete_user").attr("style", "margin-right: 43%");
                    socket.emit('editUser', {name, email, id, role, oldPassword, newPassword, userId,avatar});
                } else {
                    toastr.error('Username, email are required !')
                }
            } else {
                if (!!name && !!email && !!role && !!newPassword) {
                    $("#submit_user").attr("disabled", true).html('Creating ...');
                    socket.emit('createUser', {name, email, role, id, password: newPassword });
                } else {
                    toastr.error('All inputs are required !')
                }
            }
        }
    });

});

function readFile() {

    if (this.files && this.files[0]) {

        var FR= new FileReader();

        FR.addEventListener("load", function(e) {
            $("input[name='avatar']").val(e.target.result);
        });

        FR.readAsDataURL( this.files[0] );
    }

}

document.getElementById("inp").addEventListener("change", readFile);
