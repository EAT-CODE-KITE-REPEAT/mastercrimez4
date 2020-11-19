const fetch = require("node-fetch");

const needCaptcha = () => Math.round(Math.random() * 50) === 1;

const replaceAll = (string, search, replacement) =>
  string.split(search).join(replacement);

const getLocale = (userLocale) => {
  return "nl";
};
const getTextFunction = (userLocale) => (key, ...args) => {
  //default
  let languageObject = require("../locale/nl.json"); //change default to 'en' later

  if (userLocale === "nl") {
    languageObject = require("../locale/nl.json");
  }

  let string =
    languageObject[key] ||
    `Couldn't find key '${key}' for locale '${userLocale}'`;

  args.forEach((arg, index) => {
    string = replaceAll(string, `$${index + 1}`, arg);
  });

  return string;
};

const NUM_ACTIONS_UNTIL_VERIFY = 20;

const publicUserFields = [
  "id",
  "name",
  "image",
  "bio",
  "accomplice",
  "accomplice2",
  "accomplice3",
  "accomplice4",
  "cash",
  "bank",
  "rank",
  "health",
  "wiet",
  "junkies",
  "hoeren",
  "strength",
  "gamepoints",
  "level",
  "onlineAt",
  "creditsTotal",
];
const sendMessageAndPush = async (
  user,
  user2,
  message,
  Message,
  fromSystem
) => {
  const created = await Message.create({
    from: user.id,
    fromName: fromSystem ? "(System)" : user.name,
    to: user2.id,
    message,
    read: false,
  });

  if (user2.pushtoken) {
    fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: user2.pushtoken,
        title: `Nieuw bericht van ${user.name}`,
        sound: "default",
        body: message,
        data: { id: created.id },
      }),
    })
      .then((result) => console.log("result", result.status))
      .catch((e) => console.log("err", e));
  }
};

const ranks = [
  {
    rank: "Nobody",
    exp: 50,
  },
  {
    rank: "Vandal",
    exp: 150,
  },
  {
    rank: "Little thief",
    exp: 300,
  },
  {
    rank: "Thief",
    exp: 500,
  },
  {
    rank: "Carthief",
    exp: 800,
  },
  {
    rank: "Criminal",
    exp: 1200,
  },
  {
    rank: "Hitman",
    exp: 1800,
  },
  {
    rank: "Dangerous-Hitman",
    exp: 2800,
  },
  {
    rank: "Gangster",
    exp: 4400,
  },
  {
    rank: "Dangerous-Gangster",
    exp: 7600,
  },
  {
    rank: "Godfather",
    exp: 10000,
  },
  {
    rank: "Dangerous-Godfather",
    exp: 15000,
  },
  {
    rank: "Unlimited-Godfather",
    exp: 22000,
  },
  {
    rank: "Don",
    exp: 30000,
  },
  {
    rank: "Dangerous-Don",
    exp: 40000,
  },
  {
    rank: "Unlimited-Don",
    exp: 60000,
  },
];

const strengthRanks = [
  {
    rank: "Very weak",
    exp: 50,
  },
  {
    rank: "Weak",
    exp: 150,
  },
  {
    rank: "Incredibly amature",
    exp: 300,
  },
  {
    rank: "Amature",
    exp: 500,
  },
  {
    rank: "Normal",
    exp: 800,
  },
  {
    rank: "Judoka",
    exp: 1200,
  },
  {
    rank: "A bit strong",
    exp: 1800,
  },
  {
    rank: "Boxer",
    exp: 2800,
  },
  {
    rank: "Strong",
    exp: 4000,
  },
  {
    rank: "Kickbokser",
    exp: 5600,
  },
  {
    rank: "Super strong",
    exp: 7000,
  },
  {
    rank: "Powerful",
    exp: 9000,
  },
  {
    rank: "Very powerful",
    exp: 11000,
  },
  {
    rank: "Super powerful",
    exp: 14000,
  },
  {
    rank: "Ultra deluxe powerful",
    exp: 17000,
  },
  {
    rank: "Inhumanly powerful",
    exp: 20000,
  },
  {
    rank: "Robotly powerful",
    exp: 25000,
  },
  {
    rank: "Godly",
    exp: 30000,
  },
  {
    rank: "Very godly",
    exp: 35000,
  },
  {
    rank: "Super godly",
    exp: 40000,
  },
  {
    rank: "Ultra deluxe godly",
    exp: 45000,
  },
  {
    rank: "God damn strong",
    exp: 50000,
  },
  {
    rank: "King of the gods",
    exp: 60000,
  },
];

const getRankThing = (rank, returntype, type) => {
  const now = type.findIndex((r) => rank < r.exp);
  const prev = now - 1;

  const nowExp = type[now] ? type[now].exp : type[type.length - 1].exp;
  const prevExp = type[prev] ? type[prev].exp : 0;

  const nowRank = type[now] ? type[now].rank : type[type.length - 1].rank; //last rank always

  const diff = nowExp - prevExp;
  const progress = rank - prevExp;
  const percentage = Math.round((progress / diff) * 100 * 100) / 100;

  const number = now !== -1 ? now + 1 : type.length;
  if (returntype === "rankname") {
    return nowRank;
  } else if (returntype === "number") {
    return number;
  } else if (returntype === "percentage") {
    return percentage;
  } else if (returntype === "both") {
    return nowRank + " " + percentage + "%";
  } else {
    return number;
  }
};

const getRank = (rank, returntype) => getRankThing(rank, returntype, ranks);
const getStrength = (rank, returntype) =>
  getRankThing(rank, returntype, strengthRanks);

const fs = require("fs");
const Jimp = require("jimp");
const fileType = require("file-type");
const extensions = ["jpg", "jpeg", "png"];

const saveImageIfValid = (res, base64, thumbnail) => {
  if (!base64) {
    return {};
  }
  // to declare some path to store your converted image
  const path = "./uploads/" + Date.now() + ".png";
  const pathThumbnail = "./uploads/" + Date.now() + "tn.png";

  // to convert base64 format into random filename
  const base64Data = base64.replace(/^data:([A-Za-z-+/]+);base64,/, "");
  const mimeInfo = fileType(Buffer.from(base64Data, "base64"));

  if (extensions.includes(mimeInfo && mimeInfo.ext)) {
    fs.writeFileSync(path, base64Data, { encoding: "base64" });

    Jimp.read(path, (err, image) => {
      if (err) throw err;
      image
        .scaleToFit(512, 512) // resize
        .write(path); // save
    });

    if (thumbnail) {
      fs.writeFileSync(pathThumbnail, base64Data, { encoding: "base64" });

      Jimp.read(pathThumbnail, (err, image) => {
        if (err) throw err;
        image
          .scaleToFit(100, 100) // resize
          .write(pathThumbnail); // save
      });
    }

    return {
      pathImage: path.substring(1),
      pathThumbnail: thumbnail ? pathThumbnail.substring(1) : undefined,
    };
  } else {
    res.json({ response: "Invalid image" });
    return { invalid: true };
  }
};

module.exports = {
  getRank,
  getStrength,
  sendMessageAndPush,
  saveImageIfValid,
  getTextFunction,
  getLocale,
  needCaptcha,
  publicUserFields,
  NUM_ACTIONS_UNTIL_VERIFY,
};
