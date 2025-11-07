import { Client, GatewayIntentBits } from "discord.js";
import { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } from "@discordjs/voice";
import ffmpeg from "ffmpeg-static";
import play from "play-dl";

await play.setToken({ 
  youtubeCookies: "PREF=tz=America.New_York&f4=4000000&f6=40000000&f5=30000&f7=100; VISITOR_INFO1_LIVE=1F5dsnchCT0; VISITOR_PRIVACY_METADATA=CgJVUxIEGgAgUA%3D%3D; _gcl_au=1.1.5531112.1760034050; __Secure-YNID=13.YT=LtTRFVtsYM5Dn5jiSx1Sqx7QXhV2ik99mJRpamihq-0DqCI8QHzV2Xpp60-CgQ2fOpF45piLalhciKvNPb6Bv_rVNS91ubRxlb8M6I3HjJ_Gtb5FY8UlKl3QKgJDEmG_-VHBm29MW2zCQiu6KMwQDi8QQdjYHEErD7gNdubzFnt5_5TKRDY59aVlVT8L9n1DDxBdCunHNo-yMsStjsamSIiavw43oXQ6SpyA3SHjzgISb-StbUK4jwnw9-LQ-ZmkT1usuNVnNKgJ6BOm1Yf88Vuz7Y5C2Sql6LHERr3hdPQcoQjYJCrluUOrjdOABpIh3zbJCgmyemp8wOCXqgYieA; GPS=1; VISITOR_INFO1_LIVE=hlq2Yxkxqms; VISITOR_PRIVACY_METADATA=CgJVUxIEGgAgTA%3D%3D; YSC=4GXAzR_lRCc; __Secure-ROLLOUT_TOKEN=CMr68difhYKzwwEQlNXMn5i1jwMYtoHk_d7gkAM%3D" 
});


// Fixed test URL
const TEST_URL = "https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=RDdQw4w9WgXcQ&start_radio=1";


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
