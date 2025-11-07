import { Client, GatewayIntentBits } from "discord.js";
import { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } from "@discordjs/voice";
import play from "play-dl";
import ffmpeg from "ffmpeg-static";

// Fixed test URL
const TEST_URL = "https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=RDdQw4w9WgXcQ&start_radio=1";

async function init() {
  // Optional: YouTube login if needed
  // await play.setToken({ youtubeCookies: "<paste cookies here>" });

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.GuildVoiceStates,
      GatewayIntentBits.MessageContent
    ]
  });

  client.once("ready", () => console.log(`✅ Logged in as ${client.user.tag}`));

  client.on("messageCreate", async (message) => {
    if (!message.content.startsWith("!play") || message.author.bot) return;

    const voiceChannel = message.member?.voice?.channel;
    if (!voiceChannel) return message.reply("❌ You need to be in a voice channel first!");

    try {
      const stream = await play.stream(TEST_URL, { discordPlayerCompatibility: true });

      const connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: voiceChannel.guild.id,
        adapterCreator: voiceChannel.guild.voiceAdapterCreator
      });

      const resource = createAudioResource(stream.stream, { inputType: stream.type });
      const player = createAudioPlayer();

      player.play(resource);
      connection.subscribe(player);

      player.on(AudioPlayerStatus.Idle, () => connection.destroy());

      message.reply(`▶️ Now playing the test track!`);
    } catch (err) {
      console.error(err);
      message.reply("⚠️ Failed to play the test track.");
    }
  });

  client.login(process.env.TOKEN);
}

init();
