
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
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
});

// ================================
// AVENIX SERVICE KONFIGURATION
// ================================

const COLOR = '#9410d1';

const CONFIG = {
  ticketPanelChannel: '1572968883793432611',
  teamRole: '1573762731713237042',
  ticketLogChannel: '1573851855979544586',
  welcomeChannel: '1572968883281993869'
};

const categories = {
  partner: {
    label: 'Partner Ticket',
    emoji: '🤝',
    description: 'Partnerschaft anfragen',
    categoryId: '1572968884120592432',
    message: 'Beschreibe bitte deine Partnerschaftsanfrage.'
  },
  support: {
    label: 'Support Ticket',
    emoji: '🛠️',
    description: 'Du benötigst Hilfe?',
    categoryId: '1572968884120592433',
    message: 'Beschreibe bitte dein Anliegen.'
  },
  order: {
    label: 'Bestellung',
    emoji: '🛒',
    description: 'Eine Bestellung aufgeben',
    categoryId: '1572968884250746951',
    message: 'Beschreibe bitte deine gewünschte Bestellung.'
  },
  team: {
    label: 'Team Ticket',
    emoji: '👥',
    description: 'Kontakt mit dem Team',
    categoryId: '1572968884389154847',
    message: 'Beschreibe bitte dein Anliegen an das Team.'
  },
  other: {
    label: 'Sonstiges',
    emoji: '📩',
    description: 'Sonstige Anfragen',
    categoryId: '1572968884250746955',
    message: 'Beschreibe bitte dein Anliegen.'
  }
};

// ================================
// BOT START
// ================================

client.once('ready', async () => {
  console.log(`AVENIX SYSTEM online als ${client.user.tag}`);

  for (const guild of client.guilds.cache.values()) {
    const channel = await guild.channels
      .fetch(CONFIG.ticketPanelChannel)
      .catch(() => null);

    if (!channel || !channel.isTextBased()) continue;

    const panelEmbed = new EmbedBuilder()
      .setColor(COLOR)
      .setTitle('💜 AVENIX SERVICE | TICKETS')
      .setDescription(
        'Willkommen beim AVENIX Service!\n\n' +
        'Wähle unten die passende Kategorie aus, um ein Ticket zu erstellen.\n\n' +
        '🤝 **Partner Ticket**\n' +
        '🛠️ **Support Ticket**\n' +
        '🛒 **Bestellung**\n' +
        '👥 **Team Ticket**\n' +
        '📩 **Sonstiges**\n\n' +
        'Unser Team wird sich schnellstmöglich um dich kümmern.'
      )
      .setFooter({ text: 'AVENIX Service • Ticket-System' })
      .setTimestamp();

    const menu = new StringSelectMenuBuilder()
      .setCustomId('avenix_ticket_select')
      .setPlaceholder('Wähle eine Ticket-Kategorie aus')
      .addOptions(
        Object.entries(categories).map(([key, value]) => ({
          label: value.label,
          description: value.description,
          emoji: value.emoji,
          value: key
        }))
      );

    const row = new ActionRowBuilder().addComponents(menu);

    const messages = await channel.messages.fetch({ limit: 50 });
    const oldPanel = messages.find(message =>
      message.author.id === client.user.id &&
      message.embeds.some(embed =>
        embed.title === '💜 AVENIX SERVICE | TICKETS'
      )
    );

    if (oldPanel) {
      await oldPanel.edit({
        embeds: [panelEmbed],
        components: [row]
      });
    } else {
      await channel.send({
        embeds: [panelEmbed],
        components: [row]
      });
    }
  }
});

// ================================
// WILLKOMMENS-SYSTEM
// ================================

client.on('guildMemberAdd', async member => {
  try {
    const channel = await member.guild.channels
      .fetch(CONFIG.welcomeChannel)
      .catch(() => null);

    if (!channel || !channel.isTextBased()) return;

    const welcomeEmbed = new EmbedBuilder()
      .setColor(COLOR)
      .setTitle('💜 WILLKOMMEN BEI AVENIX SERVICE')
      .setDescription(
        `Hey ${member}!\n\n` +
        'Herzlich willkommen auf unserem Discord-Server!\n\n' +
        'Wir freuen uns, dass du dabei bist. ' +
        'Schau dich in Ruhe um und lerne unsere Community kennen.\n\n' +
        `👤 **Mitglied:** ${member.user.username}\n` +
        `👥 **Mitglieder insgesamt:** ${member.guild.memberCount}\n\n` +
        'Viel Spaß bei AVENIX Service! 💜'
      )
      .setThumbnail(member.user.displayAvatarURL())
      .setImage(
        'https://cdn.discordapp.com/attachments/1428053228804636754/1573862134008258680/a2c478a5-20ca-4424-9bb1-8b250666a3a4.png?ex=6b038cd5&is=6b023b55&hm=595aa77ae7a93edc2dcb2610419d7d018c404b286266f4f15cd1f81aa4e02af0&'
      )
      .setFooter({ text: 'AVENIX Service • Willkommen' })
      .setTimestamp();

    await channel.send({
      embeds: [welcomeEmbed]
    });
  } catch (error) {
    console.error('Willkommens-Fehler:', error);
  }
});

// ================================
// TICKET-SYSTEM
// ================================

client.on('interactionCreate', async interaction => {
  try {

    // TICKET ERSTELLEN
    if (
      interaction.isStringSelectMenu() &&
      interaction.customId === 'avenix_ticket_select'
    ) {
      await interaction.deferReply({ ephemeral: true });

      const selected = interaction.values[0];
      const category = categories[selected];

      if (!category) {
        return interaction.editReply('Diese Ticket-Kategorie ist ungültig.');
      }

      const guild = interaction.guild;
      const user = interaction.user;

      const existingTicket = guild.channels.cache.find(channel =>
        channel.type === ChannelType.GuildText &&
        channel.topic === `avenix-ticket:${user.id}:${selected}`
      );

      if (existingTicket) {
        return interaction.editReply(
          `Du hast bereits ein Ticket dieser Kategorie: ${existingTicket}`
        );
      }

      const ticketCategory = await guild.channels
        .fetch(category.categoryId)
        .catch(() => null);

      if (
        !ticketCategory ||
        ticketCategory.type !== ChannelType.GuildCategory
      ) {
        return interaction.editReply(
          'Die Ticket-Kategorie wurde nicht gefunden. Bitte informiere das Team.'
        );
      }

      const ticketChannel = await guild.channels.create({
        name: `${selected}-${user.username}`
          .toLowerCase()
          .replace(/[^a-z0-9-]/g, '')
          .slice(0, 90),
        type: ChannelType.GuildText,
        parent: category.categoryId,
        topic: `avenix-ticket:${user.id}:${selected}`,
        permissionOverwrites: [
          {
            id: guild.roles.everyone.id,
            deny: [PermissionsBitField.Flags.ViewChannel]
          },
          {
            id: user.id,
            allow: [
              PermissionsBitField.Flags.ViewChannel,
              PermissionsBitField.Flags.SendMessages,
              PermissionsBitField.Flags.ReadMessageHistory,
              PermissionsBitField.Flags.AttachFiles,
              PermissionsBitField.Flags.EmbedLinks
            ]
          },
          {
            id: CONFIG.teamRole,
            allow: [
              PermissionsBitField.Flags.ViewChannel,
              PermissionsBitField.Flags.SendMessages,
              PermissionsBitField.Flags.ReadMessageHistory,
              PermissionsBitField.Flags.ManageMessages
            ]
          },
          {
            id: client.user.id,
            allow: [
              PermissionsBitField.Flags.ViewChannel,
              PermissionsBitField.Flags.SendMessages,
              PermissionsBitField.Flags.ReadMessageHistory,
              PermissionsBitField.Flags.ManageChannels
            ]
          }
        ]
      });

      const ticketEmbed = new EmbedBuilder()
        .setColor(COLOR)
        .setTitle(`${category.emoji} ${category.label}`)
        .setDescription(
          `${user}, willkommen in deinem Ticket!\n\n` +
          `${category.message}\n\n` +
          'Unser Team wird sich schnellstmöglich bei dir melden.'
        )
        .setFooter({ text: 'AVENIX Service • Ticket-System' })
        .setTimestamp();

      const closeButton = new ButtonBuilder()
        .setCustomId('avenix_ticket_close')
        .setLabel('Ticket schließen')
        .setEmoji('🔒')
        .setStyle(ButtonStyle.Danger);

      const buttonRow = new ActionRowBuilder()
        .addComponents(closeButton);

      await ticketChannel.send({
        content: `${user} <@&${CONFIG.teamRole}>`,
        embeds: [ticketEmbed],
        components: [buttonRow]
      });

      return interaction.editReply(
        `Dein Ticket wurde erstellt: ${ticketChannel}`
      );
    }

    // TICKET SCHLIESSEN
    if (
      interaction.isButton() &&
      interaction.customId === 'avenix_ticket_close'
    ) {
      const channel = interaction.channel;
      const guild = interaction.guild;

      if (!channel.topic?.startsWith('avenix-ticket:')) {
        return interaction.reply({
          content: 'Das ist kein gültiges AVENIX-Ticket.',
          ephemeral: true
        });
      }

      const [, creatorId] = channel.topic.split(':');

      const isCreator = interaction.user.id === creatorId;
      const isTeam = interaction.member.roles.cache.has(CONFIG.teamRole);

      if (!isCreator && !isTeam) {
        return interaction.reply({
          content: 'Du darfst dieses Ticket nicht schließen.',
          ephemeral: true
        });
      }

      await interaction.deferReply();

      const closedEmbed = new EmbedBuilder()
        .setColor(COLOR)
        .setTitle('🔒 Ticket wird geschlossen')
        .setDescription('Dieses Ticket wird in Kürze geschlossen.')
        .setTimestamp();

      await interaction.editReply({
        embeds: [closedEmbed],
        components: []
      });

      // LOG ERSTELLEN
      const logChannel = await guild.channels
        .fetch(CONFIG.ticketLogChannel)
        .catch(() => null);

      if (logChannel && logChannel.isTextBased()) {
        const creator = await client.users
          .fetch(creatorId)
          .catch(() => null);

        const categoryKey = channel.topic.split(':')[2];
        const category = categories[categoryKey];

        const logEmbed = new EmbedBuilder()
          .setColor(COLOR)
          .setTitle('📁 TICKET GESCHLOSSEN')
          .addFields(
            {
              name: '🎫 Ticket',
              value: channel.name,
              inline: true
            },
            {
              name: '📂 Kategorie',
              value: category?.label || 'Unbekannt',
              inline: true
            },
            {
              name: '👤 Ersteller',
              value: creator
                ? `${creator.tag} (${creator.id})`
                : creatorId,
              inline: false
            },
            {
              name: '🔒 Geschlossen von',
              value: `${interaction.user.tag} (${interaction.user.id})`,
              inline: false
            },
            {
              name: '🕒 Erstellt',
              value: `<t:${Math.floor(channel.createdTimestamp / 1000)}:F>`,
              inline: false
            },
            {
              name: '🕒 Geschlossen',
              value: `<t:${Math.floor(Date.now() / 1000)}:F>`,
              inline: false
            }
          )
          .setFooter({ text: 'AVENIX Service • Ticket-Logs' })
          .setTimestamp();

        await logChannel.send({
          embeds: [logEmbed]
        });
      }

      setTimeout(async () => {
        await channel.delete('AVENIX Ticket geschlossen').catch(console.error);
      }, 5000);
    }

  } catch (error) {
    console.error('Ticket-Fehler:', error);

    if (interaction.isRepliable() && !interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: 'Es ist ein Fehler aufgetreten. Bitte informiere das Team.',
        ephemeral: true
      }).catch(() => {});
    }
  }
});

// ================================
// BOT LOGIN
// ================================

if (!process.env.DISCORD_TOKEN) {
  console.error('FEHLER: DISCORD_TOKEN fehlt in Railway!');
  process.exit(1);
}

client.login(process.env.DISCORD_TOKEN);
