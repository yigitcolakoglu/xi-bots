module.exports = {
	name: 'skip',
	description: 'Skip a song!',
	roles: ['732550362199752764', '732345527143759943'],
	execute(message) {
		const serverQueue = message.client.queue.get(message.guild.id);
		if (!message.member.voice.channel) return message.channel.send('You have to be in a voice channel to stop the music!');
		if (!serverQueue) return message.channel.send('There is no song that I could skip!');
		serverQueue.connection.dispatcher.end();
	},
};