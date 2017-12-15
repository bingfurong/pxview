import React, { Component } from 'react';
import {
  View,
  Platform,
  StatusBar,
  StyleSheet,
  ScrollView,
  Text,
  InteractionManager,
} from 'react-native';
import { connect } from 'react-redux';
import HtmlView from 'react-native-htmlview';
import { connectLocalization } from '../../components/Localization';
import PXHeader from '../../components/PXHeader';
import PXViewPager from '../../components/PXViewPager';
import HeaderTextTitle from '../../components/HeaderTextTitle';
import HeaderSettingsButton from '../../components/HeaderSettingsButton';
import Loader from '../../components/Loader';
import * as novelTextActionCreators from '../../common/actions/novelText';
import * as modalActionCreators from '../../common/actions/modal';
import { makeGetParsedNovelText } from '../../common/selectors';
import { MODAL_TYPES } from '../../common/constants';
import { globalStyles, globalStyleVariables } from '../../styles';

const styles = StyleSheet.create({
  container: {
    width: globalStyleVariables.WINDOW_WIDTH,
    padding: 10,
  },
  novelChapter: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  pageLink: {
    fontWeight: '500',
    color: '#007AFF',
  },
});

class NovelReader extends Component {
  constructor(props) {
    super(props);
    this.state = {
      index: 0,
    };
  }

  componentDidMount() {
    const { fetchNovelText, clearNovelText, novelText, novelId } = this.props;
    if (!novelText || !novelText.text) {
      clearNovelText(novelId);
      InteractionManager.runAfterInteractions(() => {
        fetchNovelText(novelId);
      });
    }
  }

  handleOnViewPagerPageSelected = index => {
    if (this.state.index !== index) {
      this.setState({
        index,
      });
    }
  };

  handleRenderNode = (node, index, siblings, parent, defaultRenderer) => {
    if (node.name === 'chapter') {
      return (
        <Text key={index} style={styles.novelChapter}>
          {defaultRenderer(node.children, parent)}
        </Text>
      );
    } else if (node.name === 'jump') {
      const { page } = node.attribs;
      return (
        <Text
          key={index}
          style={styles.pageLink}
          onPress={() => this.handleOnPressNovelPageLink(page)}
        >
          {defaultRenderer(node.children, parent)}
        </Text>
      );
    }
  };

  handleOnPressNovelPageLink = page => {
    console.log('this.viewpager ', this.viewPager);
    if (this.viewPager) {
      if (Platform.OS === 'android') {
        this.viewPager.setPage(page - 1);
      } else if (Platform.OS === 'ios') {
        this.viewPager.scrollToIndex({
          index: page - 1,
        });
      }
    }
  };

  handleOnPressOpenSettings = () => {
    const { openModal } = this.props;
    openModal(MODAL_TYPES.NOVEL_SETTINGS);
  };

  renderHeaderTitle = () => {
    const { parsedNovelText } = this.props;
    const { index } = this.state;
    return (
      <HeaderTextTitle>
        {`${index + 1}/${parsedNovelText.length}`}
      </HeaderTextTitle>
    );
  };

  renderHeaderRight = () =>
    <View style={styles.headerRightContainer}>
      <HeaderSettingsButton onPress={this.handleOnPressOpenSettings} />
    </View>;

  renderContent = ({ item, index }) => {
    const { novelId, novelSettings: { fontSize, lineHeight } } = this.props;
    // render text by chunks to prevent over text limit https://github.com/facebook/react-native/issues/15663
    return (
      <View
        key={`${novelId}-${index}-${fontSize}-${lineHeight}`}
        style={styles.container}
      >
        <ScrollView>
          {item.match(/.{1,5000}/g).map((t, i) =>
            <HtmlView
              key={`${novelId}-${index}-${i}`}
              value={t}
              renderNode={this.handleRenderNode}
              textComponentProps={{
                style: {
                  fontSize,
                  lineHeight: fontSize * lineHeight,
                },
              }}
            />,
          )}
          <View style={{ marginBottom: 50 }} />
        </ScrollView>
      </View>
    );
  };

  render() {
    const { novelId, novelText, parsedNovelText } = this.props;
    const { index } = this.state;
    console.log('novel ', novelId, parsedNovelText, novelText, index);
    return (
      <View style={globalStyles.container}>
        <PXHeader
          darkTheme
          showBackButton
          headerTitle={parsedNovelText && this.renderHeaderTitle()}
          headerRight={this.renderHeaderRight()}
        />
        {(!novelText || (!novelText.loaded || novelText.loading)) && <Loader />}
        {parsedNovelText &&
          <PXViewPager
            viewPagerRef={ref => (this.viewPager = ref)}
            items={parsedNovelText}
            keyExtractor={(item, i) => `${novelId}-${i}`}
            index={index}
            renderContent={this.renderContent}
            onPageSelected={this.handleOnViewPagerPageSelected}
          />}
      </View>
    );
  }
}

export default connectLocalization(
  connect(
    () => {
      const getParsedNovelText = makeGetParsedNovelText();
      return (state, props) => {
        const { novelText, novelSettings } = state;
        const parsedNovelText = getParsedNovelText(state, props);
        const novelId = props.novelId || props.navigation.state.params.novelId;
        return {
          novelText: novelText[novelId],
          novelId,
          parsedNovelText,
          novelSettings,
        };
      };
    },
    { ...novelTextActionCreators, ...modalActionCreators },
  )(NovelReader),
);
