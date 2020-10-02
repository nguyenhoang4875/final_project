const { body } = require('express-validator');

module.exports = [
  body('username')
    .exists()
    .withMessage('username_is_required')
    .not()
    .isEmpty()
    .withMessage('username_is_required'),
    body('name')
    .exists()
    .withMessage('username_is_required')
    .not()
    .isEmpty()
    .withMessage('username_is_required'),
];
