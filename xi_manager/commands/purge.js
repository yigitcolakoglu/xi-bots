module.exports = {
    name: 'purge',
    roles: ['732345527143759943'],
	description: 'Purge the last few messages specified by the user!',
	async execute(message,args) {
        let fetched;
        let amount = Number(message.content.split(" ")[1]);
        if(!amount){
            return message.channel.send("You must specify an amount to purge");
        }
        let deleted = 0;
        let channel = message.channel;
        let message_manager = channel.messages;
        do {
            let limit = 100;
            if(amount - deleted < limit){
                limit = amount - deleted;
            }
            fetched = await message_manager.fetch({ limit: limit });
            channel.bulkDelete(fetched);
            deleted += fetched.size

        }
        while(fetched.size >= 3 && deleted < amount);

        let m = await message.channel.send("Done purging!")
    }
}