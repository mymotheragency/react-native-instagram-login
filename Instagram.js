
import React, { Component } from 'react'
import PropTypes from 'prop-types'
import {
  StyleSheet,
  View,
  WebView,
  Alert,
  Modal,
  Dimensions,
  Image,
  TouchableOpacity,
  KeyboardAvoidingView
} from 'react-native'
import qs from 'qs'

const { width, height } = Dimensions.get('window')

export default class Instagram extends Component {
  constructor(props) {
    super(props)
    this.state = { modalVisible: false }
  }

  show() {
    this.setState({ modalVisible: true })
  }

  hide() {
    this.setState({ modalVisible: false })
  }

  _onNavigationStateChange(webViewState) {
    const { url } = webViewState
    if (url && url.startsWith(this.props.redirectUrl)) {
      const match = url.match(/(#|\?)(.*)/)
      const results = qs.parse(match[2])
      this.hide()
      if (results.access_token) {
        // Keeping this to keep it backwards compatible, but also returning raw results to account for future changes.
        this.props.onLoginSuccess(results.access_token, results)
      } else {
        this.props.onLoginFailure(results)
      }
    }
  }

  _onMessage(reactMessage) {
    try {
      const object = reactMessage.nativeEvent.data
      const { json, height } = JSON.parse(reactMessage.nativeEvent.data)
      if (height > 0) {
        this.setState({ webViewHeight: height })
      }
      if (json && json.error_type) {
        this.hide()
        this.props.onLoginFailure(json)
      }
    } catch (error) {
      console.log("Error:", error)
    }
  }

  _onLoadEnd() {
    const scriptToPostBody = `window.postMessage(JSON.stringify({height:document.body.scrollHeight, json:document.body.innerText}), '*')`;
    this.webView.injectJavaScript(scriptToPostBody);
  }

  render() {
    const { clientId, redirectUrl, scopes } = this.props
    const { webViewHeight } = this.state
    const webViewStyle = { height: webViewHeight || 0 }
    return (
      <Modal
        animationType={'slide'}
        visible={this.state.modalVisible}
        onRequestClose={this.hide.bind(this)}
        transparent
      >
        <View style={[styles.modalWarp, this.props.styles.modalWarp]}>
          <KeyboardAvoidingView behavior='padding' style={[styles.keyboardStyle, this.props.styles.keyboardStyle]}>
            <View style={[styles.contentWarp, this.props.styles.contentWarp, webViewStyle]}>
              <WebView
                style={[styles.webView, this.props.styles.webView]}
                source={{ uri: `https://api.instagram.com/oauth/authorize/?client_id=${clientId}&redirect_uri=${redirectUrl}&response_type=token&scope=${scopes.join('+')}` }}
                scalesPageToFit
                startInLoadingState
                onNavigationStateChange={this._onNavigationStateChange.bind(this)}
                onError={this._onNavigationStateChange.bind(this)}
                onLoadEnd={this._onLoadEnd.bind(this)}
                onMessage={this._onMessage.bind(this)}
                ref={(webView) => { this.webView = webView }}
              />
              {webViewHeight && <TouchableOpacity onPress={this.hide.bind(this)} style={[styles.btnStyle, this.props.styles.btnStyle]}>
                <Image source={require('./close.png')} style={[styles.closeStyle, this.props.styles.closeStyle]} />
              </TouchableOpacity>}
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

    )
  }
}
const propTypes = {
  clientId: PropTypes.string.isRequired,
  redirectUrl: PropTypes.string,
  styles: PropTypes.object,
  scopes: PropTypes.array,
  onLoginSuccess: PropTypes.func,
  modalVisible: PropTypes.bool,
  onLoginFailure: PropTypes.func
}

const defaultProps = {
  redirectUrl: 'https://google.com',
  styles: {},
  scopes: ['public_content'],
  onLoginSuccess: (token) => {
    Alert.alert(
      'Alert Title',
      'Token: ' + token,
      [
        { text: 'OK' }
      ],
      { cancelable: false }
    )
  },
  onLoginFailure: (failureJson) => {
    console.debug(failureJson)
  }
}

Instagram.propTypes = propTypes
Instagram.defaultProps = defaultProps

const styles = StyleSheet.create({
  modalWarp: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)'
  },
  keyboardStyle: {
    flex: 1,
    paddingTop: 30,
    justifyContent: "center",
  },
  contentWarp: {
    backgroundColor: '#fff',
    alignSelf: 'center',
    width: width - 30,
    height: height - 80
  },
  webView: {
    flex: 1,
  },
  btnStyle: {
    width: 30,
    height: 30,
    position: 'absolute',
    top: 5,
    right: 5
  },
  closeStyle: {
    width: 30, height: 30
  }
})
