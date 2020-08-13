import React, { Component } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  ScrollView,
  View,
} from "react-native";
import Button from "../components/Button";
import T from "../components/T";
import Constants from "../Constants";
const { width } = Dimensions.get("window");
const isSmall = width < 800;
class Shop extends Component {
  state = {
    response: null,
    type: "weapon",
  };
  componentDidMount() {
    this.fetchShop("weapon");
  }

  fetchShop = (type) => {
    const { device } = this.props.screenProps;

    fetch(
      `${Constants.SERVER_ADDR}/shop?token=${device.loginToken}&type=${type}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      }
    )
      .then((response) => response.json())
      .then(async (response) => {
        this.setState({ response, type });
      })
      .catch((error) => {
        console.error(error);
      });
  };

  render() {
    const {
      navigation,
      screenProps: { device },
    } = this.props;

    const { response, type, buy } = this.state;
    /*

*/

    return (
      <ScrollView>
        <View style={{ flexDirection: "row", justifyContent: "space-around" }}>
          <Button
            theme={this.props.screenProps.device.theme}
            title="Wapens"
            onPress={() => this.fetchShop("weapon")}
          />
          <Button
            theme={this.props.screenProps.device.theme}
            title="Bescherming"
            onPress={() => this.fetchShop("protection")}
          />
          <Button
            theme={this.props.screenProps.device.theme}
            title="Vliegtuigen"
            onPress={() => this.fetchShop("airplane")}
          />
          <Button
            theme={this.props.screenProps.device.theme}
            title="Woningen"
            onPress={() => this.fetchShop("home")}
          />
        </View>

        {buy ? (
          <View>
            <T>{buy}</T>
            <Button
              theme={this.props.screenProps.device.theme}
              title="OK"
              onPress={() => this.setState({ buy: null })}
            />
          </View>
        ) : response ? (
          <View>
            <Image
              style={{
                width: isSmall ? width : 400,
                height: 300,
                resizeMode: "contain",
              }}
              source={{
                uri: `${Constants.SERVER_ADDR}/${response?.current?.image}`,
              }}
            />
            <T>Je hebt: {response?.current?.name}</T>

            {response?.next ? (
              <View>
                <Image
                  style={{
                    width: isSmall ? width : 400,
                    height: 300,
                    resizeMode: "contain",
                  }}
                  source={{
                    uri: `${Constants.SERVER_ADDR}/${response?.next?.image}`,
                  }}
                />
                <T>Koop: {response?.next?.name}</T>
                <T>Voor: &euro;{response?.next?.price},-</T>
                <Button
                  theme={this.props.screenProps.device.theme}
                  title="Koop"
                  onPress={() => {
                    fetch(`${Constants.SERVER_ADDR}/buy`, {
                      method: "POST",
                      headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify({
                        loginToken: device.loginToken,
                        type,
                      }),
                    })
                      .then((response) => response.json())
                      .then(async (buy) => {
                        this.setState({ buy: buy.response });
                        this.fetchShop(type);
                        this.props.screenProps.reloadMe(device.loginToken);
                      })
                      .catch((error) => {
                        console.error(error);
                      });
                  }}
                />
              </View>
            ) : null}
          </View>
        ) : (
          <ActivityIndicator />
        )}
      </ScrollView>
    );
  }
}

export default Shop;
