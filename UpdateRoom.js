const RoomModel = require('./app/models/RoomModel');
const UserModel = require('./app/models/UserModel');
const { ROLES } = require('./app/config/constant');

/**
 * Add admins into all the room
 */

(async () => {
    console.log(' Starting Updated !');
    const admins = await UserModel.find({ role: ROLES.ADMIN }).select('-password -mail_token').exec();
    const rooms = await RoomModel.find().exec();
    const length = rooms.length;
    console.log(length);
    await Promise.all( rooms.map( async (room, index) => {
        console.log(' Updating room: ' + room.name + '. ( ' + (index + 1)+'/'+ length + ' )');
        await RoomModel.update({ _id: room._id }, { $push: { users: admins }} )
    }))
})();
