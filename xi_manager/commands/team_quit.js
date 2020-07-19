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
var Trello = require('trello-node-api')(trello_key, trello_token);
const fetch = require('node-fetch');

const { strict } = require('assert');
const { parse } = require('path');
module.exports = {
    name: 'quit',
    family: 'team',
	channels: ['734387503464710165'],
	description: 'Quit from a team',
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

        const filter = { _id : member_id };
        const update = { team_id : '0' };
        var def = await userModel.findOneAndUpdate(filter, update,{
            new: true,
            runValidators: true,
            useFindAndModify: false
        });
        var teamdata = await teamModel.find({ _id :team_id },'member_role mod_role text_channel voice_channel mods board_id');
        var team = teamdata[0];
        var mods = team.mods;

        let mod_index = team.mods.indexOf(member_id)
            if(mod_index === -1){
                message.member.roles.remove(team.member_role)    
            }else{
                message.member.roles.remove(team.mod_role)    
                mods.splice(mod_index, 1)
            }
        
        teamModel.findOneAndUpdate({_id :team_id},{mods : mods});
        if(user_data[0].email){
            await fetch(`https://api.trello.com/1/boards/${team.board_id}/members/${user_data[0].trello_id}?key=${trello_key}&token=${trello_token}`, {
            method: 'DELETE'
            })            
            .catch(err => console.error(err));
        }

        let team_members = await userModel.find({team_id: team_id})
    
        if(team_members.length == 0){
            message.channel.send("No users left in this team. Deleting");
            message.guild.roles.fetch(team.member_role).then((role) => role.delete());
            message.guild.roles.fetch(team.mod_role).then((role) => role.delete());
            message.client.channels.fetch(team.text_channel).then((channel) => channel.delete());
            message.client.channels.fetch(team.voice_channel).then((channel) => channel.delete());

            team.mods = mods;
            let old_team = new teamModel(team);
            old_team.remove();
            Trello.board.del(team.board_id)
            .catch(function (error) {
                console.log('error', error);
            });
        }
        return message.reply('Done!');

	},
};