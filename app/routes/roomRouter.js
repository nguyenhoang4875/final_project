const express = require('express');
const router = express.Router();
const RoomController = require('../controller/RoomController');
const ChatController = require('../controller/ChatController');
const Validator = require('../validators');

// Routes need auth
router.use((req, res, next) => {
    if(req.isAuthenticated()){
        return next();
    }else{
        return res.redirect('/');
    }
});
// Rooms
router.get('/me', (req, res) => RoomController.getListByMe(req, res));
router.get('/all', (req, res) => RoomController.getListAll(req, res));
router.get('/manages', (req, res) => RoomController.getListRoomManage(req, res));
router.get('/:id', (req, res) => RoomController.findRoom(req, res));
//router.post('/create', Validator.createRoomValidator, (req, res) => RoomController.createRoom(req, res));
router.post('/:id/join', (req, res) => RoomController.joinRoom(req, res));
router.post('/:id/edit', (req, res) => RoomController.editRoom(req, res));
router.patch('/:id/update', Validator.createRoomValidator, (req, res) => RoomController.updateRoom(req, res));
router.delete('/:id/delete', Validator.createRoomValidator, (req, res) => RoomController.deleteRoom(req, res));

module.exports = router;
