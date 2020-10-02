const express = require('express');
const router = express.Router();
const ChatController = require('../controller/ChatController');

// Routes need auth
router.use((req, res, next) => {
    if(req.isAuthenticated()){
        return next();
    }else{
        return res.redirect('/');
    }
});

router.get('/:id', (req, res) => ChatController.getMsgByRoomId(req, res)); // Get all messes and render
router.get('/:id/messages', (req, res) => ChatController.getMsgNotRender(req, res)); // Get all room's messages but not return render
router.post('/:id/msg/new', (req, res) => ChatController.createMsg(req, res)); // Create mess
router.patch('/:id/msg/:msg_id/update', (req, res) => ChatController.updateMsg(req, res));
router.delete('/:id/msg/:msg_id/delete', (req, res) => ChatController.deleteMsg(req, res));

module.exports = router;