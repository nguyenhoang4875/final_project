const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ChatModel = new Schema({
   sender_id: { 
      type: Object, 
      ref: 'Users'
   },
   room_id: {
      type: Schema.Types.ObjectId,
      ref: 'Rooms'
   },
   message: String,
   created: { 
      type: Date,
      default: Date.now
   },
   updated: { 
      type: Date,
      default: Date.now
   },
});

module.exports = mongoose.model('Chats', ChatModel );