const {
    mongo_url,
    trello_token, 
    trello_key
} = require('../config.json');

const {
    userModel,
} = require('./schemas.js');

let mongoose = require('mongoose');


module.exports = {
	name: 'upgrade',
	channels: ['734387503464710165'],
	description: 'Upgrade a user!',
    roles: ['732345527143759943'],
	async execute(message,args) {

		try {
            await mongoose.connect( mongo_url, {useNewUrlParser: true, useUnifiedTopology: true}, () => null );    
        }catch (error) { 
            console.log("ERROR WITH MONGODB CONNECTION");    
		}
		
		var roles_hierarchy = [
		'732558019409346603', // 'kiddie,
		'732618552661770241', // 'hunter',
		'732618853355356192', // 'hacker',
		'732618650158366770' // 'mentor'
		];

		const member = message.mentions.members.first();
		let data = await userModel.find({_id : member.id},"rank")
		let current_index = data[0].rank - 1

		if(current_index == roles_hierarchy.length - 1){
			return message.channel.send("This user is already at the highest level!")
		}

		member.roles.remove(roles_hierarchy[current_index])		
		member.roles.add(roles_hierarchy[current_index + 1]);

		userModel.findOneAndUpdate(
			{_id : member.id},
			{rank : current_index + 2},
			{
				new: true,
				runValidators: true,
				useFindAndModify: false
			}, function(err, result) {
				//if (err) {console.log(err); } else {console.log(result);}
			});
		return message.channel.send("User upgraded successfully!")

	},
};
