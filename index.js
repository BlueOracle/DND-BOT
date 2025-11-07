// index.js

import { Client, GatewayIntentBits } from "discord.js";
import { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } from "@discordjs/voice";
import ytdl from "ytdl-core";
import fs from "fs";

// Keep bot alive
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
  const url = args[1];
  if (!url) return message.reply("❌ Please provide a YouTube link, e.g. `!play <url>`");

  const voiceChannel = message.member?.voice?.channel;
  if (!voiceChannel) return message.reply("❌ You need to be in a voice channel first!");

  try {
    // Download the audio to a temporary file
    const stream = ytdl(url, { filter: "audioonly" });
    const filePath = "./temp_song.mp3";
    const fileStream = fs.createWriteStream(filePath);

    stream.pipe(fileStream);

    fileStream.on("finish", () => {
      // Join voice channel
      const connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: voiceChannel.guild.id,
        adapterCreator: voiceChannel.guild.voiceAdapterCreator
      });

      // Play the downloaded file
      const player = createAudioPlayer();
      const resource = createAudioResource(filePath);

      player.play(resource);
      connection.subscribe(player);

      player.on(AudioPlayerStatus.Idle, () => {
        connection.destroy();
        fs.unlinkSync(filePath); // delete the temporary file
      });

      message.reply(`▶️ Now playing: ${url}`);
    });

  } catch (err) {
    console.error(err);
    message.reply("⚠️ Failed to download or play that link.");
  }
});

// Login using token from environment variable
client.login(process.env.TOKEN);
