import React, { Component } from "react";
import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Button from "../components/Button";
import Captcha from "../components/Captcha";
import T from "../components/T";
import Constants from "../Constants";
import style from "../Style";
import { getTextFunction } from "../Util";

class Bank extends Component {
  componentDidMount() {
    const name = this.props.navigation.state.params?.name;
    if (name) {
      this.setState({ name });
    }
  }
  state = {
    response: null,
    captcha: "",
    random: Math.random(),
  };

  rob = () => {
    const { device } = this.props.screenProps;

    fetch(`${Constants.SERVER_ADDR}/rob`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        token: device.loginToken,
        name: this.state.name,
        captcha: this.state.captcha,
      }),
    })
      .then((response) => response.json())
      .then(async (response) => {
        this.setState({ response, random: Math.random(), captcha: "" });
        this.props.screenProps.reloadMe(device.loginToken);
      })
      .catch((error) => {
        console.error(error);
      });
  };

  renderForm() {
    const {
      screenProps: {
        me,
        device: { theme },
      },
    } = this.props;

    const getText = getTextFunction(me?.locale);

    return (
      <View>
        <TextInput
          style={style(theme).textInput}
          placeholderTextColor={theme.secondaryTextSoft}
          placeholder={getText("name")}
          value={this.state.name}
          onChangeText={(name) => this.setState({ name })}
        />

        <Captcha
          screenProps={this.props.screenProps}
          captcha={this.state.captcha}
          onChangeCaptcha={(x) => this.setState({ captcha: x })}
          random={this.state.random}
          onChangeRandom={(x) => this.setState({ random: x })}
        />

        <View
          style={{
            marginTop: 20,
          }}
        >
          <Button
            theme={this.props.screenProps.device.theme}
            title={getText("rob")}
            onPress={() => this.rob()}
          />
        </View>
      </View>
    );
  }
  render() {
    const {
      navigation,
      screenProps: {
        me,
        device: { theme },
      },
    } = this.props;
    const { response } = this.state;

    const getText = getTextFunction(me?.locale);

    return (
      <ScrollView style={{ flex: 1 }}>
        <View style={{ margin: 20 }}>
          {response ? (
            <Text style={{ color: theme.primaryText }}>
              {response.response}
            </Text>
          ) : null}

          {this.renderForm()}

          <TouchableOpacity
            style={{ marginTop: 20 }}
            onPress={() => navigation.navigate("Members", { order: 1 })}
          >
            <T>{getText("searchPeopleWithMuchMoney")}</T>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }
}

export default Bank;
