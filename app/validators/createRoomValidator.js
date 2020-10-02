const { body } = require('./node_modules/express-validator');

module.exports = [
  body('name')
    .exists()
    .withMessage('Room name is required')
    .not()
    .isEmpty()
    .withMessage('Room name is required'),
];
