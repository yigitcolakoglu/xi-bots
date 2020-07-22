const fs = require('fs')
let rssParser = require('rss-parser');
const Discord = require('discord.js');
const Client = require('./client');
const fetch = require("node-fetch");
let feeds = {
	"REDDIT": ['https://www.reddit.com/.rss', 'https://i.redd.it/rq36kl1xjxr01.png', "https://reddit.com"],
	"WIRED": ['https://www.wired.com/feed/rss', "https://www.wired.com/wp-content/themes/Phoenix/assets/images/article-icon.jpg", "https://www.wired.com"]
};
const threshold = 3;
var CronJob = require('cron').CronJob;
const {
	prefix,
	token,
} = require('./config.json');
var channels = '734387503464710165';
async function execute() {
	let channel = "734687050707632239";
	let parser = new rssParser();
	let news = []
	for (item in feeds) {
		let feed = await parser.parseURL(feeds[item][0]);
		for (var i = feed.items.length - 1; i > feed.items.length - 1 - threshold; i--) {
			let data = feed.items[i];
			news.push({
				title: data.title,
				url: data.link,
				author: item,
				author_img: feeds[item][1],
				author_url: feeds[item][2],
				content: data.contentSnippet
			});
		}
	};
	news.forEach((item) => {
		let newsEmbed = new Discord.MessageEmbed()
			.setColor('#0099ff')
			.setTitle(item.title)
			.setURL(item.url)
			.setAuthor(item.author, item.author_img, item.author_url)
			.setDescription(item.content)
			.setTimestamp();
		client.channels.cache.get(`734687050707632239`).send(newsEmbed);
	});
};
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
	console.log('Before job instantiation');
	const job = new CronJob('00 21 13 * * *', function () {
		client.channels.cache.get(`734387503464710165`).send(`rss time`);
		execute();

		const d = new Date();
		console.log('onTick:', d);
	});
	console.log('After job instantiation');
	job.start();
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

	if (permitted_roles) {
		for (i = 0; i < permitted_roles.length; i++) {
			if (message.member.roles.cache.has(permitted_roles[i])) {
				has_roles = true
			}
		}

		if (!has_roles && permitted_roles.length != 0) {
			message.reply('You are not allowed to run this command!');
			return;
		}
	}

	if (permitted_channels) {
		msg_channel = message.channel;
		channel_allowed = false
		for (i = 0; i < permitted_channels.length; i++) {
			if (permitted_channels[i] == "dm" && msg_channel instanceof Discord.DMChannel) {
				channel_allowed = true;
				break;
			} else if (permitted_channels[i] == msg_channel.id) {
				channel_allowed = true;
				break;
			}
		}

		if (!channel_allowed) {
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
