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

const MAX_PEOPLES = ['Unlimited',1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const LEVELS = ["Any Level", "Beginner", "Upper Beginner", "Intermediate", "Upper Intermediate", "Advanced", "Upper Advanced"];
module.exports = { ROLES, STATUS_USER, TYPES, MAX_PEOPLES, LEVELS };
