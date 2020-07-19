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
    name: 'lower',
    family: 'team',
	channel: ['734387503464710165'],
	description: 'Lower a user in a team ',
	async execute(message) {
        let targets = message.mentions.members
        const member_id = message.member.id;

        if(targets.size == 0){
            return message.reply("You must supply at least one member!")
        }else if(targets.size > 20){
            return message.reply("You can lower at most 20 users!")
        }

        try {
            await mongoose.connect( mongo_url, {useNewUrlParser: true, useUnifiedTopology: true}, () => null );    
        }catch (error) { 
            console.log("ERROR WITH MONGODB CONNECTION");    
        }

        const user_data = await userModel.find({_id: member_id}, "team_id");

        if(user_data[0].team_id === "0"){
            return message.reply("You must be in a team to lower a user!");
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
                if(key == member_id){
                    return message.reply("You cannot lower yourself!")
                }else if (key == team.creator){
                    return message.reply("You cannot lower the creator!")
                }
                if(mod_index !== -1){
                    value.roles.add(team.member_role);
                    value.roles.remove(team.mod_role);
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
                    message.channel.send(`Lowered user <@${key}>`)
                }else{
                    message.channel.send(`<@${key}> not a mod!`)
                }
            }else{
                message.channel.send(`Can't lower user <@${key}>`);
            }
        });

    },
};