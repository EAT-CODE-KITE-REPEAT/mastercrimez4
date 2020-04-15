const { getRank } = require("./util");
const fetch = require("isomorphic-fetch");

const hoeren = async (req, res, User) => {
  const { token, captcha } = req.body;

  const secret_key = process.env.GOOGLE_CAPTCHA_KEY;
  const url = `https://www.google.com/recaptcha/api/siteverify?secret=${secret_key}&response=${captcha}`;

  const robot = await fetch(url, {
    method: "post",
  })
    .then((response) => response.json())
    .then((google_response) => {
      return google_response;
    })
    .catch((error) => res.json({ error }));

  if (!robot.success || robot.score < 0.5) {
    res.json({ response: "Je bent helaas gepakt door de robot-detectie!" });
    return;
  }

  const timeNeeded = 120000;
  const timeKey = "hoerenAt";
  const valueKey = "hoeren";
  const name = "hoeren";
  if (!token) {
    res.json({ response: "Geen token" });
    return;
  }

  const user = await User.findOne({ where: { loginToken: token } });

  if (user) {
    const rang = getRank(user.rank, "number");

    if (user[timeKey] + timeNeeded < Date.now()) {
      const random = Math.ceil(Math.random() * 10 * rang);

      User.update(
        {
          [timeKey]: Date.now(),
          [valueKey]: user[valueKey] + random,
          gamepoints: user.gamepoints + 1,
        },
        { where: { loginToken: token } }
      );

      res.json({
        response: `Je hebt ${random} ${name} gepimpt`,
      });
    } else {
      res.json({
        response: `Je moet nog ${Math.round(
          (user[timeKey] + timeNeeded - Date.now()) / 1000
        )} seconden wachten voor je weer kunt.`,
      });
    }
    //create activity with all variables
  }
};

module.exports = { hoeren };
