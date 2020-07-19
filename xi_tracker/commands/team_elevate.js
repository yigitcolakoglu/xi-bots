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

module.exports = {
    name: 'elevate',
    family: 'team',
	channels: ['734387503464710165'],
	description: 'Elevate a user in a team ',
	async execute(message) {
        let targets = message.mentions.members
        const member_id = message.member.id;

        if(targets.size == 0){
            return message.reply("You must supply at least one member!")
        }else if(targets.size > 20){
            return message.reply("You can elevate at most 20 users!")
        }

        try {
            await mongoose.connect( mongo_url, {useNewUrlParser: true, useUnifiedTopology: true}, () => null );    
        }catch (error) { 
            console.log("ERROR WITH MONGODB CONNECTION");    
        }

        const user_data = await userModel.find({_id: member_id}, "team_id");

        if(user_data[0].team_id === "0"){
            return message.reply("You must be in a team to elevate a user!");
        } 

        const team_data = await teamModel.find({_id: user_data[0].team_id}, "creator mods team_name member_role mod_role");
        const team = team_data[0]
        let mods = team.mods

        if(member_id !== team.creator && team.mods.indexOf(member_id) === -1){
            return message.reply("You do not have enough privileges for this action!")
        }

        targets.forEach(async(value, key, map) => {
            let target_data = await userModel.find({_id: key}, "team_id");

            if(target_data[0].team_id == team._id){
                let mod_index = team.mods.indexOf(key)
                if(mod_index == -1){
                    value.roles.remove(team.member_role);
                    value.roles.add(team.mod_role);
                    mods.push(key);
                    let result = await teamModel.findOneAndUpdate(
                        {_id: team._id},
                        {mods: mods},
                        {
                            new: true,
                            runValidators: true,
                            useFindAndModify: false
                        }
                    );
                    message.channel.send(`Elevated user <@${key}>`)
                }else{
                    message.channel.send(`<@${key}> already elevated!`)
                }
            }else{
                message.channel.send(`Can't elavate user <@${key}>`);
            }
        });

    },
};