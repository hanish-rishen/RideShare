// lib/mapboxClient.js
import mbxGeocoding from '@mapbox/mapbox-sdk/services/geocoding';

const geocodingClient = mbxGeocoding({ accessToken: 'YOUR_MAPBOX_ACCESS_TOKEN' });

export default geocodingClient;
