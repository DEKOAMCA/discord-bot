
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
});

client.once('ready', () => {
  console.log(`${client.user.tag} ist online!`);
});

client.on('guildMemberAdd', async member => {
  const channel = member.guild.systemChannel;
  if (!channel) return;

  const embed = new EmbedBuilder()
    .setColor('#9410d1')
    .setTitle('Willkommen bei AVENIX Service!')
    .setDescription(`Hey ${member}, willkommen auf unserem Server!`)
    .setThumbnail(member.user.displayAvatarURL())
    .setTimestamp();

  channel.send({ embeds: [embed] });
});

console.log("Token vorhanden:", !!process.env.DISCORD_TOKEN);
client.login(process.env.DISCORD_TOKEN);

