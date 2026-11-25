require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder, Events, PermissionFlagsBits, SlashCommandBuilder, REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

function loadDiscordConfig() {
  let fileConfig = {};
  try { fileConfig = JSON.parse(fs.readFileSync(path.join(__dirname, 'discord-config.json'), 'utf8')); }
  catch (e) { if (e.code !== 'ENOENT') console.error('[Discord] Could not read discord-config.json:', e.message); }
  return { ...fileConfig, token: process.env.DISCORD_BOT_TOKEN || fileConfig.token, adminChannelId: process.env.DISCORD_ADMIN_CHANNEL_ID || fileConfig.adminChannelId, guildId: process.env.DISCORD_GUILD_ID || fileConfig.guildId, adminRoleId: process.env.DISCORD_ADMIN_ROLE_ID || fileConfig.adminRoleId };
}

function createBot({ getOrder, saveOrder, deliverOrder, coupons }) {
  const config = loadDiscordConfig();
  const token = config.token;
  if (!token) { console.warn('[Discord] DISCORD_BOT_TOKEN missing; bot disabled.'); return null; }
  const client = new Client({ intents: [GatewayIntentBits.Guilds] });
  const adminChannelId = config.adminChannelId;
  const guildId = config.guildId;
  const adminRoleId = config.adminRoleId;
  const commands = [
    new SlashCommandBuilder().setName('coupon-create').setDescription('Create a store coupon')
      .addStringOption(o=>o.setName('code').setDescription('Coupon code').setRequired(true))
      .addStringOption(o=>o.setName('type').setDescription('Discount type').setRequired(true).addChoices({name:'Percentage',value:'percent'},{name:'Fixed rupees',value:'fixed'}))
      .addNumberOption(o=>o.setName('value').setDescription('Percent or rupee amount').setRequired(true).setMinValue(1))
      .addIntegerOption(o=>o.setName('max-uses').setDescription('0 = unlimited').setRequired(false).setMinValue(0))
      .addNumberOption(o=>o.setName('min-total').setDescription('Minimum cart subtotal in INR').setRequired(false).setMinValue(0))
      .addStringOption(o=>o.setName('expires-at').setDescription('Optional ISO date, e.g. 2026-12-31T23:59:00+05:30').setRequired(false)),
    new SlashCommandBuilder().setName('coupon-list').setDescription('List store coupons'),
    new SlashCommandBuilder().setName('coupon-delete').setDescription('Delete a coupon').addStringOption(o=>o.setName('code').setDescription('Coupon code').setRequired(true)),
    new SlashCommandBuilder().setName('coupon-enable').setDescription('Enable a coupon').addStringOption(o=>o.setName('code').setDescription('Coupon code').setRequired(true)),
    new SlashCommandBuilder().setName('coupon-disable').setDescription('Disable a coupon').addStringOption(o=>o.setName('code').setDescription('Coupon code').setRequired(true))
  ].map(c=>c.toJSON());

  function isAdmin(i) {
    const hasRole = !!adminRoleId && !!i.member && !!i.member.roles?.cache?.has?.(adminRoleId);
    return !!(i.memberPermissions?.has(PermissionFlagsBits.ManageGuild) || i.memberPermissions?.has(PermissionFlagsBits.Administrator) || hasRole);
  }
  async function publishOrder(order, screenshot) {
    if (!adminChannelId) throw new Error('DISCORD_ADMIN_CHANNEL_ID is not configured.');
    const channel = await client.channels.fetch(adminChannelId);
    if (!channel?.isTextBased()) throw new Error('Admin channel is not a text channel.');
    const lines = order.items.map(x=>`• ${x.name} × ${x.qty} — ₹${x.lineTotal}`).join('\n');
    const fields = [
      { name:'Minecraft username', value:order.player, inline:true },
      { name:'Payer UPI ID', value:order.payerUpiId || 'Not provided', inline:true },
      { name:'UPI UTR', value:order.utr, inline:true },
      { name:'Subtotal', value:`₹${order.subtotal}`, inline:true },
      { name:'Coupon', value:order.couponCode ? `${order.couponCode} (−₹${order.discount})` : 'None', inline:true },
      { name:'Total paid', value:`₹${order.total}`, inline:true },
      { name:'Items', value:lines || 'None' },
      { name:'Status', value:'PENDING — verify payment manually' }
    ];
    const embed = new EmbedBuilder().setTitle(`New store order · ${order.orderId}`).setColor(0x8b5cf6).addFields(fields).setTimestamp();
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`approve:${order.orderId}`).setLabel('Approve & deliver').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId(`reject:${order.orderId}`).setLabel('Reject').setStyle(ButtonStyle.Danger)
    );
    const ext = screenshot.mimetype === 'image/png' ? 'png' : screenshot.mimetype === 'image/webp' ? 'webp' : 'jpg';
    const attachment = new AttachmentBuilder(screenshot.buffer, { name:`${order.orderId}-payment.${ext}` });
    const msg = await channel.send({ embeds:[embed], files:[attachment], components:[row] });
    order.discordMessageId = msg.id;
    return msg.id;
  }
  client.once(Events.ClientReady, async c => {
    console.log(`[Discord] Logged in as ${c.user.tag}`);
    try {
      const rest = new REST({ version:'10' }).setToken(token);
      if (guildId) await rest.put(Routes.applicationGuildCommands(c.user.id, guildId), { body:commands });
      else await rest.put(Routes.applicationCommands(c.user.id), { body:commands });
      console.log(`[Discord] Registered ${commands.length} coupon commands${guildId ? ' for guild '+guildId : ' globally'}.`);
    } catch (e) { console.error('[Discord] Slash command registration failed:', e); }
  });
  client.on(Events.InteractionCreate, async i => {
    try {
      if (i.isChatInputCommand()) {
        if (!isAdmin(i)) return i.reply({ content:'You are not allowed to manage store coupons.', ephemeral:true });
        const code = i.options.getString('code');
        if (i.commandName === 'coupon-create') {
          const coupon = coupons.create({ code, type:i.options.getString('type'), value:i.options.getNumber('value'), maxUses:i.options.getInteger('max-uses') ?? 0, minTotal:i.options.getNumber('min-total') ?? 0, expiresAt:i.options.getString('expires-at') });
          return i.reply({ content:`Created **${coupon.code}**: ${coupon.type === 'percent' ? `${coupon.value}% off` : `₹${coupon.value} off`}. Max uses: ${coupon.maxUses || 'Unlimited'}.`, ephemeral:true });
        }
        if (i.commandName === 'coupon-list') {
          const all = coupons.list();
          const body = all.length ? all.map(c=>`**${c.code}** — ${c.enabled?'Enabled':'Disabled'} · ${c.type==='percent'?`${c.value}% off`:`₹${c.value} off`} · Uses ${c.usedCount}/${c.maxUses||'∞'} · Min ₹${c.minTotal}${c.expiresAt?` · Expires ${c.expiresAt}`:''}`).join('\n') : 'No coupons created yet.';
          return i.reply({ content:body.slice(0,1900), ephemeral:true });
        }
        if (i.commandName === 'coupon-delete') return i.reply({ content:coupons.remove(code) ? `Deleted coupon **${code.toUpperCase()}**.` : 'Coupon not found.', ephemeral:true });
        if (i.commandName === 'coupon-enable' || i.commandName === 'coupon-disable') {
          const result = coupons.setEnabled(code, i.commandName === 'coupon-enable');
          return i.reply({ content:result ? `Coupon **${result.code}** is now ${result.enabled?'enabled':'disabled'}.` : 'Coupon not found.', ephemeral:true });
        }
      }
      if (!i.isButton()) return;
      const [action, orderId] = i.customId.split(':');
      if (!['approve','reject'].includes(action)) return;
      if (i.channelId !== adminChannelId || !isAdmin(i)) return i.reply({ content:'You are not allowed to process store orders.', ephemeral:true });
      const order = getOrder(orderId);
      if (!order) return i.reply({ content:'Order record not found.', ephemeral:true });
      if (order.status !== 'PENDING') return i.reply({ content:`This order is already ${order.status}.`, ephemeral:true });
      if (action === 'reject') {
        order.status='REJECTED'; order.reviewedBy=i.user.tag; order.reviewedAt=new Date().toISOString(); saveOrder(order);
        coupons.release(order.couponCode);
        return i.update({ content:`Order ${orderId} rejected by ${i.user.tag}. Coupon use released.`, components:[] });
      }
      await i.deferReply({ ephemeral:true });
      try {
        await deliverOrder(order);
        order.status='APPROVED_DELIVERED'; order.reviewedBy=i.user.tag; order.reviewedAt=new Date().toISOString(); saveOrder(order);
        await i.message.edit({ embeds:[EmbedBuilder.from(i.message.embeds[0]).setColor(0x22c55e).addFields({name:'Delivery',value:`Commands sent successfully by ${i.user.tag}`})], components:[] });
        await i.editReply(`Approved and delivery commands sent for **${order.player}**.`);
      } catch (e) {
        console.error('[Delivery]', e);
        order.lastDeliveryError=String(e.message || e); saveOrder(order);
        await i.editReply(`Delivery failed. Order remains pending. Check RCON and delivery commands. Error: ${String(e.message || e).slice(0,500)}`);
      }
    } catch (e) {
      console.error('[Discord interaction]', e);
      if (i.isRepliable() && !i.replied && !i.deferred) await i.reply({ content:`Action failed: ${String(e.message || e).slice(0,500)}`, ephemeral:true }).catch(()=>{});
    }
  });
  client.login(token).catch(e=>console.error('[Discord] Login failed:',e));
  return { client, publishOrder };
}
module.exports = { createBot };
