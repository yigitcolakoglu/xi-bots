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

module.exports = {
	name: 'email',
	channels: ['dm'],
	description: 'Update the email address of the user',
	async execute(message) {

        let email = message.content.split(" ")[1];

        if(!email){
            return message.reply("You must supply an email!")
        }

        if(!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)){
            return message.reply("You must supply an email address, not some other input!.");
        } 

        var member_id = message.author.id;

        try {
            await mongoose.connect( mongo_url, {useNewUrlParser: true, useUnifiedTopology: true}, () => null );    
        }catch (error) { 
            console.log("ERROR WITH MONGODB CONNECTION");    
        }

        const user_data = await userModel.find({_id: member_id}, "team_id email trello_id");

        if(user_data.length == 0){
            return message.reply("You should be a member of the ξ.network discord channel to run this command!")
        } 

        if(user_data[0].email && user_data[0].team_id !== 0){
            console.log("Deleting user")
            let team_data = await teamModel.find({_id: user_data[0].team_id}, "board_id");

            await fetch(`https://api.trello.com/1/boards/${team_data[0].board_id}/members/${user_data[0].trello_id}?key=${trello_key}&token=${trello_token}`, {
            method: 'DELETE'
            })            
            .catch(err => console.error(err));
        }

        if(user_data[0].team_id !== "0"){
            let team_data = await teamModel.find({_id: user_data[0].team_id}, "board_id creator");
            let type = "normal";
            if(team_data[0].creator == member_id){
                type = "admin"
            }
            let addition = await fetch(`https://api.trello.com/1/boards/${team_data[0].board_id}/members?key=${trello_key}&token=${trello_token}&email=${email}&type=${type}`, {
                method: 'PUT',
              })
              .catch(err => console.error(err));

            let data = await addition.json()

            let result = await userModel.findOneAndUpdate(
                {_id: member_id},
                {email: email, trello_id: data.memberships[data.memberships.length - 1].idMember},
                {
                    new: true,
                    runValidators: true,
                    useFindAndModify: false
                }
            );

        }else{
            userModel.findOneAndUpdate(
                {_id: member_id},
                {email: email},
                {
                    new: true,
                    runValidators: true,
                    useFindAndModify: false
                }
            );
        }

        message.reply("Email set successfully! You should receive an invite email from trello if you are a member of a team.")

	},
};