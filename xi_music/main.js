const fs = require('fs')
const Discord = require('discord.js');
const Client = require('./client');

const {
	prefix,
    token,
} = require('./config.json');

const client = new Client();
client.commands = new Discord.Collection();

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	client.commands.set(command.name, command);
}

console.log(client.commands);

client.once('ready', () => {
	console.log('Ready!');
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
	const commandName = args.shift().toLowerCase();
	if (!client.commands.has(commandName)) return;
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

		if (!has_roles && permitted_roles.length != 0){
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
		command.execute(message);
	} catch (error) {
		console.error(error);
		message.reply('There was an error trying to execute that command!');
	}
});


client.login(token);
