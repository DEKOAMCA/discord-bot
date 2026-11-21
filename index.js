
const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  PermissionsBitField
} = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
});

const TICKET_CHANNEL_ID = '1572968883793432611';
const TICKET_CATEGORY_ID = '1572968883793432608';
const TEAM_ROLE_ID = '1573762731713237042';

client.once('ready', async () => {
  console.log(`${client.user.tag} ist online!`);

  const channel = await client.channels.fetch(TICKET_CHANNEL_ID);

  if (!channel) return;

  const embed = new EmbedBuilder()
    .setColor('#9410d1')
    .setTitle('🎫 AVENIX SERVICE SUPPORT')
    .setDescription('Du brauchst Hilfe? Erstelle hier dein persönliches Support-Ticket!')
    .setFooter({ text: 'AVENIX Service' });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('create_ticket')
      .setLabel('Ticket erstellen')
      .setEmoji('🎫')
      .setStyle(ButtonStyle.Primary)
  );

  await channel.send({ embeds: [embed], components: [row] });
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isButton()) return;

  if (interaction.customId === 'create_ticket') {
    const guild = interaction.guild;
    const existing = guild.channels.cache.find(
      c => c.name === `ticket-${interaction.user.id}`
    );

    if (existing) {
      return interaction.reply({
        content: `Du hast bereits ein Ticket: ${existing}`,
        ephemeral: true
      });
    }

    const ticket = await guild.channels.create({
      name: `ticket-${interaction.user.username}`,
      type: ChannelType.GuildText,
      parent: TICKET_CATEGORY_ID,
      permissionOverwrites: [
        {
          id: guild.id,
          deny: [PermissionsBitField.Flags.ViewChannel]
        },
        {
          id: interaction.user.id,
          allow: [
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.SendMessages,
            PermissionsBitField.Flags.ReadMessageHistory
          ]
        },
        {
          id: TEAM_ROLE_ID,
          allow: [
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.SendMessages,
            PermissionsBitField.Flags.ReadMessageHistory
          ]
        }
      ]
    });

    const embed = new EmbedBuilder()
      .setColor('#9410d1')
      .setTitle('🎫 Dein Support-Ticket')
      .setDescription(`Hallo ${interaction.user}!\nUnser Team wird sich bald um dich kümmern.`);

    const closeRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('close_ticket')
        .setLabel('Ticket schließen')
        .setEmoji('🔒')
        .setStyle(ButtonStyle.Danger)
    );

    await ticket.send({
      content: `${interaction.user} <@&${TEAM_ROLE_ID}>`,
      embeds: [embed],
      components: [closeRow]
    });

    await interaction.reply({
      content: `Dein Ticket wurde erstellt: ${ticket}`,
      ephemeral: true
    });
  }

  if (interaction.customId === 'close_ticket') {
    if (!interaction.member.roles.cache.has(TEAM_ROLE_ID) &&
        interaction.user.id !== interaction.channel.topic) {
      return interaction.reply({
        content: 'Du darfst dieses Ticket nicht schließen.',
        ephemeral: true
      });
    }

    await interaction.reply('🔒 Dieses Ticket wird geschlossen.');
    setTimeout(() => interaction.channel.delete().catch(() => {}), 3000);
  }
});

client.login(process.env.DISCORD_TOKEN);
