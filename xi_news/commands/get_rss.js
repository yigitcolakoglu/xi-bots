
const $ = require('jquery');
const request = require('request');

let Parser = require('rss-parser');
let parser = new Parser();


module.exports = {
    name: 'get_rss',
	description: 'Get rss feed',
	async execute(message) {

        let feed = await parser.parseURL('https://www.reddit.com/.rss');
        console.log(feed.title);
       
        feed.items[0](item => {
            message.channel.send(
                (item.title + ':' + item.link)
              );

        });










    }

        
};
