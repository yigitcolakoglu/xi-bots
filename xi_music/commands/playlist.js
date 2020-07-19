const { google } = require('googleapis');
const youtube = google.youtube('v3');
const secrets = require('./secrets.json');
const ytdl = require("ytdl-core");

module.exports = {
	name: 'playlist',
	description: 'Add playlist to the queue.',
	roles: ['732550362199752764', '732345527143759943'],
	async execute(message) {
        var message = message;
        const args = message.content.split(" ");
        try{
            let playlist_id = args[1].match(/https:\/\/www\.youtube\.com\/watch\?.*list=(.{34}).*/)[1]
            youtube.playlistItems.list({
                key: secrets.web.api_key,
                part: 'snippet, contentDetails',
                playlistId: playlist_id,
                maxResults: 50,
            }, async (err, results) => {
                try {
                    const queue = message.client.queue;
                    const serverQueue = message.client.queue.get(message.guild.id);
                
                    const voiceChannel = message.member.voice.channel;
                    if (!voiceChannel)
                    return message.channel.send(
                        "You need to be in a voice channel to play music!"
                    );
                    
                    const permissions = voiceChannel.permissionsFor(message.client.user);
                    if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
                    return message.channel.send(
                        "I need the permissions to join and speak in your voice channel!"
                    );
                    }

                    if (!serverQueue) {
                        const queueContruct = {
                        textChannel: message.channel,
                        voiceChannel: voiceChannel,
                        connection: null,
                        songs: [],
                        volume: 5,
                        playing: true
                        };
                
                        queue.set(message.guild.id, queueContruct);

                        results.data.items.forEach(function(item, index){
                            url = "https://www.youtube.com/watch?v=" + item.contentDetails.videoId 
                            let song = {
                            title: item.snippet.title,
                            url: url
                            };
                            queueContruct.songs.push(song);
                        });

                        try {
                            var connection = await voiceChannel.join();
                            queueContruct.connection = connection;
                            this.play(message, queueContruct.songs[0]);
                        } catch (err) {
                            console.log(err);
                            queue.delete(message.guild.id);
                            return message.channel.send(err);
                        }
                        return message.channel.send(
                            `Playing the first song from the playlist!`
                        );
                    } else {
                        results.data.items.forEach(function(item, index){
                            url = "https://www.youtube.com/watch?v=" + item.contentDetails.videoId 
                            let song = {
                            title: item.snippet.title,
                            url: url
                            };
                            serverQueue.songs.push(song);
                        });
                        return message.channel.send(
                        `Added songs from the playlist to the queue!`
                        );
                    }

                    } catch (error) {
                    console.log(error);
                    message.channel.send("Sorry, that did not work for some mysterious reason :(");
                }
            });
        } catch (error) {
            console.log(error);
            message.channel.send("Sorry, that did not work for some mysterious reason :(");
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
