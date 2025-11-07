import { Client, GatewayIntentBits } from "discord.js";
import { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } from "@discordjs/voice";
import ffmpeg from "ffmpeg-static";
import play from "play-dl";

await play.setToken({ youtubeCookies: "<paste cookies here>" });

// Keep bot alive on free-tier
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

// Simple queue
const queue = new Map();

// Bot ready
client.once("ready", () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

// Handle messages
client.on("messageCreate", async (message) => {
  if (!message.content.startsWith("!play") || message.author.bot) return;

  const args = message.content.split(" ");
  const url = args[1];
  if (!url) return message.reply("❌ Please provide a YouTube link, e.g. `!play <url>`");

  try {
    new URL(url); // validate URL
  } catch {
    return message.reply("❌ Invalid URL.");
  }

  const voiceChannel = message.member?.voice?.channel;
  if (!voiceChannel) return message.reply("❌ You need to be in a voice channel first!");

  // Get guild queue or create new
  let serverQueue = queue.get(message.guild.id);
  if (!serverQueue) {
    serverQueue = [];
    queue.set(message.guild.id, serverQueue);
  }
  serverQueue.push(url);

  // If nothing is playing, start
  if (serverQueue.length === 1) {
    playSong(message.guild.id, voiceChannel);
  } else {
    message.reply(`➕ Added to queue: ${url}`);
  }
});

// Function to play the next song in queue
async function playSong(guildId, voiceChannel) {
  const serverQueue = queue.get(guildId);
  if (!serverQueue || serverQueue.length === 0) return;

  const url = serverQueue[0];

  try {
    const stream = await play.stream(url, { discordPlayerCompatibility: true });

    const connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: voiceChannel.guild.id,
      adapterCreator: voiceChannel.guild.voiceAdapterCreator
    });

    const resource = createAudioResource(stream.stream, { inputType: stream.type });
    const player = createAudioPlayer();

    player.play(resource);
    connection.subscribe(player);

    player.on(AudioPlayerStatus.Idle, () => {
      serverQueue.shift(); // remove finished song
      if (serverQueue.length > 0) {
        playSong(guildId, voiceChannel);
      } else {
        connection.destroy();
      }
    });
  } catch (err) {
    console.error(err);
    voiceChannel.send("⚠️ Failed to play that link.");
    serverQueue.shift();
    if (serverQueue.length > 0) {
      playSong(guildId, voiceChannel);
    }
  }
}

// Login using token from environment variable
client.login(process.env.TOKEN);
