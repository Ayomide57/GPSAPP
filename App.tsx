import React, {FC} from 'react';
import {
  View,
  StyleSheet,
  Platform,
  Dimensions,
} from 'react-native';

import BackgroundGeolocation, {
  Location,
  Subscription
} from "react-native-background-geolocation";
import MapView, { Marker } from 'react-native-maps';
import BackgroundFetch from "react-native-background-fetch";
import Geolocation from "react-native-geolocation-service";



const App: FC<any> = (props) => {
  const [enabled, setEnabled] = React.useState(true);
  const [location, setLocation] = React.useState('');
  const [isMoving, setIsMoving] = React.useState(false);
  const [region, setRegion] = React.useState({
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const { width, height } = Dimensions.get('window');
  const ASPECT_RATIO = width / height;

  const regionFrom = (lat, lon, distance) => {
    distance = distance/2
    const circumference = 40075
    const oneDegreeOfLatitudeInMeters = 111.32 * 1000
    const angularDistance = distance/circumference

    const latitudeDelta = distance / oneDegreeOfLatitudeInMeters
    const longitudeDelta = Math.abs(Math.atan2(
            Math.sin(angularDistance)*Math.cos(lat),
            Math.cos(angularDistance) - Math.sin(lat) * Math.sin(lat)))

    return {
        latitude: lat,
        longitude: lon,
        latitudeDelta,
        longitudeDelta,
    }
  }

  /**const getMyLocation  = () => BackgroundGeolocation.getCurrentPosition({
    timeout: 30,          // 30 second timeout to fetch location
    desiredAccuracy: 10,  // Try to fetch a location with an accuracy of `10` meters.
    samples: 3,           // How many location samples to attempt.
    extras: {             // Custom meta-data.
      "route_id": 123
    }
  });**/

  const initBackgroundFetch = async() => {
    BackgroundFetch.configure({
      minimumFetchInterval: 15,
      enableHeadless: true,
      stopOnTerminate: false
    }, async (taskId) => {
      console.log('[BackgroundFetch]', taskId);
      BackgroundFetch.finish(taskId);
    }, (taskId) => {
      console.log('[BackgroundFetch] TIMEOUT:', taskId);
      BackgroundFetch.finish(taskId);
    });
  }




  const onClickGetCurrentPosition = () => {
    BackgroundGeolocation.getCurrentPosition({
      persist: true,
      samples: 1,
      timeout: 30,
      extras: {
        getCurrentPosition: true
      }
    }).then((location:Location) => {
      console.log('[getCurrentPosition] success: ', location);
    }).catch((error:LocationError) => {
      console.warn('[getCurrentPosition] error: ', error);
    });
  }

  /// changePace handler.
  /**const onClickChangePace = () => {
    BackgroundGeolocation.changePace(!isMoving);
    setIsMoving(!isMoving);
  }**/


  React.useEffect(() => {
    /// 1.  Subscribe to events.
    const onLocation:Subscription = BackgroundGeolocation.onLocation((location) => {
      //console.log('[onLocation]', location);  
      const latDelta = 0.0922;
      const lngDelta = latDelta * ASPECT_RATIO;
      const region = {
        latitude: location.coords.latitude, 
        longitude: location.coords.longitude,
        latitudeDelta: latDelta,
        longitudeDelta: lngDelta,
      }
      setLocation(JSON.stringify(location, null, 2));
      setRegion(region);      
    })

    //initBackgroundFetch();
    //onClickGetCurrentPosition();  

    /**Geolocation.getCurrentPosition(
      position => {
        this.setState({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          coordinates: this.state.coordinates.concat({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          })
        });
        console.log('MyCurrentLocation', position.coords.longitude);
      },
      error => {
        //Alert.alert(error.message.toString());
        console.log('geolocation error:', error)
      },
      {
        showLocationDialog: true,
        enableHighAccuracy: true,
        timeout: 20000,
      }
    );**/

    //console.log('MyCurrentLocation', getMyLocation());

    const onMotionChange:Subscription = BackgroundGeolocation.onMotionChange((event) => {
      //console.log('[onMotionChange]', event);
    });

    const onActivityChange:Subscription = BackgroundGeolocation.onActivityChange((event) => {
      //console.log('[onMotionChange]', event);
    })

    const onProviderChange:Subscription = BackgroundGeolocation.onProviderChange((event) => {
      //console.log('[onProviderChange]', event);
    })

    /// 2. ready the plugin.
    BackgroundGeolocation.ready({
      // Geolocation Config
      desiredAccuracy: BackgroundGeolocation.DESIRED_ACCURACY_HIGH,
      distanceFilter: 10,
      // Activity Recognition
      stopTimeout: 5,
      // Application config
      debug: true, // <-- enable this hear sounds for background-geolocation life-cycle.
      logLevel: BackgroundGeolocation.LOG_LEVEL_VERBOSE,
      stopOnTerminate: false,   // <-- Allow the background-service to continue tracking when user closes the app.
      startOnBoot: true,        // <-- Auto start tracking when device is powered-up.
      // HTTP / SQLite config
      url: 'http://yourserver.com/locations',
      batchSync: false,       // <-- [Default: false] Set true to sync locations to server in a single HTTP request.
      autoSync: true,         // <-- [Default: true] Set true to sync each location to server as it arrives.
      headers: {              // <-- Optional HTTP headers
        "X-FOO": "bar"
      },
      params: {               // <-- Optional HTTP params
        "auth_token": "maybe_your_server_authenticates_via_token_YES?"
      }
    }).then((state) => {
      setEnabled(state.enabled)
      console.log("- BackgroundGeolocation is configured and ready: ", state.enabled);
    });

    return () => {
      // Remove BackgroundGeolocation event-subscribers when the View is removed or refreshed
      // during development live-reload.  Without this, event-listeners will accumulate with
      // each refresh during live-reload.
      onLocation.remove();
      onMotionChange.remove();
      onActivityChange.remove();
      onProviderChange.remove();
    }
  }, []);

  /// 3. start / stop BackgroundGeolocation
  React.useEffect(() => {
    if (enabled) {
      BackgroundGeolocation.start();
    } else {
      BackgroundGeolocation.stop();
      setLocation('');
    }
  }, [enabled]);

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        region={region}
        onRegionChangeComplete={(region) => setRegion(region)}
      >
        <Marker
          coordinate={{ 
            latitude : region.latitude, 
            longitude : region.longitude 
          }}
        />
      </MapView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
});

export default App;
