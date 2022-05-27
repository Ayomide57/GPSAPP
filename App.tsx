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

const App: FC<any> = (props) => {
  const [enabled, setEnabled] = React.useState(true);
  const [region, setRegion] = React.useState({
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const { width, height } = Dimensions.get('window');
  const ASPECT_RATIO = width / height;



  React.useEffect(() => {
    const onLocation:Subscription = BackgroundGeolocation.onLocation((location) => {
    console.log('[onLocation]', location);  
      const latDelta = 0.0922;
      const lngDelta = latDelta * ASPECT_RATIO;
      const region = {
        latitude: location.coords.latitude, 
        longitude: location.coords.longitude,
        latitudeDelta: latDelta,
        longitudeDelta: lngDelta,
      }
      setRegion(region);      
    })

    const onMotionChange:Subscription = BackgroundGeolocation.onMotionChange((event) => {
      console.log('[onMotionChange]', event);
    });

    const onActivityChange:Subscription = BackgroundGeolocation.onActivityChange((event) => {
      console.log('[onMotionChange]', event);
    })

    const onProviderChange:Subscription = BackgroundGeolocation.onProviderChange((event) => {
      console.log('[onProviderChange]', event);
    })

    BackgroundGeolocation.ready({
      desiredAccuracy: BackgroundGeolocation.DESIRED_ACCURACY_HIGH,
      distanceFilter: 10,
      stopTimeout: 5,
      debug: true, 
      logLevel: BackgroundGeolocation.LOG_LEVEL_VERBOSE,
      stopOnTerminate: false,  
      startOnBoot: true,        
      url: 'http://yourserver.com/locations',
      batchSync: false,       
      autoSync: true,  
      headers: {   
        "X-FOO": "bar"
      },
      params: {  
        "auth_token": "maybe_your_server_authenticates_via_token_YES?"
      }
    }).then((state) => {
      setEnabled(state.enabled)
      console.log("- BackgroundGeolocation is configured and ready: ", state.enabled);
    });

    return () => {
      onLocation.remove();
      onMotionChange.remove();
      onActivityChange.remove();
      onProviderChange.remove();
    }
  }, []);

  React.useEffect(() => {
    if (enabled) {
      BackgroundGeolocation.start();
    } else {
      BackgroundGeolocation.stop();
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
