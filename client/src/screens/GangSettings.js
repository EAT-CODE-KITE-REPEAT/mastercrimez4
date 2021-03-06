import { useActionSheet } from "@expo/react-native-action-sheet";
import * as ImagePicker from "expo-image-picker";
import * as Permissions from "expo-permissions";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Platform,
  ScrollView,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Col, Grid } from "react-native-easy-grid";
import MarkdownView from "react-native-markdown-display";
import { AlertContext } from "../components/AlertProvider";
import Button from "../components/Button";
import Content from "../components/Content";
import MarkdownEditor from "../components/MarkdownEditor";
import T from "../components/T";
import Constants from "../Constants";
import styles from "../Style";
import { doOnce, get, getTextFunction, numberFormat, post } from "../Util";

const { height, width } = Dimensions.get("window");
const GANG_LEVEL_UNDERBOSS = 3;
const GANG_LEVEL_BANK = 2;
const GANG_LEVEL_BOSS = 4;

const GangSettings = ({
  screenProps: {
    device,
    me,
    reloadMe,
    device: { theme },
  },
}) => {
  const getText = getTextFunction(me?.locale);
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState([]);
  const [gang, setGang] = useState({});
  const [username, setUsername] = useState("");
  const [gangName, setGangName] = useState("");
  const [profile, setProfile] = useState(me?.gang?.profile || "");
  const [message, setMessage] = useState(me?.gang?.message || "");
  const [name, setName] = useState(me?.gang?.name || "");
  const [image, setImage] = useState(me?.gang?.image || "");
  const [isBullets, setIsBullets] = useState(false);
  const [amount, setAmount] = useState("");
  const { showActionSheetWithOptions } = useActionSheet();

  const alertAlert = React.useContext(AlertContext);

  const getGang = async () => {
    setLoading(true);

    const gang = await get(`gang?name=${me?.gang?.name}`);
    setLoading(false);
    setGang(gang);
  };

  const getGangInvites = async () => {
    setLoading(true);
    const { requests } = await get(`gangInvites?token=${device.loginToken}`);
    setLoading(false);
    setRequests(requests);
  };

  const postGangAnswerJoin = async (id, accepted) => {
    setLoading(true);
    const { response } = await post("gangAnswerJoin", {
      token: device.loginToken,
      id,
      accepted,
    });
    setLoading(false);
    setResponse(response);
    getGangInvites();
  };

  const postGangUpdate = async () => {
    setLoading(true);
    const { response } = await post("gangUpdate", {
      token: device.loginToken,
      profile,
      image,
      message,
      name,
    });
    setLoading(false);
    setResponse(response);
    reloadMe(device.loginToken);
  };

  const postGangInvite = async () => {
    setLoading(true);
    const { response } = await post("gangInvite", {
      token: device.loginToken,
      name: username,
    });
    setLoading(false);
    setResponse(response);
  };

  const postGangTransaction = async (isToUser) => {
    setLoading(true);
    const { response } = await post("gangTransaction", {
      token: device.loginToken,
      amount,
      isToUser,
      isBullets,
    });
    reloadMe(device.loginToken);
    setLoading(false);
    setResponse(response);
  };

  const postGangLeave = async () => {
    setLoading(true);
    const { response } = await post("gangLeave", {
      token: device.loginToken,
    });
    setLoading(false);
    setResponse(response);
  };

  const postGangKick = async (userId) => {
    setLoading(true);
    const { response } = await post("gangKick", {
      token: device.loginToken,
      userId,
    });
    setLoading(false);
    setResponse(response);
    getGang();
  };

  const getGangLevel = (gangLevel) =>
    getText(
      gangLevel === GANG_LEVEL_BOSS
        ? "gangLevelBoss"
        : gangLevel === GANG_LEVEL_UNDERBOSS
        ? "gangLevelUnderboss"
        : gangLevel === GANG_LEVEL_BANK
        ? "gangLevelBank"
        : "gangLevelMember"
    );

  const postGangRemove = async () => {
    setLoading(true);
    const { response } = await post("gangRemove", {
      token: device.loginToken,
    });
    setLoading(false);
    setResponse(response);
    reloadMe(device.loginToken);
  };

  const postGangSetRank = async (userId, rank) => {
    setLoading(true);
    const { response } = await post("gangSetRank", {
      token: device.loginToken,
      userId,
      rank,
    });
    setLoading(false);
    setResponse(response);
    reloadMe(device.loginToken);
    getGang();
  };

  doOnce(getGangInvites);
  doOnce(getGang);

  const changeRank = (userId) => {
    // Same interface as https://facebook.github.io/react-native/docs/actionsheetios.html
    const options = [
      getText("gangLevelMember"),
      getText("gangLevelBank"),
      getText("gangLevelUnderboss"),
      getText("gangLevelBoss"),
    ];
    options.push(getText("cancel"));
    const destructiveButtonIndex = undefined;
    const cancelButtonIndex = options.length - 1;

    showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex,
        destructiveButtonIndex,
      },
      (buttonIndex) => {
        if (buttonIndex < 4) {
          postGangSetRank(userId, buttonIndex + 1);
        }
        // Do something here depending on the button index selected
      }
    );
  };
  const getPermissionAsync = async () => {
    if (Platform.OS === "ios" || Platform.OS === "android") {
      const { status } = await Permissions.askAsync(Permissions.CAMERA_ROLL);
      if (status !== "granted") {
        alert(getText("weNeedCameraPermission"));
      }
    }
  };
  const handleChoosePhoto = async () => {
    await getPermissionAsync();

    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        // aspect: [4, 3],
        base64: true,
        quality: 1,
      });

      if (!result.cancelled) {
        // console.log(Object.keys(result));
        setImage(
          result.base64
            ? `data:image/${result.type};base64,${result.base64}`
            : result.uri //web has the base64 in the uri
        );
      }
    } catch (e) {
      console.log(e);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flexDirection: "row" }}>
        {loading && <ActivityIndicator />}
        {response && <T>{response}</T>}
      </View>
      <ScrollView
        contentContainerStyle={{
          height: Platform.OS === "web" ? height : undefined,
        }}
        style={{ flex: 1, padding: 15 }}
      >
        {!me?.gang?.id ? (
          <T>{getText("noAccess")}</T>
        ) : (
          <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
            <Content
              title={getText("gangProfile")}
              contentWidth={"90%"}
              id="gangProfile"
            >
              {me?.gang?.message && (
                <MarkdownView style={{ text: { color: theme.primaryText } }}>
                  {me?.gang?.message}
                </MarkdownView>
              )}
            </Content>

            <Content
              title={getText("yourStatus")}
              contentWidth={250}
              id="settingsYourStatus"
            >
              <T>{getText("youAreWhat", getGangLevel(me?.gangLevel))}</T>
            </Content>

            {/* Answer join */}
            {me?.gangLevel >= GANG_LEVEL_UNDERBOSS ? (
              <Content
                title={getText("gangJoinRequestsTitle")}
                contentWidth={250}
                id="settingsAnswerJoin"
              >
                {requests.length > 0 ? (
                  requests.map((request) => {
                    return (
                      <View
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                        }}
                      >
                        <T>{request.user?.name}</T>
                        <View style={{ flexDirection: "row" }}>
                          <Button
                            title={getText("accept")}
                            onPress={() => postGangAnswerJoin(request.id, true)}
                          />
                          <Button
                            title={getText("decline")}
                            onPress={() =>
                              postGangAnswerJoin(request.id, false)
                            }
                          />
                        </View>
                      </View>
                    );
                  })
                ) : (
                  <T>{getText("noJoinRequests")}</T>
                )}
              </Content>
            ) : null}

            {/* Invite */}
            {me?.gangLevel >= GANG_LEVEL_UNDERBOSS ? (
              <Content
                title={getText("invitePeople")}
                contentWidth={250}
                id="settingsInvite"
              >
                <View style={{ flexDirection: "row" }}>
                  <TextInput
                    placeholderTextColor={theme.secondaryTextSoft}
                    style={styles(theme).textInput}
                    value={username}
                    onChangeText={setUsername}
                    placeholder={getText("name")}
                  />
                  <Button
                    title={getText("invite")}
                    onPress={postGangInvite}
                    style={{ flex: 1, marginVertical: 10, marginLeft: 10 }}
                  />
                </View>
              </Content>
            ) : null}

            {/* Transactions */}
            {
              <Content
                title={getText("gangBank")}
                contentWidth={250}
                id="settingsTransactions"
              >
                <T>
                  {getText("bankMoney")}: €{numberFormat(me?.gang?.bank || 0)},-
                </T>
                <T>
                  {getText("bullets")}: {numberFormat(me?.gang?.bullets || 0)}
                </T>
                <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                  <TextInput
                    placeholderTextColor={theme.secondaryTextSoft}
                    style={styles(theme).textInput}
                    value={amount}
                    onChangeText={setAmount}
                    placeholder={getText("amount")}
                  />

                  <Button
                    title={isBullets ? getText("bullets") : getText("bank")}
                    onPress={() => setIsBullets(!isBullets)}
                    style={{ flex: 1, marginVertical: 10, marginLeft: 10 }}
                  />

                  <Button
                    title={getText("in")}
                    onPress={() => postGangTransaction(false)}
                    style={{ flex: 1, marginVertical: 10, marginLeft: 10 }}
                  />
                  {me?.gangLevel === GANG_LEVEL_BANK ||
                  me?.gangLevel === GANG_LEVEL_BOSS ? (
                    <Button
                      title={getText("out")}
                      onPress={() => postGangTransaction(true)}
                      style={{ flex: 1, marginVertical: 10, marginLeft: 10 }}
                    />
                  ) : null}
                </View>
              </Content>
            }

            {/* memberview with kick or change rank, per member */}
            {me?.gangLevel >= GANG_LEVEL_UNDERBOSS && (
              <Content
                title={getText("members")}
                contentWidth="90%"
                id="memberViewSettings"
              >
                {gang?.users?.map((member) => {
                  return (
                    <Grid>
                      <Col style={{ justifyContent: "center" }}>
                        <T>{member.name}</T>
                      </Col>

                      <Col style={{ justifyContent: "center" }}>
                        <T>{getGangLevel(member.gangLevel)}</T>
                      </Col>

                      <Col
                        style={{
                          justifyContent: "center",
                          alignItems: "flex-end",
                        }}
                      >
                        <View style={{ flexDirection: "row" }}>
                          {me?.gangLevel >= GANG_LEVEL_UNDERBOSS &&
                            member.id !== me?.id && (
                              <Button
                                title={getText("kick")}
                                onPress={() => postGangKick(member.id)}
                              />
                            )}
                          {me?.gangLevel === GANG_LEVEL_BOSS && (
                            <Button
                              title={getText("changeRank")}
                              style={{ marginLeft: 10 }}
                              onPress={() => changeRank(member.id)}
                            />
                          )}
                        </View>
                      </Col>
                    </Grid>
                  );
                })}
              </Content>
            )}
            {/* update name,profile,image */}

            {me?.gangLevel >= GANG_LEVEL_UNDERBOSS && (
              <Content
                title={getText("gangProfile")}
                contentWidth="90%"
                id="updateProfileSettings"
              >
                <TouchableOpacity onPress={handleChoosePhoto}>
                  {image ? (
                    <Image
                      source={{
                        uri: image.includes("data:image")
                          ? image
                          : Constants.SERVER_ADDR + image,
                      }}
                      style={{ width: 200, height: 200 }}
                      resizeMode="cover"
                    />
                  ) : (
                    <Image
                      source={require("../../assets/icon.png")}
                      style={{ width: 200, height: 200 }}
                      resizeMode="cover"
                    />
                  )}
                </TouchableOpacity>
                <TextInput
                  placeholderTextColor={theme.secondaryTextSoft}
                  style={styles(theme).textInput}
                  value={name}
                  onChangeText={setName}
                  placeholder={getText("gangName")}
                />
                <T bold>{getText("gangProfile")}</T>

                <MarkdownEditor value={profile} onChange={setProfile} />
                <T bold>{getText("gangMessage")}</T>

                <MarkdownEditor value={message} onChange={setMessage} />

                <Button
                  onPress={postGangUpdate}
                  title={getText("save")}
                  style={{ marginTop: 10 }}
                />
              </Content>
            )}
            {/* transactions */}

            {/* Leave */}
            <View style={{ marginVertical: 20 }}>
              {
                <Button
                  title={getText("leaveGang")}
                  onPress={() =>
                    alertAlert(
                      getText("areYouSure"),
                      getText("leaveGangAlertMessage"),
                      [
                        { text: getText("ok"), onPress: postGangLeave },
                        { text: getText("cancel") },
                      ],
                      { key: "leaveGang" }
                    )
                  }
                />
              }
            </View>

            {/* Gang delete */}
            <View style={{ marginVertical: 20 }}>
              {me?.gangLevel === GANG_LEVEL_BOSS && (
                <Button
                  title={getText("removeGang")}
                  onPress={() =>
                    alertAlert(
                      getText("areYouSure"),
                      getText("removeGangAlertMessage"),
                      [
                        { text: getText("ok"), onPress: postGangRemove },
                        { text: getText("cancel") },
                      ],
                      { key: "removeGang" }
                    )
                  }
                />
              )}
            </View>

            <View style={{ height: 80 }} />
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default GangSettings;
