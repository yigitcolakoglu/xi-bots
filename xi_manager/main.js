const fs = require('fs')
const Discord = require('discord.js');
const Client = require('./client');
let mongoose = require('mongoose');

const {
    prefix,
    token,
    mongo_url,
    role_message_id
} = require('./config.json');

const {
    userModel,
    teamModel,
} = require('./commands/schemas.js');

const client = new Client({ partials: ['MESSAGE', 'CHANNEL', 'REACTION'] });
client.commands = new Discord.Collection();

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    let prefix = ""
    if(!command.name) continue;
    if(command.family){
        prefix = command.family + "_"
    }
    client.commands.set(prefix + command.name, command);
}

console.log(client.commands);

client.once('ready', async () => {
    console.log('Ready!');

    async function delete_messages(){
        let fetched;
    
        channel = client.channels.cache.get("734387503464710165")
        message_manager = channel.messages
    
        do {
          fetched = await message_manager.fetch({ limit: 100 });
          fetched.delete(role_message_id)
          channel.bulkDelete(fetched);
        }
        while(fetched.size >= 3);
    }
    
    await delete_messages();


    var minutes = 1, interval = minutes * 60 * 1000;
    setInterval(delete_messages, interval);

});

client.once('reconnecting', () => {
    console.log('Reconnecting!');
});

client.once('disconnect', () => {
    console.log('Disconnect!');
});

client.on('message', async message => {
    if (message.author.bot) return;
    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).split(/ +/);
    const c1 = args.shift().toLowerCase();
    let c2 = args.shift();
    if(c2){
        c2 = c2.toLowerCase()
    }
    var commandName = null;

    if (client.commands.has(c1)){
        commandName = c1;
    }else if(client.commands.has(c1 + "_" + c2)){
        commandName = c1 + "_" + c2;
    }else{
        return;
    }

    const command = client.commands.get(commandName);
    const permitted_roles = client.commands.get(commandName)["roles"];
    const permitted_channels = client.commands.get(commandName)["channels"]

    has_roles = false

    if (permitted_roles){
        for(i = 0; i < permitted_roles.length; i++){
            if(message.member.roles.cache.has(permitted_roles[i])){
                has_roles = true
            }
        }

        if (!has_roles){
            message.reply('You are not allowed to run this command!');
            return;
        }
    }

    if(permitted_channels){
        msg_channel = message.channel;
        channel_allowed = false
        for(i = 0; i < permitted_channels.length; i++){
            if(permitted_channels[i] == "dm" && msg_channel instanceof Discord.DMChannel){
                channel_allowed = true;
                break;
            }else if(permitted_channels[i] == msg_channel.id){
                channel_allowed = true;
                break;
            }
        }

        if(!channel_allowed){
            return;
        }
    }

    try {
        command.execute(message,args);
    } catch (error) {
        console.error(error);
        message.reply('There was an error trying to execute that command!');
    }
});

client.on('guildMemberAdd', member => {
    let new_user = new userModel({
        _id: member.id,
        joined_at: Date.now(),
        team_id: "0",
        profession: "",
        rank: 1,
        xp: 0,
        email: "",
        trello_id: ""
     })
    member.guild.channels.cache.get('734387938418360362').send("Welcome <@"+ member.id +">. Xi up!"); 
    member.roles.add('732558019409346603');
    try {
       mongoose.connect( mongo_url, {useNewUrlParser: true, useUnifiedTopology: true}, () => null );
			 let db = mongoose.connection;
			 db.once("open", function callback () {
					new_user.save();
			 });
    }catch (error) { 
        console.log("ERROR WITH MONGODB CONNECTION");    
    }
});

const reaction_to_prof = {
    "🔐" : ["734453192921710604" ,"Cryptology"],
    "🙃" : ["734453691318403072" ,"Reverse Engineer"],
    "📱" : ["734453796306026576" ,"Mobile Developer"],
    "🔩" : ["734453830669959218" ,"Hardware Developer"],
    "🕸️" : ["734453917345120316" ,"Web security Expert"],
    "🏭" : ["734453944700502186" ,"Backend Developer"],
    "🕷️" : ["734454002082775040" ,"Web developer"],
    "🌐" : ["734454060417024072" ,"Network Engineer"],
    "👮" : ["734454093833175151" ,"Network Security "],
    "🐧" : ["734454127551053924" ,"Linux Guru"]
};

const limits = {
    1 : 1,
    2 : 4,
    3 : 6,
    4 : 0,
    5 : 0
}

client.on('messageReactionAdd', async (reaction, user) => {
    if(reaction.message.id === role_message_id){

        if (reaction.partial) {
            try {
                await reaction.fetch();
            } catch (error) {
                console.log('Something went wrong when fetching the message: ', error);
                return;
            }
        }

        let emoji = reaction.emoji.name;
        let member = await reaction.message.guild.members.fetch(user.id);

        try {
            mongoose.connect( mongo_url, {useNewUrlParser: true, useUnifiedTopology: true}, () => null );
            let db = mongoose.connection;

            db.once("open", async function callback () {

                let user_data = await userModel.find({_id: user.id}, "profession rank")
                let profession = user_data[0].profession
                let rank = user_data[0].rank
        
                if(limits[rank] < profession.length + 1 && limits[rank] !== 0){
                    user.send(`You cannot have more than ${limits[rank]} professions at this rank!`)
                    return;
                }
            
                profession.push(reaction_to_prof[emoji][1]);
        
                member.roles.add( reaction_to_prof[emoji][0]);

                userModel.findOneAndUpdate(
                {_id: user.id},
                {profession: profession},
                {
                    new: true,
                    runValidators: true,
                    useFindAndModify: false
                }, function(err, result) {
                    //if (err) {console.log(err); } else {console.log(result);}
                });
                user.send(`You now have the profession ${reaction_to_prof[emoji][1]}!`)
            });
        }catch (error) { 
            console.log(error)
            console.log("ERROR WITH MONGODB CONNECTION");    
        }

    }
});

client.on('messageReactionRemove', async (reaction, user) => {
    if(reaction.message.id === role_message_id){
        if (reaction.partial) {
            try {
                await reaction.fetch();
            } catch (error) {
                console.log('Something went wrong when fetching the message: ', error);
                return;
            }
        }

        let emoji = reaction.emoji.name;
        let member = await reaction.message.guild.members.fetch(user.id);

        try {
            mongoose.connect( mongo_url, {useNewUrlParser: true, useUnifiedTopology: true}, () => null );
            let db = mongoose.connection;

            db.once("open", async function callback () {

                let user_data = await userModel.find({_id: user.id}, "profession rank")
                let profession = user_data[0].profession
                let rank = user_data[0].rank
        
                if(profession_index != -1){
                    profession.splice(profession_index, 1)
                }

                member.roles.remove(reaction_to_prof[emoji][0]);

                userModel.findOneAndUpdate(
                {_id: user.id},
                {profession: profession},
                {
                    new: true,
                    runValidators: true,
                    useFindAndModify: false
                }, function(err, result) {
                    // if (err) {console.log(err); } else {console.log(result);}
                });
            });
            user.send(`You now don't have the profession ${reaction_to_prof[emoji][1]}!`)
        }catch (error) { 
            console.log(error)
            console.log("ERROR WITH MONGODB CONNECTION");    
        }
    }
});

// login to Discord with your app's token
client.login(token);
