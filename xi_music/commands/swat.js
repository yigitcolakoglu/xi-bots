const ytdl = require("ytdl-core");

module.exports = {
	name: 'swat',
	description: 'SWAT',
	roles: ['732345527143759943'],
	async execute(message){
        const queue = message.client.queue;
        const serverQueue = message.client.queue.get(message.guild.id);
        const voiceChannel = message.member.voice.channel;
        if (!voiceChannel)
          return message.channel.send(
            "You need to be in a voice channel to SWAT!"
          );
				if(serverQueue){
					while(serverQueue.songs[0]){
						serverQueue.songs.shift();
					}
					serverQueue.songs.push({});
					serverQueue.songs.push({title: "SWAT", url: "https://www.youtube.com/watch?v=kNynwelr8ps"});
					serverQueue.connection.dispatcher.end();
				}else{
					const queueContruct = {
						textChannel: message.channel,
						voiceChannel: voiceChannel,
						connection: null,
						songs: [],
						volume: 5,
						playing: true
					};

					queue.set(message.guild.id, queueContruct);

					queueContruct.songs.push({title: "SWAT", url: "https://www.youtube.com/watch?v=kNynwelr8ps"});


						try {
							var connection = await voiceChannel.join();
							queueContruct.connection = connection;
							this.play(message, queueContruct.songs[0]);
						} catch (err) {
							console.log(err);
							queue.delete(message.guild.id);
							return message.channel.send(err);
						}
					}
	},

	play(message, song) {
    const queue = message.client.queue;
    const guild = message.guild;
    const serverQueue = queue.get(message.guild.id);

    if (!song) {
      serverQueue.voiceChannel.leave();
      queue.delete(guild.id);
      return;
    }

    const dispatcher = serverQueue.connection
    .play(ytdl(song.url, { filter: 'audioonly', highWaterMark: 1024 * 1024 * 10 }))
    .on("finish", () => {
        serverQueue.songs.shift();
        this.play(message, serverQueue.songs[0]);
      })
      .on("error", error => console.error(error));
    dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
    serverQueue.textChannel.send(`Start playing: **${song.title}**`);
  },

};
