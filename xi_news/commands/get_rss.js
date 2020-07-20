
let rssParser = require('rss-parser');
const Discord = require("discord.js")

let feeds = {
    "REDDIT" : ['https://www.reddit.com/.rss', 'https://i.redd.it/rq36kl1xjxr01.png', "https://reddit.com" ],
    "WIRED" : ['https://www.wired.com/feed/rss', "https://www.wired.com/wp-content/themes/Phoenix/assets/images/article-icon.jpg", "https://www.wired.com"]
};

const threshold = 3;

module.exports = {
    name: 'news',
    description: 'Get rss feed',
    channels: ['734387503464710165'],
	async execute(message) {
        let channel = message.guild.channels.cache.get("734687050707632239");

        let parser = new rssParser();
        let news = []
        for(item in feeds){
            let feed = await parser.parseURL(feeds[item][0]);
            for(var i = feed.items.length - 1; i > feed.items.length - 1 - threshold; i --){
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
            channel.send(newsEmbed)
        });
        
    }

        
};
