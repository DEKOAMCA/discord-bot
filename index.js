
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
);

// AVENIX SERVICE KONFIGURATION

const TICKET_CHANNEL_ID = '1572968883793432611';
const TEAM_ROLE_ID = '1573762731713237042';
const TICKET_LOG_CHANNEL_ID = '1573851855979544586';

const COLOR = '#9410d1';

// EIGENE DISCORD-KATEGORIEN

const categories = {
  partner: {
    label: 'Partner-Ticket',
    emoji: '🤝',
    description: 'Partnerschaften und Kooperationen',
    message: 'Bitte beschreibe dein Anliegen zur Partnerschaft.',
    categoryId: '1572968884120592432'
  },

  support: {
    label: 'Support-Ticket',
    emoji: '🎧',
    description: 'Hilfe und technische Probleme',
    message: 'Bitte beschreibe dein Problem so genau wie möglich.',
    categoryId: '1572968884120592433'
  },

  bestellung: {
    label: 'Bestellungs-Ticket',
    emoji: '🛒',
    description: 'Fragen zu Bestellungen und Aufträgen',
    message: 'Bitte beschreibe dein Anliegen zur Bestellung.',
    categoryId: '1572968884250746951'
  },

  team: {
    label: 'Team-Ticket',
    emoji: '👥',
    description: 'Bewerbungen und Team-Angelegenheiten',
    message: 'Bitte beschreibe dein Anliegen an unser Team.',
    categoryId: '1572968884389154847'
  },

  sonstiges: {
    label: 'Sonstiges',
    emoji: '💬',
    description: 'Andere Anliegen',
    message: 'Bitte beschreibe dein Anliegen.',
    categoryId: '1572968884250746955'
  }
};

// BOT START

client.once('ready', async () => {
  console.log(`${client.user.tag} ist online!`);

  try {
    const ticketChannel = await client.channels.fetch(TICKET_CHANNEL_ID);

    if (!ticketChannel || !ticketChannel.isTextBased()) {
      console.log('Ticket-Erstellungskanal nicht gefunden!');
      return;
    }

    const embed = new EmbedBuilder()
      .setColor(COLOR)
      .setTitle('🎫 AVENIX SERVICE – TICKET AUSWAHL')
      .setDescription(
        'Willkommen bei AVENIX Service!\n\n' +
        'Bitte wähle deinen passenden Ticket-Bereich:\n\n' +
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
      .setFooter({
        text: 'AVENIX Service • Ticket-System'
      });

    const menu = new StringSelectMenuBuilder()
      .setCustomId('ticket_category')
      .setPlaceholder('Wähle deine Ticket-Kategorie')
      .addOptions(
        Object.entries(categories).map(([key, category]) => ({
          label: category.label,
          description: category.description,
          value: key,
          emoji: category.emoji
        }))
      );

    const row = new ActionRowBuilder().addComponents(menu);

    const messages = await ticketChannel.messages.fetch({
      limit: 50
    });

    const existingMessage = messages.find(message =>
      message.author.id === client.user.id &&
      message.embeds.some(embed =>
        embed.title === '🎫 AVENIX SERVICE – TICKET AUSWAHL'
      )
    );

    if (existingMessage) {
      await existingMessage.edit({
        embeds: [embed],
        components: [row]
      });

      console.log('Ticket-Menü aktualisiert!');
    } else {
      await ticketChannel.send({
        embeds: [embed],
        components: [row]
      });

      console.log('Ticket-Menü erstellt!');
    }

  } catch (error) {
    console.error('Fehler beim Ticket-Menü:', error);
  }
});

// INTERACTIONS

client.on('interactionCreate', async interaction => {

  try {

    // TICKET ERSTELLEN

    if (
      interaction.isStringSelectMenu() &&
      interaction.customId === 'ticket_category'
    ) {

      await interaction.deferReply({
        ephemeral: true
      });

      const selected = interaction.values[0];
      const category = categories[selected];
      const guild = interaction.guild;

      if (!category) {
        await interaction.editReply({
          content: 'Diese Ticket-Kategorie existiert nicht.'
        });
        return;
      }

      const parentCategory = await guild.channels.fetch(
        category.categoryId
      );

      if (
        !parentCategory ||
        parentCategory.type !== ChannelType.GuildCategory
      ) {
        await interaction.editReply({
          content: 'Die Discord-Ticket-Kategorie wurde nicht gefunden. Bitte prüfe die Kategorie-ID.'
        });
        return;
      }

      const allChannels = await guild.channels.fetch();

      const existingTicket = allChannels.find(channel =>
        channel.topic?.includes(`ticket-owner:${interaction.user.id}`) &&
        channel.topic?.includes(`ticket-type:${selected}`)
      );

      if (existingTicket) {
        await interaction.editReply({
          content: `Du hast bereits ein Ticket dieser Kategorie: ${existingTicket}`
        });
        return;
      }

      const safeUsername = interaction.user.username
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '-')
        .slice(0, 20);

      const ticketChannel = await guild.channels.create({

        name: `${selected}-${safeUsername}`,

        type: ChannelType.GuildText,

        parent: category.categoryId,

        topic:
          `ticket-owner:${interaction.user.id} | ` +
          `ticket-type:${selected}`,

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

      const ticketEmbed = new EmbedBuilder()
        .setColor(COLOR)
        .setTitle(`${category.emoji} ${category.label}`)
        .setDescription(
          `Hallo ${interaction.user}!\n\n` +
          `${category.message}\n\n` +
          'Unser Team wird sich schnellstmöglich um dich kümmern.'
        )
        .setFooter({
          text: 'AVENIX Service Support'
        })
        .setTimestamp();

      const closeButton = new ButtonBuilder()
        .setCustomId('close_ticket')
        .setLabel('Ticket schließen')
        .setEmoji('🔒')
        .setStyle(ButtonStyle.Danger);

      const row = new ActionRowBuilder()
        .addComponents(closeButton);

      await ticketChannel.send({
        content: `${interaction.user} <@&${TEAM_ROLE_ID}>`,
        embeds: [ticketEmbed],
        components: [row]
      });

      await interaction.editReply({
        content: `Dein Ticket wurde erstellt: ${ticketChannel}`
      });

    }

    // TICKET SCHLIESSEN

    if (
      interaction.isButton() &&
      interaction.customId === 'close_ticket'
    ) {

      const channel = interaction.channel;
      const member = interaction.member;

      const ownerMatch = channel.topic?.match(/ticket-owner:(\d+)/);
      const ownerId = ownerMatch ? ownerMatch[1] : null;

      const typeMatch = channel.topic?.match(/ticket-type:([a-z]+)/);
      const ticketType = typeMatch ? typeMatch[1] : null;

      const category = categories[ticketType];

      const isOwner = ownerId === interaction.user.id;

      const isTeam = member.roles.cache.has(TEAM_ROLE_ID);

      if (!isOwner && !isTeam) {
        await interaction.reply({
          content: 'Du darfst dieses Ticket nicht schließen!',
          ephemeral: true
        });
        return;
      }

      await interaction.deferReply({
        ephemeral: true
      });

      // TICKET-LOG ERSTELLEN

      let logSuccess = false;

      try {

        const logChannel = await client.channels.fetch(
          TICKET_LOG_CHANNEL_ID
        );

        if (!logChannel || !logChannel.isTextBased()) {
          throw new Error('Ticket-Log-Channel nicht gefunden!');
        }

        const logEmbed = new EmbedBuilder()
          .setColor(COLOR)
          .setTitle('🔒 Ticket geschlossen')
          .addFields(

            {
              name: '🎫 Ticket',
              value: channel.name,
              inline: true
            },

            {
              name: '📂 Kategorie',
              value: category
                ? `${category.emoji} ${category.label}`
                : 'Unbekannt',
              inline: true
            },

            {
              name: '👤 Ticket-Ersteller',
              value: ownerId
                ? `<@${ownerId}>`
                : 'Unbekannt',
              inline: true
            },

            {
              name: '🔐 Geschlossen von',
              value: `${interaction.user}`,
              inline: true
            },

            {
              name: '📅 Erstellt am',
              value: `<t:${Math.floor(channel.createdTimestamp / 1000)}:F>`,
              inline: false
            },

            {
              name: '🕒 Geschlossen am',
              value: `<t:${Math.floor(Date.now() / 1000)}:F>`,
              inline: false
            }

          )
          .setFooter({
            text: 'AVENIX Service • Ticket-Logs'
          })
          .setTimestamp();

        await logChannel.send({
          embeds: [logEmbed]
        });

        logSuccess = true;

      } catch (error) {
        console.error('Ticket-Log-Fehler:', error);
      }

      await interaction.editReply({
        content: logSuccess
          ? 'Ticket wird geschlossen. Das Log wurde gespeichert. 🔒'
          : 'Ticket wird geschlossen. Achtung: Das Log konnte nicht gesendet werden!'
      });

      setTimeout(async () => {

        try {
          await channel.delete('Ticket wurde geschlossen');
        } catch (error) {
          console.error('Fehler beim Löschen:', error);
        }

      }, 3000);

    }

  } catch (error) {

    console.error('Interaction-Fehler:', error);

    if (interaction.deferred || interaction.replied) {
      await interaction.editReply({
        content: 'Es ist ein Fehler aufgetreten. Bitte versuche es erneut.'
      }).catch(() => {});
    } else {
      await interaction.reply({
        content: 'Es ist ein Fehler aufgetreten. Bitte versuche es erneut.',
        ephemeral: true
      }).catch(() => {});
    }

  }

});

// BOT LOGIN

client.login(process.env.DISCORD_TOKEN);
