import React from "react";
import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Button from "../components/Button";
import T from "../components/T";
import Constants from "../Constants";
import style from "../Style";

class Login extends React.Component {
  state = {
    phone: "",
    error: null,
    success: null,
  };

  save() {
    const { navigation } = this.props;

    const token = this.props.screenProps.device.loginToken;

    const { phone } = this.state;

    fetch(`${Constants.SERVER_ADDR}/setPhone`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ phone, token }),
    })
      .then((response) => response.json())
      .then((responseJson) => {
        console.log("responseJson", responseJson);

        this.setState({ response: responseJson.response });

        if (responseJson.success) {
          navigation.navigate("VerifyPhoneCode", { phone });
        }
        return responseJson;
      })
      .catch((error) => {
        console.error(error);
      });
  }

  render() {
    const {
      navigation,
      screenProps: {
        device: { theme },
      },
    } = this.props;
    const { phone } = this.state;

    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ScrollView
          style={{
            flex: 1,
          }}
        >
          {this.state.response ? (
            <Text style={{ color: theme.primaryText }}>
              {this.state.response}
            </Text>
          ) : null}

          <View
            style={{
              padding: 10,
              justifyContent: "space-between",
            }}
          >
            <Text style={{ fontSize: 20 }}>Telefoonnummer</Text>
            <TextInput
              placeholder="+31"
              placeholderTextColor={theme.secondaryTextSoft}
              onChangeText={(phone) => this.setState({ phone })}
              value={this.state.phone}
              style={style(theme).textInput}
            />
          </View>

          <View
            style={{
              flexDirection: "row",
              padding: 10,
              justifyContent: "space-between",
            }}
          >
            <View />

            <Button
              theme={this.props.screenProps.device.theme}
              title="Opslaan"
              onPress={() => this.save()}
            />
          </View>

          <View>
            <TouchableOpacity
              onPress={() => {
                navigation.navigate("VerifyPhoneCode", { phone });
              }}
            >
              <T>Heb je al een code? Klik hier</T>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }
}

export default Login;
