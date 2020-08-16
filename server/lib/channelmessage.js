const { saveImageIfValid, publicUserFields } = require("./util");

const getChat = async (req, res, { User, ChannelSub, ChannelMessage }) => {
  const { loginToken, id } = req.query;

  if (!loginToken) {
    res.json({ response: "No token" });
    return;
  }

  const user = await User.findOne({ where: { loginToken } });

  if (!user) {
    res.json({ response: "Invalid user" });
    return;
  }

  const isSub = await ChannelSub.findOne({
    where: { channelId: id, userId: user.id },
  });

  if (!isSub) {
    res.json({ response: "You're not part of this chat" });
    return;
  }

  ChannelMessage.findAll({
    where: { channelId: id },
    order: [["id", "DESC"]],
    include: { model: User, attributes: publicUserFields },
    limit: 100,
  }).then((chat) => {
    res.json(chat);
  });
};

const postChat = async (
  req,
  res,
  { User, ChannelSub, ChannelMessage, sequelize }
) => {
  const { loginToken, cid, message, image } = req.body;

  if (!loginToken) {
    res.json({ response: "No token" });
    return;
  }

  if (!message) {
    res.json({ response: "No message" });
    return;
  }

  if (!cid) {
    res.json({ response: "No cid" });
    return;
  }

  const user = await User.findOne({ where: { loginToken } });

  if (!user) {
    res.json({ response: "Invalid user" });
    return;
  }

  const sub = await ChannelSub.findOne({
    where: { channelId: cid, userId: user.id },
  });

  if (!sub) {
    res.json({ response: "You're not part of this chat" });
    return;
  }

  const { pathImage, invalid } = saveImageIfValid(res, image, false);
  if (invalid) return;

  const chatCreated = await ChannelMessage.create({
    userId: user.id,
    channelId: cid,
    message,
    image: pathImage,
  });

  const updateUnread = await sequelize.query(
    `UPDATE channelsubs SET unread=unread+1 WHERE channelId=${cid} AND userId != ${user.id}`
  );
  const updateLastMessage = await sequelize.query(
    `UPDATE channelsubs SET lastmessage='${message}' WHERE channelId=${cid}`
  );

  //   console.log(updateUnread, updateLastMessage);

  res.json({ response: "Chat created", success: true, chatId: chatCreated.id });
};

module.exports = { getChat, postChat };