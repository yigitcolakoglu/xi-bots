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
const fetch = require('node-fetch');

module.exports = {
    name: 'kick',
    family: 'team',
	channels: ['734387503464710165'],
	description: 'Add user to team',
	async execute(message) {
        let targets = message.mentions.members
        const member_id = message.member.id;

        if(targets.size == 0){
            return message.reply("You must supply at least one member!")
        }else if(targets.size > 20){
            return message.reply("You can add at most 20 users!")
        }

        try {
            await mongoose.connect( mongo_url, {useNewUrlParser: true, useUnifiedTopology: true}, () => null );    
        }catch (error) { 
            console.log("ERROR WITH MONGODB CONNECTION");    
        }

        const user_data = await userModel.find({_id: member_id}, "team_id");

        if(user_data[0].team_id === "0"){
            return message.reply("You must be in a team to kick a user!");
        } 

        const team_data = await teamModel.find({_id: user_data[0].team_id}, 
            "creator board_id mods team_name member_role mod_role");
        const team = team_data[0]

        if(member_id !== team.creator && team.mods.indexOf(member_id) === -1){
            return message.reply("You do not have enough privileges for this action!")
        }
        
        let mods = team.mods

        targets.forEach(async(value, key, map) => {
            if(key == member_id){
                return message.reply("You cannot kick yourself!")
            }else if (key == team.creator){
                return message.reply("You cannot kick the creator!")
            }

            let target_data = await userModel.find({_id: key}, "team_id trello_id email");

            if(target_data[0].team_id == team._id){
                let mod_index = team.mods.indexOf(key)
                if(mod_index == -1){
                    value.roles.remove(team.member_role)	
                }else{
                    value.roles.remove(team.mod_role)	
                    mods.splice(mod_index, 1)
                    let result = await teamModel.findOneAndUpdate(
                        {_id: team._id},
                        {mods: mods},
                        {
                            new: true,
                            runValidators: true,
                            useFindAndModify: false
                        }
                    );
                }

                let result = await userModel.findOneAndUpdate(
                    {_id: key},
                    {team_id: "0"},
                    {
                        new: true,
                        runValidators: true,
                        useFindAndModify: false
                    }
                );
                message.client.users.fetch(key).then((user) => user.send(`You have been kicked from the team ${team.team_name}`))
                if(target_data[0].email){
                    console.log("Deleting user from trello")

                    await fetch(`https://api.trello.com/1/boards/${team.board_id}/members/${target_data[0].trello_id}?key=${trello_key}&token=${trello_token}`, {
                    method: 'DELETE'
                    })            
                    .catch(err => console.error(err));
                }
                message.channel.send(`Kicked user <@${key}>`)
            }else{
                message.channel.send(`Can't kick user <@${key}>`);
            }
        });
	},
};