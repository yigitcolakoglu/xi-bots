const xkcd = require('xkcd-api');

module.exports = {
	name: 'comic',
	description: 'Send a random xkcd comic.',
	execute(message) {
        var message = message;
        xkcd.random(function(error, response) {
            if (error) {
              console.error(error);
            } else {
                message.channel.send(`**${response.safe_title}**\n*${response.alt}*`, {files: [response.img]})
            }
          });
	},
};