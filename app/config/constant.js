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

module.exports = { ROLES, STATUS_USER, TYPES };
