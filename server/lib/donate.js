const donate = async (req, res, User, Message) => {
  const { loginToken, to, amount, type } = req.body;
  const user = await User.findOne({ where: { loginToken } });
  const validTypes = [
    "cash",
    "bullets",
    "hoeren",
    "junkies",
    "wiet",
    "gamepoints",
  ];

  const typeNames = {
    cash: "contant",
    bullets: "kogels",
    hoeren: "hoeren",
    junkies: "junkies",
    wiet: "wiet",
    gamepoints: "gamepoints",
  };

  if (amount <= 0 || isNaN(amount)) {
    res.json({ response: "Ongeldige hoeveelheid" });
    return;
  }

  if (!validTypes.includes(type)) {
    response.json({ response: "Ongeldig type" });
    return;
  }

  if (user) {
    if (user[type] >= amount) {
      const user2 = await User.findOne({ where: { name: to } });

      if (user2) {
        if (user2.health > 0) {
          const amount2 = Math.round(amount * 0.95);

          const typeName = typeNames[type];

          User.update(
            { [type]: user[type] - amount },
            { where: { id: user.id } }
          );
          User.update(
            { [type]: user2[type] + amount2 },
            { where: { id: user2.id } }
          );
          const message = `${user.name} heeft jou ${amount2} ${typeName} overgemaakt`;
          Message.create({
            from: 0,
            fromName: "(System)",
            to: user2.id,
            message,
            read: false,
          });

          res.json({ response: "Overgemaakt" });
        } else {
          res.json({ response: "Deze speler is dood" });
        }
      } else {
        res.json({ response: "Deze speler bestaat niet" });
      }
    } else {
      res.json({ response: "Je hebt niet genoeg" });
    }
  } else {
    res.json({ response: "Kan deze gebruiker niet vinden" });
  }
};

module.exports = { donate };
