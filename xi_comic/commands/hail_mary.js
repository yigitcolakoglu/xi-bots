const xkcd = require('xkcd-api');

module.exports = {
	name: 'hail_mary',
    description: 'Fuck everyone\'s chat up by sneding a random number of comics between 0-3.',
    roles: ['732345527143759943'],
	execute(message) {
        var message = message;
        message.channel.send("Initiating comic hail mary!")
        for(i = 0;  i < Math.floor(Math.random() * (30 - 0) + 0); i++){
            xkcd.random(function(error, response) {
                if (error) {
                console.error(error);
                } else {
                    message.channel.send(`**${response.safe_title}**\n*${response.alt}*`, {files: [response.img]})
                }
            });
        }
        
	},
};
