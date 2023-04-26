import {useCallback, useEffect, useReducer, useState} from 'react';
import {PermissionsAndroid} from 'react-native';
import Geolocation, {
  GeoError,
  GeoPosition,
} from 'react-native-geolocation-service';

export type GeolocationState = {
  error: GeoError | undefined;
  mostAccuratePositionSample: GeoPosition | undefined;
  positionSamples: GeoPosition[];
  status: 'idle' | 'sampling' | 'error';
  watchId: number | undefined;
};

export type GeolocationAction =
  | {
      type: 'startSampling';
      sampleInterval: number;
      onSuccess: (position: GeoPosition) => void;
      onError: (error: GeoError) => void;
    }
  | {type: 'stopSampling'}
  | {type: 'addSample'; position: GeoPosition}
  | {type: 'setGeoError'; error: GeoError};

export const initialState: GeolocationState = {
  error: undefined,
  mostAccuratePositionSample: undefined,
  positionSamples: [],
  status: 'idle',
  watchId: undefined,
};
export const geolocationReducer = (
  state: GeolocationState,
  action: GeolocationAction,
): GeolocationState => {
  switch (action.type) {
    case 'startSampling':
      // Start the position watcher
      const watchId = Geolocation.watchPosition(
        action.onSuccess,
        action.onError,
        {
          distanceFilter: 0,
          enableHighAccuracy: true,
          fastestInterval: action.sampleInterval,
          interval: action.sampleInterval,
          useSignificantChanges: false,
        },
      );
      return {
        ...state,
        mostAccuratePositionSample: undefined,
        positionSamples: [],
        watchId,
        status: 'sampling',
      };
    case 'stopSampling':
      // Stop the watcher. We're done
      if (typeof state.watchId === 'number') {
        Geolocation.clearWatch(state.watchId);
      }
      Geolocation.stopObserving();
      return {...state, watchId: undefined, status: 'idle'};
    case 'addSample':
      return {
        ...state,
        // Add the new sample to the array
        positionSamples: [...state.positionSamples, action.position],
        // Update mostAccuratePositionSample if the new sample is more accurate than the current
        mostAccuratePositionSample:
          !state.mostAccuratePositionSample ||
          action.position.coords.accuracy <=
            state.mostAccuratePositionSample.coords.accuracy
            ? action.position
            : state.mostAccuratePositionSample,
      };
    case 'setGeoError':
      // Stop the watcher. We're done
      if (typeof state.watchId === 'number') {
        Geolocation.clearWatch(state.watchId);
      }
      Geolocation.stopObserving();
      return {
        ...state,
        error: action.error,
        status: 'error',
        watchId: undefined,
      };
    default:
      return state;
  }
};

export const useGeolocation = () => {
  const [locationPermissionGranted, setLocationPermissionGranted] =
    useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>();
  const [numSamples, setNumSamples] = useState<number>(10);
  const [minimumAccuracy, setMinimumAccuracy] = useState<number>();
  const [{mostAccuratePositionSample, positionSamples, status}, dispatch] =
    useReducer(geolocationReducer, initialState);

  useEffect(() => {
    const getPerm = async (): Promise<boolean> => {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Geolocation Test',
          message:
            'Geolocation Test needs your permission to access your location',
          buttonPositive: 'Grant Access',
        },
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    };
    getPerm()
      .then(result => setLocationPermissionGranted(result))
      .catch(() => setErrorMessage('Unable to request location permission.'));
  }, []);

  const onSuccess = useCallback(
    (position: GeoPosition) => {
      console.log(position);
      dispatch({type: 'addSample', position});
    },
    [dispatch],
  );

  const onError = useCallback(
    (error: GeoError) => {
      dispatch({type: 'setGeoError', error});
      setErrorMessage(
        `Error getting position sample: ${error.message}. Error code: ${error.code}`,
      );
    },
    [dispatch],
  );

  const startSampling = useCallback(
    (
      sampleInterval: number = 1000,
      numberOfSamples: number = 10,
      minAccuracy: number = 20,
    ) => {
      if (locationPermissionGranted) {
        dispatch({
          type: 'startSampling',
          sampleInterval,
          onSuccess,
          onError,
        });
        setNumSamples(numberOfSamples);
        setMinimumAccuracy(minAccuracy);
      }
    },
    [locationPermissionGranted, onError, onSuccess],
  );

  const stopSampling = useCallback(() => {
    dispatch({type: 'stopSampling'});
    console.log(positionSamples);
    console.log(mostAccuratePositionSample);
  }, [mostAccuratePositionSample, positionSamples]);

  useEffect(() => {
    if (
      // If we've reached the desired number of samples
      positionSamples.length === numSamples ||
      // Or, a minimum accuracy has been specified and we have a sample that is at least that accurate
      (minimumAccuracy &&
        mostAccuratePositionSample &&
        mostAccuratePositionSample.coords.accuracy <= minimumAccuracy)
    ) {
      stopSampling();
    }
  }, [
    minimumAccuracy,
    mostAccuratePositionSample,
    numSamples,
    positionSamples,
    stopSampling,
  ]);

  return {
    errorMessage,
    locationPermissionGranted,
    mostAccuratePositionSample,
    positionSamples,
    status,
    startSampling,
    stopSampling,
  };
};
