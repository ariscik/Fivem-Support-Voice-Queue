const { Client, GatewayIntentBits, Events } = require('discord.js');
const fs = require('fs');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMembers
    ]
});

const config = {
    token: '', // BURAYA BOTUNUZUN TOKENİNİ GİRİNİZ.
    voiceChannelId: '' // BURAYA DESTEK BEKLEME KANAL ID'SİNİ GİRİNİZ.
};

const userNamesFile = 'userNames.json';

function loadUserNames() {
    try {
        if (fs.existsSync(userNamesFile)) {
            return JSON.parse(fs.readFileSync(userNamesFile, 'utf8'));
        }
        return {};
    } catch (error) {
        console.error('JSON dosyası okunurken hata:', error);
        return {};
    }
}

function saveUserNames(userNames) {
    try {
        fs.writeFileSync(userNamesFile, JSON.stringify(userNames, null, 2));
    } catch (error) {
        console.error('JSON dosyası yazılırken hata:', error);
    }
}

async function updateVoiceChannelUsers(channel) {
    if (!channel) return;

    const members = Array.from(channel.members.values());
    const userNames = loadUserNames();

    for (let i = 0; i < members.length; i++) {
        const member = members[i];
        const oldName = member.displayName;
        
        if (!userNames[member.id]) {
            userNames[member.id] = oldName;
            saveUserNames(userNames);
        }

        try {
            await member.setNickname(`Sıra ${i + 1}`);
        } catch (error) {
            console.log(`${member.user.tag} ismi değiştirilirken hata:`, error);
        }
    }

    for (const [userId, oldName] of Object.entries(userNames)) {
        const member = channel.guild.members.cache.get(userId);
        if (member && !channel.members.has(userId)) {
            try {
                await member.setNickname(oldName);
                delete userNames[userId];
                saveUserNames(userNames);
            } catch (error) {
                console.log(`${member.user.tag} ismi eski haline getirilirken hata:`, error);
            }
        }
    }
}

client.on(Events.VoiceStateUpdate, (oldState, newState) => {
    const channel = oldState.channel || newState.channel;
    if (channel && channel.id === config.voiceChannelId) {
        updateVoiceChannelUsers(channel);
    }
});

client.login(config.token).then(e => { 
    console.log("Bot giriş yaptı.")
}).catch(err => {
    console.log("HATA OLUŞTU!" + err)
}) 