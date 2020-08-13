import React, { Component } from "react";
import { Text, View } from "react-native";
import Button from "../components/Button";
import T from "../components/T";
import Constants from "../Constants";
// import { ReCaptcha } from "react-recaptcha-v3";

class Wiet extends Component {
  constructor(props) {
    super(props);

    this.state = {
      response: null,
    };
  }

  keyValue(key, value) {
    return (
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          height: 40,
          alignItems: "center",
        }}
      >
        <T>{key}</T>
        <T>{value}</T>
      </View>
    );
  }

  submit = () => {
    const { device } = this.props.screenProps;

    this.setState({ loading: true });
    fetch(`${Constants.SERVER_ADDR}/wiet`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        token: device.loginToken,
        captcha: this.state.captcha,
      }),
    })
      .then((response) => response.json())
      .then(async (response) => {
        this.setState({ response, loading: false });
        this.props.screenProps.reloadMe(device.loginToken);
      })
      .catch((error) => {
        console.error(error);
      });
  };
  renderFooter = () => {
    const { device, me } = this.props.screenProps;
    return (
      <View>
        {this.keyValue("Wiet in bezit", me?.wiet)}

        <Button
          theme={this.props.screenProps.device.theme}
          // disabled={!this.state.captcha || this.state.loading}
          style={{ marginTop: 20 }}
          title="Teel wietplanten"
          onPress={this.submit}
        />

        {/* <ReCaptcha
          sitekey={Constants.CAPTCHA}
          action="wiet"
          verifyCallback={(token) => this.setState({ captcha: token })}
        /> */}
      </View>
    );
  };
  render() {
    const { response } = this.state;

    return (
      <View style={{ flex: 1, alignItems: "center" }}>
        <View style={{ margin: 20 }}>
          {response ? (
            <View style={{ flex: 1, minHeight: 400 }}>
              <Text style={{ color: "white" }}>{response.response}</Text>

              <Button
                theme={this.props.screenProps.device.theme}
                title="OK"
                onPress={() => this.setState({ response: null })}
              />
            </View>
          ) : (
            this.renderFooter()
          )}
        </View>
      </View>
    );
  }
}

export default Wiet;
