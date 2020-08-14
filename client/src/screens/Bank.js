import React, { Component } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import Button from "../components/Button";
import T from "../components/T";
import Constants from "../Constants";

class Bank extends Component {
  state = {
    response: null,
  };

  deposit = (deposit) => {
    const { device } = this.props.screenProps;

    fetch(`${Constants.SERVER_ADDR}/bank`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        token: device.loginToken,
        amount: this.state.amount,
        deposit,
      }),
    })
      .then((response) => response.json())
      .then(async (response) => {
        this.setState({ response });
        this.props.screenProps.reloadMe(device.loginToken);
      })
      .catch((error) => {
        console.error(error);
      });
  };

  keyValue(key, value) {
    return (
      <View style={styles.row}>
        <T>{key}</T>
        <T>{value}</T>
      </View>
    );
  }

  renderFooter = () => {
    const { to, amount, type } = this.state;

    return (
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          marginTop: 20,
        }}
      >
        <Button
          theme={this.props.screenProps.device.theme}
          title="In"
          onPress={() => this.deposit(true)}
          style={{ width: 80 }}
        />
        <Button
          theme={this.props.screenProps.device.theme}
          title="Uit"
          onPress={() => this.deposit(false)}
          style={{ width: 80 }}
        />
      </View>
    );
  };

  renderForm() {
    return (
      <View>
        <TextInput
          style={{
            backgroundColor: this.props.screenProps.device.theme.secondary,
            fontSize: 24,
            borderRadius: 10,
            color: this.props.screenProps.device.theme.secondaryText,
          }}
          placeholder="Hoeveelheid"
          value={this.state.amount}
          onChangeText={(amount) => this.setState({ amount })}
        />
        {this.renderFooter()}
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

    return (
      <View style={{ flex: 1, margin: 20, alignItems: "center" }}>
        <View style={{ width: 200 }}>
          {response ? (
            <Text style={{ color: theme.primaryText }}>
              {response.response}
            </Text>
          ) : null}
          {this.keyValue("Contant", Intl.NumberFormat().format(me?.cash))}
          {this.keyValue("Bank", Intl.NumberFormat().format(me?.bank))}

          {this.renderForm()}
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    height: 40,
    alignItems: "center",
  },
});
export default Bank;
