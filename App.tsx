import React from 'react';
import {
  Button,
  SafeAreaView,
  ScrollView,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import {Colors} from 'react-native/Libraries/NewAppScreen';
import {useGeolocation} from './src/hooks/useGeolocation';

function App(): JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';

  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
  };

  const {
    errorMessage,
    locationPermissionGranted,
    mostAccuratePositionSample,
    status,
    startSampling,
    stopSampling,
  } = useGeolocation();

  const handleStart = () => {
    startSampling(1000, 5, 10);
  };

  return (
    <SafeAreaView style={backgroundStyle}>
      {locationPermissionGranted ? (
        <View>
          {(status === 'idle' || status === 'error') && (
            <Button onPress={handleStart} title="Start position watcher" />
          )}
          {status === 'sampling' && (
            <Button onPress={stopSampling} title="Stop" />
          )}
          <ScrollView
            contentInsetAdjustmentBehavior="automatic"
            style={backgroundStyle}>
            <View
              style={{
                backgroundColor: isDarkMode ? Colors.black : Colors.white,
              }}>
              <Text>
                {JSON.stringify(mostAccuratePositionSample, undefined, ' ')}
              </Text>
            </View>
            {!!errorMessage && (
              <View>
                <Text style={{color: Colors.red}}>{errorMessage}</Text>
              </View>
            )}
          </ScrollView>
        </View>
      ) : (
        <View>
          <Text style={{color: Colors.red}}>
            Location permission must be granted!
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

export default App;
