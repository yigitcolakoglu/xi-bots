let mongoose = require('mongoose')

module.exports = {
    userModel :  mongoose.model('users', new mongoose.Schema({
        _id: String,
        joined_at: Number,
        team_id: String,
        profession: Array,
        rank: Number,
        xp: Number,
        email: String,
        trello_id: String
     })),

     teamModel: mongoose.model('teams', new mongoose.Schema({
        _id: mongoose.Types.ObjectId,
       team_name: String,
       creator: String,
       mods: Array,
       member_role: String,
       mod_role: String,
       text_channel: String,
       voice_channel: String,
       board_id: String
    }))
}
