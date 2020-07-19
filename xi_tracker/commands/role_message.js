module.exports = {
    name: 'role_message',
	channels: ['734387503464710165'],
    description: 'Send the role message!',
	roles: ['732345527143759943'],
	async execute(message) {
        let message_new = await message.client.channels.cache.get("734387503464710165").send(`React to this message to give yourself a role.
        
        :iphone: : mobile development
        
        :nut_and_bolt: : hardware development
        
        :factory: : backend development

        :eyeglasses: : frontend development

        :spider:(spider) : web development

        :globe_with_meridians: : network engineering

        :penguin: : unix/linux
        
        :spider_web: : web security

        :closed_lock_with_key: : cryptology
        
        :upside_down: : reverse engineering

        :police_officer: : network security
        `)
        Promise.all([
            message_new.react('🔐'),
            message_new.react('🙃'),
            message_new.react('📱'),
            message_new.react('🔩'),
            message_new.react('🕸️'),
            message_new.react('🏭'),
            message_new.react('🕷️'),
            message_new.react('🌐'),
            message_new.react('👮'),
            message_new.react('🐧')
        ])
        .catch(() => console.error('One of the emojis failed to react.'));
    }
}