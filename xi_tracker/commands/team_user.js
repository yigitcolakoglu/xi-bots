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
    name: 'add',
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
            return message.reply("You must be in a team to add a user!");
        } 

        const team_data = await teamModel.find({_id: user_data[0].team_id}, "creator mods team_name member_role board_id");
        const team = team_data[0]

        if(member_id !== team.creator && team.mods.indexOf(member_id) === -1){
            return message.reply("You do not have enough privileges for this action!")
        }

        targets.forEach(async(value, key, map) => {
            let target_data = await userModel.find({_id: key}, "team_id email");
            if(target_data[0].team_id === "0"){
                value.roles.add(team.member_role)
                let result = await userModel.findOneAndUpdate(
                    {_id: key},
                    {team_id: team._id},
                    {
                        new: true,
                        runValidators: true,
                        useFindAndModify: false
                    }
                );
                message.client.users.fetch(key).then((user) => user.send(`You have been added to the team ${team.team_name}`))
                if(!target_data[0].email){
                    message.client.users.fetch(key).then((user) => user.send("You need an email to access the team's trello board! Add your email after the !email prefix to set your email address."))
                }else{
                    let addition = await fetch(`https://api.trello.com/1/boards/${team.board_id}/members?key=${trello_key}&token=${trello_token}&email=${target_data[0].email}&type=normal`, {
                        method: 'PUT'
                    })
                      .catch(err => console.error(err));
        
                    let data = await addition.json()
        
                    let result = await userModel.findOneAndUpdate(
                        {_id: key},
                        {email: target_data[0].email, trello_id: data.memberships[data.memberships.length - 1].idMember},
                        {
                            new: true,
                            runValidators: true,
                            useFindAndModify: false
                        }
                    );
                }
                message.channel.send(`Added user <@${key}>`)
            }else{
                message.channel.send(`Can't add user <@${key}>`);
            }
        });
        
	},
};