
const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  ChannelType,
  PermissionsBitField
} = require('discord.js');

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const TICKET_CHANNEL_ID = '1572968883793432611';
const TICKET_CATEGORY_ID = '1572968883793432608';
const TEAM_ROLE_ID = '1573762731713237042';

const COLOR = '#9410d1';

const categories = {
  partner: {
    label: 'Partner-Ticket',
    emoji: '🤝',
    description: 'Partnerschaften und Kooperationen',
    message: 'Hier kannst du eine Partnerschaft mit AVENIX Service anfragen.'
  },
  support: {
    label: 'Support-Ticket',
    emoji: '🎧',
    description: 'Hilfe und technische Probleme',
    message: 'Beschreibe bitte dein Anliegen. Unser Support hilft dir weiter.'
  },
  bestellung: {
    label: 'Bestellungs-Ticket',
    emoji: '🛒',
    description: 'Fragen zu Bestellungen und Aufträgen',
    message: 'Hier kannst du Fragen zu deiner Bestellung stellen.'
  },
  team: {
    label: 'Team-Ticket',
    emoji: '👥',
    description: 'Bewerbungen und Team-Angelegenheiten',
    message: 'Hier kannst du dich bewerben oder Team-Angelegenheiten klären.'
  },
  sonstiges: {
    label: 'Sonstiges',
    emoji: '💬',
    description: 'Andere Anliegen',
    message: 'Beschreibe bitte dein sonstiges Anliegen.'
  }
};

client.once('ready', async () => {
  console.log(`${client.user.tag} ist online!`);

  try {
    const channel = await client.channels.fetch(TICKET_CHANNEL_ID);

    if (!channel || !channel.isTextBased()) {
      console.log('Ticket-Channel nicht gefunden!');
      return;
    }

    const messages = await channel.messages.fetch({ limit: 50 });

    const oldMenu = messages.find(message =>
      message.author.id === client.user.id &&
      message.embeds.some(embed =>
        embed.title === '🎫 AVENIX SERVICE SUPPORT' ||
        embed.title === '🎫 AVENIX SERVICE – TICKET AUSWAHL'
      )
    );

    const embed = new EmbedBuilder()
      .setColor(COLOR)
      .setTitle('🎫 AVENIX SERVICE – TICKET AUSWAHL')
.setDescription(
  'Willkommen bei AVENIX Service!\n\n' +
  'Bitte wähle den passenden Ticket-Bereich:\n\n' +
  '🤝 **Partner-Ticket**\n' +
  'Partnerschaften und Kooperationen\n\n' +
  '🎧 **Support-Ticket**\n' +
  'Hilfe und technische Probleme\n\n' +
  '🛒 **Bestellungs-Ticket**\n' +
  'Fragen zu Bestellungen und Aufträgen\n\n' +
  '👥 **Team-Ticket**\n' +
  'Bewerbungen und Team-Angelegenheiten\n\n' +
  '💬 **Sonstiges**\n' +
  'Andere Anliegen\n\n' +
  '👇 Wähle unten deine Kategorie aus.'
)
      .setFooter({ text: 'AVENIX Service | Ticket-System' });

    const menu = new StringSelectMenuBuilder()
      .setCustomId('ticket_category')
      .setPlaceholder('Wähle deine Ticket-Kategorie')
      .addOptions(
        Object.entries(categories).map(([value, category]) => ({
          label: category.label,
          description: category.description,
          value,
          emoji: category.emoji
        }))
      );

    const row = new ActionRowBuilder().addComponents(menu);

    if (oldMenu) {
      await oldMenu.edit({
        embeds: [embed],
        components: [row]
      });
      console.log('Ticket-Menü aktualisiert.');
    } else {
      await channel.send({
        embeds: [embed],
        components: [row]
      });
      console.log('Ticket-Menü erstellt.');
    }

  } catch (error) {
    console.error('Menü-Fehler:', error);
  }
});

client.on('interactionCreate', async interaction => {

  // KATEGORIE AUSWÄHLEN
  if (interaction.isStringSelectMenu() &&
      interaction.customId === 'ticket_category') {

    await interaction.deferReply({ ephemeral: true });

    try {
      const guild = interaction.guild;
      const selected = interaction.values[0];
      const category = categories[selected];

      if (!category) {
        return interaction.editReply('Ungültige Ticket-Kategorie.');
      }

      const allChannels = await guild.channels.fetch();

      const existing = allChannels.find(channel =>
        channel &&
        channel.parentId === TICKET_CATEGORY_ID &&
        channel.topic === `ticket-owner:${interaction.user.id}`
      );

      if (existing) {
        return interaction.editReply(
          `Du hast bereits ein offenes Ticket: ${existing}`
        );
      }

      const username = interaction.user.username
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '')
        .slice(0, 20) || 'user';

      const ticket = await guild.channels.create({
        name: `${selected}-${username}`,
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
        .setTitle(`${category.emoji} ${category.label}`)
        .setDescription(
          `Hallo ${interaction.user}!\n\n` +
          `${category.message}\n\n` +
          'Unser Team wird sich so schnell wie möglich melden.'
        )
        .setFooter({ text: 'AVENIX Service Support' })
        .setTimestamp();

      const closeButton = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('close_ticket')
          .setLabel('Ticket schließen')
          .setEmoji('🔒')
          .setStyle(ButtonStyle.Danger)
      );

      await ticket.send({
        content: `${interaction.user} <@&${TEAM_ROLE_ID}>`,
        embeds: [embed],
        components: [closeButton]
      });

      await interaction.editReply({
        content: `Dein ${category.label} wurde erstellt: ${ticket}`
      });

      console.log(`${category.label} erstellt: ${ticket.name}`);

    } catch (error) {
      console.error('Ticket-Fehler:', error);

      await interaction.editReply({
        content: 'Beim Erstellen des Tickets ist ein Fehler aufgetreten.'
      }).catch(() => {});
    }
  }

  // TICKET SCHLIESSEN
  if (interaction.isButton() &&
      interaction.customId === 'close_ticket') {

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
      channel.delete().catch(console.error);
    }, 3000);
  }
});

client.login(process.env.DISCORD_TOKEN);
