/* eslint-disable react-native/no-inline-styles */
import { useCallback, useRef } from 'react';
import {
  Image,
  StyleSheet,
  Text,
  View,
  type ImageSourcePropType,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AntDesign } from '@expo/vector-icons';
import {
  Swiper,
  type SwiperCardRefType,
  type SwiperRestoredSwipe,
} from '@psync/rn-swiper';
import { ActionButton } from './components';

const IMAGES: ImageSourcePropType[] = [
  require('../assets/images/1.jpg'),
  require('../assets/images/2.jpg'),
  require('../assets/images/3.jpg'),
  require('../assets/images/4.jpg'),
  require('../assets/images/5.jpg'),
  require('../assets/images/6.jpg'),
];

const ICON_SIZE = 24;

// Cards 0-2 were swiped in a previous session; start on card 3.
const RESTORED_SWIPES: SwiperRestoredSwipe[] = [
  { index: 0, direction: 'right' },
  { index: 1, direction: 'left' },
  { index: 2, direction: 'top' },
];

// Module-level handlers keep the Swiper props referentially stable.
const onIndexChange = (index: number) =>
  console.log('Current Active index', index);
const onSwipeRight = (cardIndex: number) => console.log('cardIndex', cardIndex);
const onSwipeLeft = (cardIndex: number) =>
  console.log('onSwipeLeft', cardIndex);
const onSwipeTop = (cardIndex: number) => console.log('onSwipeTop', cardIndex);
const onSwipeBottom = (cardIndex: number) =>
  console.log('onSwipeBottom', cardIndex);
const onPress = () => console.log('onPress');
const onSwipedAll = () => console.log('onSwipedAll');
const onSwipeActive = () => console.log('onSwipeActive');
const onSwipeStart = () => console.log('onSwipeStart');
const onSwipeEnd = () => console.log('onSwipeEnd');

const App = () => {
  const ref = useRef<SwiperCardRefType>(null);

  const renderCard = useCallback((image: ImageSourcePropType) => {
    return (
      <View style={styles.renderCardContainer}>
        <Image
          source={image}
          style={styles.renderCardImage}
          resizeMode="cover"
        />
      </View>
    );
  }, []);
  const renderFlippedCard = useCallback(
    (_: ImageSourcePropType, index: number) => {
      return (
        <View style={styles.renderFlippedCardContainer}>
          <Text style={styles.text}>Flipped content 🚀 {index}</Text>
        </View>
      );
    },
    []
  );
  const OverlayLabelRight = useCallback(() => {
    return (
      <View
        style={[
          styles.overlayLabelContainer,
          {
            backgroundColor: 'green',
          },
        ]}
      />
    );
  }, []);
  const OverlayLabelLeft = useCallback(() => {
    return (
      <View
        style={[
          styles.overlayLabelContainer,
          {
            backgroundColor: 'red',
          },
        ]}
      />
    );
  }, []);
  const OverlayLabelTop = useCallback(() => {
    return (
      <View
        style={[
          styles.overlayLabelContainer,
          {
            backgroundColor: 'blue',
          },
        ]}
      />
    );
  }, []);
  const OverlayLabelBottom = useCallback(() => {
    return (
      <View
        style={[
          styles.overlayLabelContainer,
          {
            backgroundColor: 'orange',
          },
        ]}
      />
    );
  }, []);

  return (
    <GestureHandlerRootView style={styles.container}>
      <View style={styles.subContainer}>
        <Swiper
          ref={ref}
          data={IMAGES}
          initialIndex={3}
          cardStyle={styles.cardStyle}
          overlayLabelContainerStyle={styles.overlayLabelContainerStyle}
          renderCard={renderCard}
          restoredSwipes={RESTORED_SWIPES}
          onIndexChange={onIndexChange}
          onSwipeRight={onSwipeRight}
          onPress={onPress}
          onSwipedAll={onSwipedAll}
          FlippedContent={renderFlippedCard}
          onSwipeLeft={onSwipeLeft}
          onSwipeTop={onSwipeTop}
          onSwipeBottom={onSwipeBottom}
          OverlayLabelRight={OverlayLabelRight}
          OverlayLabelLeft={OverlayLabelLeft}
          OverlayLabelTop={OverlayLabelTop}
          OverlayLabelBottom={OverlayLabelBottom}
          onSwipeActive={onSwipeActive}
          onSwipeStart={onSwipeStart}
          onSwipeEnd={onSwipeEnd}
        />
      </View>

      <View style={styles.buttonsContainer}>
        <ActionButton
          style={styles.button}
          accessibilityLabel="Flip card"
          onTap={() => {
            ref.current?.flipCard();
          }}
        >
          <AntDesign name="sync" size={ICON_SIZE} color="white" />
        </ActionButton>
        <ActionButton
          style={styles.button}
          accessibilityLabel="Undo last swipe"
          onTap={() => {
            ref.current?.swipeBack();
          }}
        >
          <AntDesign name="reload" size={ICON_SIZE} color="white" />
        </ActionButton>
        <ActionButton
          style={styles.button}
          accessibilityLabel="Swipe left"
          onTap={() => {
            ref.current?.swipeLeft();
          }}
        >
          <AntDesign name="close" size={ICON_SIZE} color="white" />
        </ActionButton>
        <ActionButton
          style={styles.button}
          accessibilityLabel="Swipe down"
          onTap={() => {
            ref.current?.swipeBottom();
          }}
        >
          <AntDesign name="arrow-down" size={ICON_SIZE} color="white" />
        </ActionButton>
        <ActionButton
          style={styles.button}
          accessibilityLabel="Swipe up"
          onTap={() => {
            ref.current?.swipeTop();
          }}
        >
          <AntDesign name="arrow-up" size={ICON_SIZE} color="white" />
        </ActionButton>
        <ActionButton
          style={styles.button}
          accessibilityLabel="Swipe right"
          onTap={() => {
            ref.current?.swipeRight();
          }}
        >
          <AntDesign name="heart" size={ICON_SIZE} color="white" />
        </ActionButton>
      </View>
    </GestureHandlerRootView>
  );
};

export default App;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonsContainer: {
    flexDirection: 'row',
    bottom: 34,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  button: {
    height: 50,
    borderRadius: 40,
    aspectRatio: 1,
    backgroundColor: '#3A3D45',
    elevation: 4,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: 'black',
    shadowOpacity: 0.1,
    shadowOffset: {
      width: 0,
      height: 4,
    },
  },
  renderCardContainer: {
    borderRadius: 15,
    width: '100%',
    height: '100%',
  },
  renderFlippedCardContainer: {
    borderRadius: 15,
    backgroundColor: '#baeee5',
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  cardStyle: {
    width: '90%',
    height: '90%',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  renderCardImage: {
    height: '100%',
    width: '100%',
    borderRadius: 15,
  },
  subContainer: {
    // Stretch so the absolutely positioned cards get a non-zero width
    alignSelf: 'stretch',
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayLabelContainer: {
    borderRadius: 15,
    height: '90%',
    width: '90%',
  },
  text: {
    color: '#001a72',
  },
  overlayLabelContainerStyle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
