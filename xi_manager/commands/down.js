
module.exports = {
	name: 'downgrade',
	channels: ['734387503464710165'],
	description: 'Downgrade a user!',
    roles: ['732345527143759943'],
	execute(message,args) {
		var roles_hierarchy = [
		'732558019409346603', // 'kiddie,
		'732618552661770241', // 'hunter',
		'732618853355356192', // 'hacker',
		'732618650158366770' // 'mentor'
		];
		var current_index = null
		const member = message.mentions.members.first();
		roles_hierarchy.forEach(function(item, index){
			if (member._roles[0] == item) current_index = index;
		});
		if(current_index == 0){
			return message.channel.send("This user is already at the lowest level!")
		}
		console.log(current_index);
		member.roles.remove(roles_hierarchy[current_index]);
		member.roles.add(roles_hierarchy[current_index - 1]);
		return message.channel.send("User downgraded successfully!")
	},
};
