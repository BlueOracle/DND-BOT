// index.js


import { Client, GatewayIntentBits } from "discord.js";
import { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } from "@discordjs/voice";
import play from "play-dl";



setInterval(() => console.log("Bot is alive"), 5 * 60 * 1000);



// Create Discord client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.MessageContent
  ]
});

// Bot ready
client.once("ready", () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

// Handle messages
client.on("messageCreate", async (message) => {
  if (!message.content.startsWith("!play") || message.author.bot) return;

  const args = message.content.split(" ");
  const url = "https://youtu.be/-BDJgp3t5qA";
  if (!url) return message.reply("❌ Please provide a YouTube link, e.g. `!play <url>`");

  const voiceChannel = message.member?.voice?.channel;
  if (!voiceChannel) return message.reply("❌ You need to be in a voice channel first!");

  try {
    const stream = await play.stream(url);

    const connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: voiceChannel.guild.id,
      adapterCreator: voiceChannel.guild.voiceAdapterCreator
    });

    const resource = createAudioResource(stream.stream, { inputType: stream.type });
    const player = createAudioPlayer();

    player.play(resource);
    connection.subscribe(player);

    // Disconnect when done
    player.on(AudioPlayerStatus.Idle, () => {
      connection.destroy();
    });

    message.reply(`▶️ Now playing: ${url}`);
  } catch (err) {
    console.error(err);
    message.reply("⚠️ Failed to play that link.");
  }
});

// Login using token from environment variable
client.login(process.env.TOKEN);
