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
const allowed_chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_";

module.exports = {
    name: 'create',
    family: 'team',
	channels: ['734387503464710165'],
	description: 'Create a team',
	async execute(message) {
        let team_name = message.content.split(" ")[2];

        if(!team_name){
            return message.reply("You must supply a team name!")
        }

        if(team_name.length > 20){
            return message.reply("Team names can be 20 letters max.");
        } 

        for (let i = 0; i < team_name.length; i++) {
            if(allowed_chars.indexOf(team_name.charAt(i)) == -1){
                return message.reply("Team names can only have letters and underscore");
            }
        }
        var member_id = message.member.id;

        try {
            await mongoose.connect( mongo_url, {useNewUrlParser: true, useUnifiedTopology: true}, () => null );    
        }catch (error) { 
            console.log("ERROR WITH MONGODB CONNECTION");    
        }

        const user_data = await userModel.find({_id: member_id}, "team_id email");
        team = user_data[0].team_id

        if(team !== '0'){
            return message.reply("You already are in a team!")
        } 
        
        const teams_search = await teamModel.find({team_name: team_name}, "id")
        if(teams_search.length != 0){
            return message.reply("A team with that name already exists!")
        }

        let regular_role = await message.guild.roles.create({
            data: {
              name: team_name,
              color: 'AQUA',
            },
            reason: 'This is the role for the members of ' + team_name,
        })

        let mod_role = await message.guild.roles.create({
            data: {
              name: team_name + "-mod",
              color: 'LUMINOUS_VIVID_PINK',
            },
            reason: 'This is the role for the mods of ' + team_name,
        })

        let text_channel = await message.guild.channels.create(team_name, {
            type: 'text',
            permissionOverwrites: [
                {
                    id: regular_role.id,
                    allow: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'ATTACH_FILES', 'EMBED_LINKS'],
                },
                {
                    id: mod_role.id,
                    allow: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'ATTACH_FILES', 'EMBED_LINKS', 'MENTION_EVERYONE', 'MANAGE_MESSAGES', ],
                },
            ],
        });

        let voice_channel = await message.guild.channels.create(team_name, {
            type: 'voice',
            permissionOverwrites: [
                {
                    id: regular_role.id,
                    allow: ['CONNECT', 'SPEAK'],
                },
                {
                    id: mod_role.id,
                    allow: ['CONNECT', 'SPEAK', 'MUTE_MEMBERS', 'STREAM', 'PRIORITY_SPEAKER' ],
                },
            ],
        });

        message.member.roles.add(mod_role.id);
        text_channel.setParent('734080794783383635', { lockPermissions: false })
        voice_channel.setParent('734080915122290778', { lockPermissions: false })

        board = await Trello.board.create({name: team_name + " TODOS"})

        let id = mongoose.Types.ObjectId();
        let new_team = new teamModel({
            _id: id,
            team_name: team_name,
            creator: member_id,
            member_role: regular_role.id,
            mod_role: mod_role.id,
            text_channel: text_channel.id,
            voice_channel: voice_channel.id,
            board_id: board.id
        })

        await new_team.save();

        await userModel.findOneAndUpdate(
            {_id: member_id},
            {team_id: id},
            {
                new: true,
                runValidators: true,
                useFindAndModify: false
            }
        );


        if(!user_data[0].email){
            message.author.send("You were added to a team but do not have an email on the system. You need an email to access the trello board! Add your email after the !email prefix to set your email address.")
        }else{
            let addition = await fetch(`https://api.trello.com/1/boards/${board.id}/members?key=${trello_key}&token=${trello_token}&email=${user_data[0].email}&type=admin`, {
                method: 'PUT'
            })
              .catch(err => console.error(err));

            let data = await addition.json()

            let result = await userModel.findOneAndUpdate(
                {_id: member_id},
                {email: user_data[0].email, trello_id: data.members[data.members.length - 1].idMember},
                {
                    new: true,
                    runValidators: true,
                    useFindAndModify: false
                }
            );
        }

        return message.reply("Team created succesfully!")
        },
};