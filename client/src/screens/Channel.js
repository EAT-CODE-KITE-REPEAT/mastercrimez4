import { Ionicons } from "@expo/vector-icons";
import * as React from "react";
import {
  Dimensions,
  FlatList,
  Image,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { RefreshControl } from "react-native-web-refresh-control";
import ImageInput from "../components/ImageInput";
import T from "../components/T";
import Constants from "../Constants";
import STYLE from "../Style";
import { get, getTextFunction, post } from "../Util";

const { width, height } = Dimensions.get("window");
const isBigDevice = width > 500;
const maxWidth = isBigDevice ? 500 : width;

const IMAGE_SIZE = 40;

class ChatScreen extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      members: [],
      isFetching: true,
      chat: [],
    };
  }

  componentDidMount() {
    const {
      navigation: {
        state: { params },
      },
      screenProps: {
        device: { loginToken },
        reloadMe,
      },
    } = this.props;
    this.fetchChat();

    this.interval = setInterval(() => {
      this.fetchChat();
      console.log("setRead");
      post("setRead", { loginToken, id: params?.subid });
      reloadMe(loginToken);
    }, 5000);
  }

  componentWillUnmount() {
    clearInterval(this.interval);
  }

  fetchChat = async () => {
    const {
      screenProps: { device },
      navigation: {
        state: { params },
      },
    } = this.props;

    const url = `channelmessage?loginToken=${device.loginToken}&id=${params.id}`;

    console.log(url);
    const { chat, response } = await get(url);
    this.setState({ chat, isFetching: false });
  };

  onRefresh = () => {
    this.setState({ isFetching: true }, function () {
      this.fetchChat();
    });
  };

  renderItem = ({ item, index }) => {
    const {
      screenProps: { me },
      navigation,
    } = this.props;
    const isMe = item.user?.id === me?.id;
    const avatar = (
      <TouchableOpacity
        onPress={() => {
          navigation.navigate("Profile", { name: item.user?.name });
        }}
      >
        <Image
          source={{ uri: Constants.SERVER_ADDR + item.user?.thumbnail }}
          style={{
            width: IMAGE_SIZE,
            height: IMAGE_SIZE,
            borderRadius: IMAGE_SIZE / 2,
          }}
        />
      </TouchableOpacity>
    );
    return (
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          marginHorizontal: 0,
          justifyContent: isMe ? "flex-end" : "flex-start",
        }}
      >
        {!isMe ? avatar : null}
        <View
          style={{
            flex: 1,
            marginVertical: 10,
            marginHorizontal: 10,
            backgroundColor: item.isSystem
              ? "gray"
              : isMe
              ? "#d9f6c2"
              : "white",
            padding: 10,
            maxWidth: item.isSystem ? undefined : isBigDevice ? 400 : 200,
            borderRadius: 10,
            borderWidth: 0.5,
            borderColor: "#CCC",
            shadowColor: "#000",
            shadowOffset: {
              width: 0,
              height: 2,
            },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
            elevation: 5,
          }}
        >
          <View
            style={{ flexDirection: "row", justifyContent: "space-between" }}
          >
            <Text style={{ fontWeight: "bold" }}>{item.user?.name}</Text>
          </View>
          {item.image ? (
            <Image
              source={{
                uri: Constants.SERVER_ADDR + item.image,
              }}
              style={{ width: 180, height: 180 }}
              resizeMode="cover"
            />
          ) : null}

          <Text>{item.message}</Text>
        </View>
        {isMe ? avatar : null}
      </View>
    );
  };

  send = () => {
    const {
      screenProps: { device },
      navigation: {
        state: { params },
      },
    } = this.props;
    const { image, message, hasEdited } = this.state;

    this.setState({ message: "", image: null });

    const url = `${Constants.SERVER_ADDR}/channelmessage`;
    fetch(url, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        loginToken: device.loginToken,
        image: hasEdited ? image : undefined,
        message,
        cid: params?.id,
      }),
    })
      .then((response) => response.json())
      .then(({ response, success }) => {
        this.setState({ response });
        if (success) {
          this.fetchChat();
        }
      })
      .catch((error) => {
        console.log(error, url);
      });
  };

  renderFooter = () => {
    const {
      screenProps: {
        device: { theme },
        me,
      },
    } = this.props;
    const getText = getTextFunction(me?.locale);

    const { image, message, hasEdited, response } = this.state;
    return (
      <View>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginHorizontal: 10,
          }}
        >
          <ImageInput
            small
            value={image}
            onChange={(base64) =>
              this.setState({
                hasEdited: true,
                image: base64,
              })
            }
          />

          <TextInput
            multiline
            // onSubmitEditing={this.send}
            style={[STYLE(theme).textInput, { flex: 1 }]}
            value={message}
            placeholder={getText("message")}
            onChangeText={(message) => this.setState({ message })}
          />

          <TouchableOpacity onPress={this.send}>
            <Ionicons name="ios-send" size={32} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  render() {
    const { chat } = this.state;
    return (
      <SafeAreaView style={styles.container}>
        {Array.isArray(chat) ? (
          <FlatList
            contentContainerStyle={{
              height: Platform.OS === "web" ? height - 250 : undefined,
            }}
            data={chat}
            renderItem={this.renderItem}
            keyExtractor={(item, index) => index.toString()}
            refreshControl={
              <RefreshControl
                refreshing={this.state.isFetching}
                onRefresh={this.onRefresh}
              />
            }
            inverted
            ref={(ref) => (this.flatList = ref)}
          />
        ) : (
          <T>{chat?.response}</T>
        )}
        {this.renderFooter()}
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default ChatScreen;
