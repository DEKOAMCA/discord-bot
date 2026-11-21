
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
  intents: [GatewayIntentBits.Guilds]
});

// AVENIX KONFIGURATION
const TICKET_CHANNEL_ID = '1572968883793432611';
const TICKET_CATEGORY_ID = '1572968883793432608';
const TEAM_ROLE_ID = '1573762731713237042';

const COLOR = '#9410d1';

client.once('ready', async () => {
  console.log(`${client.user.tag} ist online!`);

  try {
    const channel = await client.channels.fetch(TICKET_CHANNEL_ID);

    if (!channel || !channel.isTextBased()) {
      console.log('Ticket-Erstellungs-Channel nicht gefunden!');
      return;
    }

    const messages = await channel.messages.fetch({ limit: 50 });

    const existingMenu = messages.find(message =>
      message.author.id === client.user.id &&
      message.embeds.some(embed =>
        embed.title === '🎫 AVENIX SERVICE SUPPORT'
      )
    );

    if (existingMenu) {
      console.log('Ticket-Menü existiert bereits.');
      return;
    }

    const embed = new EmbedBuilder()
      .setColor(COLOR)
      .setTitle('🎫 AVENIX SERVICE SUPPORT')
      .setDescription(
        'Willkommen bei AVENIX Service!\n\n' +
        'Du benötigst Hilfe oder hast eine Frage?\n' +
        'Klicke auf den Button unten, um ein privates Ticket zu eröffnen.'
      )
      .setFooter({ text: 'AVENIX Service | Support-System' });

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

    console.log('Ticket-Menü wurde erstellt.');

  } catch (error) {
    console.error('Menü-Fehler:', error);
  }
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isButton()) return;

  // TICKET ERSTELLEN
  if (interaction.customId === 'create_ticket') {
    await interaction.deferReply({ ephemeral: true });

    try {
      const guild = interaction.guild;

      const existing = guild.channels.cache.find(channel =>
        channel.parentId === TICKET_CATEGORY_ID &&
        channel.topic === `ticket-owner:${interaction.user.id}`
      );

      if (existing) {
        return interaction.editReply({
          content: `Du hast bereits ein Ticket: ${existing}`
        });
      }

      const ticket = await guild.channels.create({
        name: `ticket-${interaction.user.id}`,
        type: ChannelType.GuildText,
        parent: TICKET_CATEGORY_ID,
        topic: `ticket-owner:${interaction.user.id}`,

        permissionOverwrites: [
          {
            id: guild.id,
            deny: [
              PermissionsBitField.Flags.ViewChannel
            ]
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
          },
          {
            id: client.user.id,
            allow: [
              PermissionsBitField.Flags.ViewChannel,
              PermissionsBitField.Flags.SendMessages,
              PermissionsBitField.Flags.ReadMessageHistory,
              PermissionsBitField.Flags.EmbedLinks
            ]
          }
        ]
      });

      const embed = new EmbedBuilder()
        .setColor(COLOR)
        .setTitle('🎫 AVENIX SUPPORT')
        .setDescription(
          `Hallo ${interaction.user}!\n\n` +
          'Dein Ticket wurde erfolgreich erstellt.\n' +
          'Unser Team wird sich so schnell wie möglich bei dir melden.'
        )
        .setFooter({ text: 'AVENIX Service' })
        .setTimestamp();

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('close_ticket')
          .setLabel('Ticket schließen')
          .setEmoji('🔒')
          .setStyle(ButtonStyle.Danger)
      );

      await ticket.send({
        content: `${interaction.user} <@&${TEAM_ROLE_ID}>`,
        embeds: [embed],
        components: [row]
      });

      await interaction.editReply({
        content: `Dein Ticket wurde erstellt: ${ticket}`
      });

      console.log(`Ticket erstellt: ${ticket.name}`);

    } catch (error) {
      console.error('Ticket-Fehler:', error);

      await interaction.editReply({
        content: 'Das Ticket konnte nicht vollständig erstellt werden. Bitte informiere das Team.'
      }).catch(() => {});
    }
  }

  // TICKET SCHLIESSEN
  if (interaction.customId === 'close_ticket') {
    const channel = interaction.channel;

    const ownerId = channel.topic?.replace('ticket-owner:', '');

    const isOwner = interaction.user.id === ownerId;
    const isTeam = interaction.member.roles.cache.has(TEAM_ROLE_ID);

    if (!isOwner && !isTeam) {
      return interaction.reply({
        content: 'Du darfst dieses Ticket nicht schließen.',
        ephemeral: true
      });
    }

    await interaction.reply({
      content: '🔒 Dieses Ticket wird in 3 Sekunden geschlossen.'
    });

    setTimeout(() => {
      channel.delete().catch(error => {
        console.error('Ticket konnte nicht gelöscht werden:', error);
      });
    }, 3000);
  }
});

client.login(process.env.DISCORD_TOKEN);
