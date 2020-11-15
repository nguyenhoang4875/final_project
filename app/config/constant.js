const ROLES = {
    'MEMBER': 1,
    'ROOM_MASTER': 2,
    'ADMIN': 3,
};

const STATUS_USER = {
    'ACTIVE': 1,
    'INACTIVE': 2,
    'DELETED': 3,
};

const TYPES = {
    DELETE: 'DELETE',
    CREATE: 'CREATE',
    UPDATE: 'UPDATE'
};

const STATUS_ROOM = {
    'ACTIVE': 'active',
    'FULL': 'full',
    'LOOKED': 'looked',
    'AUTH': 'auth',
};

const TWILIO = {
    'ACCOUNT_SID' : 'ACd901d0cb3536b874b1ee0992d32ed906',
    'AUTH_TOKEN' : 'b872a872507270809c9ea2c48123a3fd'
}

const MAX_PEOPLES = ['Unlimited',1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const LEVELS = ["Any Level", "Beginner", "Upper Beginner", "Intermediate", "Upper Intermediate", "Advanced", "Upper Advanced"];
module.exports = { ROLES, STATUS_USER, TYPES, MAX_PEOPLES, LEVELS, STATUS_ROOM, TWILIO };
