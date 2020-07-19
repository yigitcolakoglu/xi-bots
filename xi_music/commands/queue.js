module.exports = {
	name: 'queue',
	description: 'Display the queue for the next items',
	execute(message) {
		const serverQueue = message.client.queue.get(message.guild.id);
        if (!serverQueue) return message.channel.send('There is nothing in queue.');
        message_txt = `There are ${serverQueue.songs.length} items on the list\n`
        message_txt += "```\n";
        c = 0
        serverQueue.songs.forEach(function (item, index){
            if(c == 10){
                return;
            } 
            c += 1;
            message_txt += `${index}: ${item.title}\n`
        })
        message_txt += "\n```";
        return message.channel.send(message_txt);
	},
};