
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

  try {
    const channel = await client.channels.fetch(TICKET_CHANNEL_ID);
    if (!channel) return;

    const messages = await channel.messages.fetch({ limit: 50 });

    const alreadyExists = messages.some(message =>
      message.author.id === client.user.id &&
      message.embeds.some(embed =>
        embed.title === '🎫 AVENIX SERVICE SUPPORT'
      )
    );

    if (alreadyExists) return;

    const embed = new EmbedBuilder()
      .setColor('#9410d1')
      .setTitle('🎫 AVENIX SERVICE SUPPORT')
      .setDescription(
        'Du brauchst Hilfe? Erstelle hier dein persönliches Support-Ticket!'
      )
      .setFooter({ text: 'AVENIX Service' });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('create_ticket')
        .setLabel('Ticket erstellen')
        .setEmoji('🎫')
        .setStyle(ButtonStyle.Primary)
    );

    await channel.send({
      embeds: [embed],
      components: [row]
    });

  } catch (error) {
    console.error('Fehler beim Ticket-Menü:', error);
  }
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isButton()) return;

  if (interaction.customId === 'create_ticket') {
    await interaction.deferReply({ ephemeral: true });

    try {
      const guild = interaction.guild;

      const existing = guild.channels.cache.find(
        channel =>
          channel.type === ChannelType.GuildText &&
          channel.topic === `ticket-owner:${interaction.user.id}`
      );

      if (existing) {
        return interaction.editReply({
          content: `Du hast bereits ein Ticket: ${existing}`
        });
      }

      const ticket = await guild.channels.create({
        name: `ticket-${interaction.user.username}`
          .toLowerCase()
          .replace(/[^a-z0-9-]/g, ''),
        type: ChannelType.GuildText,
        parent: TICKET_CATEGORY_ID,
        topic: `ticket-owner:${interaction.user.id}`,
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
        .setDescription(
          `Hallo ${interaction.user}!\nUnser Team wird sich bald um dich kümmern.`
        )
        .setFooter({ text: 'AVENIX Service' });

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

      await interaction.editReply({
        content: `Dein Ticket wurde erstellt: ${ticket}`
      });

    } catch (error) {
      console.error('Ticket-Fehler:', error);
      await interaction.editReply({
        content: 'Beim Erstellen des Tickets ist ein Fehler aufgetreten.'
      });
    }
  }

  if (interaction.customId === 'close_ticket') {
    const ownerId = interaction.channel.topic?.replace('ticket-owner:', '');
    const isTeam = interaction.member.roles.cache.has(TEAM_ROLE_ID);
    const isOwner = interaction.user.id === ownerId;

    if (!isTeam && !isOwner) {
      return interaction.reply({
        content: 'Du darfst dieses Ticket nicht schließen.',
        ephemeral: true
      });
    }

    await interaction.reply('🔒 Dieses Ticket wird geschlossen.');

    setTimeout(() => {
      interaction.channel.delete().catch(console.error);
    }, 3000);
  }
});

client.login(process.env.DISCORD_TOKEN);

