require("dotenv").config();

const tmi = require("tmi.js");
const axios = require("axios");
const moment = require("moment");

let xdds = 0;
const startTime = moment(); // Store the script start time

let liveAccount = {
  id: "",
  gameName: "",
  tagLine: "",
  server: "",
};

const defaultAccount = {
  id: "l-f_kbZ72Pb6oQdjKJKiqp0D8yFIynydOyATXwEi7Y2RsaM",
  gameName: "RAT KING",
  tagLine: "xpp",
  server: "EUW1",
};

const accounts = [
  { gameName: "RAT KING", tagLine: "xpp", server: "EUW1" },
  //   { gameName: "Caedrel", tagLine: "696969", server: "EUW1" },
  { gameName: "caedrel", tagLine: "xpp", server: "EUW1" },
  //   { gameName: "RATAYUSI69", tagLine: "EUW", server: "EUW1" },
  //   { gameName: "Tunahan Kuzu", tagLine: "EUW", server: "EUW1" },
  //   { gameName: "G3H1weuZSwamGVbF", tagLine: "EUW", server: "EUW1" },
  //   { gameName: "CRACKED CAEDREL", tagLine: "EUW", server: "EUW1" },
  //   { gameName: "KpoBDQztiZPNw95z", tagLine: "EUW", server: "EUW1" },
];

const client = new tmi.Client({
  options: { debug: true },
  identity: {
    username: process.env.TWITCH_BOT_USERNAME,
    password: `oauth:${process.env.TWITCH_OAUTH_TOKEN}`,
  },
  channels: ["Caedrel"],
});

client.connect();

client.on("message", async (channel, tags, message, self) => {
  try {
    const isNotBot =
      tags.username.toLocaleLowerCase() !==
      process.env.TWITCH_BOT_USERNAME.toLocaleLowerCase();

    if (tags["first-msg"] && message.toLocaleLowerCase() === "xdd") {
      await client.say(channel, "FirstTimexdder Clap CHILLS xddShaking");
    }
    if (tags["first-msg"]) {
      await client.say(channel, "FirstTimeChatter");
    }
    if (message.toLowerCase() === "xdd") {
      xdds += 1;
    }
    if (message.toLowerCase() === "!xdd") {
      await client.say(channel, "xdd", { "reply-parent-msg-id": tags.id });
    }
    if (message.toLowerCase() === "!xddcount") {
      const currentTime = moment();
      const duration = moment.duration(currentTime.diff(startTime));
      const timeString = `${duration.hours()}h ${duration.minutes()}m ${duration.seconds()}s`;

      await client.say(
        channel,
        `Degenerate rats typed xdd ${xdds} times within the last ${timeString}`,
        { "reply-parent-msg-id": tags.id }
      );
    }
    // Handle other commands similarly
    if (message.toLowerCase() === "!rank") {
      await getRiotAccount(channel, tags);
    }
  } catch (e) {
    console.error("Error handling message:", e);
  }
});

function checkWord(sentence, definedWord) {
  // Split the sentence into an array of words
  const words = sentence.split(" ");

  // Check if the defined word is present in the array of words
  const isMatch = words.includes(definedWord);

  // Return the result
  return isMatch;
}

function clearLiveAccount() {
  liveAccount["id"] = "";
  liveAccount["gameName"] = "";
  liveAccount["tagLine"] = "";
  liveAccount["server"] = "";
}

async function getRiotAccount(channel, tags) {
  clearLiveAccount();
  accounts.forEach(async (account) => {
    const baseURL = `https://europe.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${account.gameName}/${account.tagLine}?api_key=${process.env.RIOT_API_KEY}`;
    try {
      const response = await axios.get(baseURL);

      if (response.status === 200) {
        const { puuid, gameName, tagLine } = response.data;

        await getSummonerId(puuid, gameName, tagLine, account.server);
      }
    } catch (error) {
      console.error("Error fetching riot account:", error.message);
    }
  });

  await getLeagueAccount(channel, tags);
}

async function getSummonerId(puuid, gameName, tagLine, server) {
  const baseURL = `https://${server}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}?api_key=${process.env.RIOT_API_KEY}`;

  try {
    const response = await axios.get(baseURL);
    if (response.status === 200) {
      const { id } = response.data;

      const isLive = await getLiveGame(id, server);

      if (isLive) {
        liveAccount = { id: id, gameName: gameName, tagLine: tagLine };
      }
    }
  } catch (error) {
    console.error("Error fetching summoner id:", error.message);
  }
}

async function getLiveGame(summonerId, server) {
  const baseURL = `https://${server}.api.riotgames.com/lol/spectator/v4/active-games/by-summoner/${summonerId}?api_key=${process.env.RIOT_API_KEY}`;

  try {
    const response = await axios.get(baseURL);

    if (response.status === 200) {
      return true;
    }
  } catch (error) {
    console.error("Error fetching live game:", error.message);

    return false;
  }
}

async function getLeagueAccount(channel, tags) {
  const apiKey = process.env.RIOT_API_KEY;
  const baseUrl =
    liveAccount["id"] !== ""
      ? `https://${liveAccount["server"]}.api.riotgames.com/lol/league/v4/entries/by-summoner/${liveAccount["id"]}?api_key=${apiKey}`
      : `https://${defaultAccount["server"]}.api.riotgames.com/lol/league/v4/entries/by-summoner/${defaultAccount["id"]}?api_key=${apiKey}`;
  try {
    const response = await axios.get(baseUrl);

    if (response.data && response.data.length > 0) {
      const { tier, rank, leaguePoints } = response.data[0];

      const message =
        liveAccount.id !== ""
          ? `${liveAccount["gameName"]} #${liveAccount["tagLine"]} is ${tier} ${rank} ${leaguePoints} LP xdd`
          : `${defaultAccount["gameName"]} #${defaultAccount["tagLine"]} is ${tier} ${rank} ${leaguePoints} LP xdd`;

      return await client.say(channel, message, {
        "reply-parent-msg-id": tags.id,
      });
    }
  } catch (error) {
    console.error("Error fetching data:", error.message);
  }
}
