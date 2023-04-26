import 'react-native';
import {GeoPosition, PositionError} from 'react-native-geolocation-service';
import {geolocationReducer, initialState} from '../../src/hooks/useGeolocation';

import Geolocation from '../__mocks__/react-native-geolocation-service';

describe('geolocationReducer', () => {
  it('updates state in response to actions', () => {
    const onError = jest.fn();
    const onSuccess = jest.fn();
    const sampleInterval = 2000;
    let state = geolocationReducer(initialState, {
      type: 'startSampling',
      onError,
      onSuccess,
      sampleInterval,
    });
    expect(state.error).toBeUndefined();
    expect(state.mostAccuratePositionSample).toBeUndefined();
    expect(state.positionSamples).toEqual([]);
    expect(state.status).toEqual('sampling');
    expect(state.watchId).toEqual(1);

    // Verify watchPosition has been called with the proper args
    expect(Geolocation.watchPosition).toHaveBeenCalledTimes(1);
    expect(Geolocation.watchPosition).lastCalledWith(onSuccess, onError, {
      distanceFilter: 0,
      enableHighAccuracy: true,
      fastestInterval: sampleInterval,
      interval: sampleInterval,
      useSignificantChanges: false,
    });

    // Add a mock position sample with 10 meter accuracy
    const position1: GeoPosition = {
      coords: {
        accuracy: 10,
        altitude: 15,
        altitudeAccuracy: 5,
        heading: 0,
        latitude: 60,
        longitude: 70,
        speed: 0,
      },
      timestamp: 1000,
    };

    // This position should be added to the positionSamples array, and also become the mostAccuratePositionSample
    state = geolocationReducer(state, {type: 'addSample', position: position1});
    expect(state.error).toBeUndefined();
    expect(state.mostAccuratePositionSample).toEqual(position1);
    expect(state.positionSamples).toEqual([position1]);
    expect(state.status).toEqual('sampling');
    expect(state.watchId).toEqual(1);

    // Add a second position sample with 20 meter accuracy
    const position2: GeoPosition = {
      coords: {
        accuracy: 20,
        altitude: 15,
        altitudeAccuracy: 5,
        heading: 0,
        latitude: 60,
        longitude: 70,
        speed: 0,
      },
      timestamp: 2000,
    };

    // This position should be added to the positionSamples array, but should NOT replace position1 as the mostAccuratePositionSample
    state = geolocationReducer(state, {type: 'addSample', position: position2});
    expect(state.error).toBeUndefined();
    expect(state.mostAccuratePositionSample).toEqual(position1);
    expect(state.positionSamples).toEqual([position1, position2]);
    expect(state.status).toEqual('sampling');
    expect(state.watchId).toEqual(1);

    // Add a third position sample with 5 meter accuracy
    const position3: GeoPosition = {
      coords: {
        accuracy: 5,
        altitude: 15,
        altitudeAccuracy: 5,
        heading: 0,
        latitude: 60,
        longitude: 70,
        speed: 0,
      },
      timestamp: 3000,
    };

    // This position should be added to the positionSamples array, and replace position1 as the mostAccuratePositionSample
    state = geolocationReducer(state, {type: 'addSample', position: position3});
    expect(state.error).toBeUndefined();
    expect(state.mostAccuratePositionSample).toEqual(position3);
    expect(state.positionSamples).toEqual([position1, position2, position3]);
    expect(state.status).toEqual('sampling');
    expect(state.watchId).toEqual(1);

    // Add a fourth sample with the same accuracy as the third
    const position4: GeoPosition = {
      coords: {
        accuracy: 5,
        altitude: 15,
        altitudeAccuracy: 5,
        heading: 0,
        latitude: 60,
        longitude: 70,
        speed: 0,
      },
      timestamp: 4000,
    };

    // This position should be added to the positionSamples array, and replace position3 as the mostAccuratePositionSample because it is "newer"
    state = geolocationReducer(state, {type: 'addSample', position: position4});
    expect(state.error).toBeUndefined();
    expect(state.mostAccuratePositionSample).toEqual(position4);
    expect(state.positionSamples).toEqual([
      position1,
      position2,
      position3,
      position4,
    ]);
    expect(state.status).toEqual('sampling');
    expect(state.watchId).toEqual(1);

    // Stop sampling
    state = geolocationReducer(state, {type: 'stopSampling'});
    expect(state.error).toBeUndefined();
    // The position states should still be the same
    expect(state.mostAccuratePositionSample).toEqual(position4);
    expect(state.positionSamples).toEqual([
      position1,
      position2,
      position3,
      position4,
    ]);
    expect(state.status).toEqual('idle');
    expect(state.watchId).toBeUndefined();

    // The clearWatch and stopObserving functions should have been called
    expect(Geolocation.clearWatch).toHaveBeenCalledTimes(1);
    expect(Geolocation.clearWatch).lastCalledWith(1);
    expect(Geolocation.stopObserving).toHaveBeenCalledTimes(1);

    // Simulate starting again
    state = geolocationReducer(state, {
      type: 'startSampling',
      onError,
      onSuccess,
      sampleInterval,
    });
    expect(state.error).toBeUndefined();
    expect(state.mostAccuratePositionSample).toBeUndefined();
    expect(state.positionSamples).toEqual([]);
    expect(state.status).toEqual('sampling');
    expect(state.watchId).toEqual(1);

    // Simulate an error
    const code = 2 as PositionError;
    state = geolocationReducer(state, {
      type: 'setGeoError',
      error: {
        code,
        message: 'Position unavailable',
      },
    });
    // This should set the reducer state to 'error' and save the error
    expect(state.error).toEqual({
      code,
      message: 'Position unavailable',
    });
    expect(state.mostAccuratePositionSample).toBeUndefined();
    expect(state.positionSamples).toEqual([]);
    expect(state.status).toEqual('error');
    expect(state.watchId).toBeUndefined();
  });
});
