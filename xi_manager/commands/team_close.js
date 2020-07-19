const {
    mongo_url,
    trello_token, 
    trello_key
} = require('../config.json');

const {
    userModel,
    teamModel,
} = require('./schemas.js');

let mongoose = require('mongoose');
let Trello = require('trello-node-api')(trello_key, trello_token);

module.exports = {
    name: 'close',
    family: 'team',
	channels: ['734387503464710165'],
	description: 'Close the team! ',
	async execute(message) {

        var member_id = message.member.id;

        try {
            await mongoose.connect( mongo_url, {useNewUrlParser: true, useUnifiedTopology: true}, () => null);    
        }catch (error) { 
            console.log("could not connect");    
        }
        const user_data = await userModel.find({_id: member_id},"team_id trello_id email");
        const team_id = user_data[0].team_id

        if(team_id == '0'){
            return message.reply('You must be in a team to quit!');
        }

        var teamdata = await teamModel.find({ _id :team_id },'member_role mod_role text_channel voice_channel mods board_id');
        var team = teamdata[0];

        message.guild.roles.fetch(team.member_role).then((role) => role.delete());
        message.guild.roles.fetch(team.mod_role).then((role) => role.delete());
        message.client.channels.fetch(team.text_channel).then((channel) => channel.delete());
        message.client.channels.fetch(team.voice_channel).then((channel) => channel.delete());

        let old_team = new teamModel(team);
        old_team.remove();
        Trello.board.del(team.board_id)
        .catch(function (error) {
            console.log('error', error);
        });
        userModel.updateMany({team_id: team_id}, { team_id: 0 }, function(err, res) {});
				message.channel.send("Team closed successfully!")
	},
}
