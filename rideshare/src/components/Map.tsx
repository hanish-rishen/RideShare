"use client";

import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';

const MAP_STYLE_URL = 'https://api.maptiler.com/maps/streets/style.json?key=MakFZUKozVFQcAOahegc';

const Map = () => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null); // To ensure map is only initialized once
  const [initialCenter, setInitialCenter] = useState<[number, number] | null>(null);
   
  useEffect(() => {
    // Fetch the current location when the component mounts
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setInitialCenter([longitude, latitude]);
        },
        (error) => {
          console.error("Error fetching location: ", error);
          // Fallback to a default location if geolocation fails
          setInitialCenter([77.1, 20.6]); // Default to India if geolocation fails
        }
      );
    } else {
      // Fallback to a default location if geolocation is not supported
      setInitialCenter([77.1, 20.6]); // Default to India
    }
  }, []);

  
  useEffect(() => {
    if (mapContainerRef.current && !mapRef.current) {
      mapRef.current = new maplibregl.Map({
        container: mapContainerRef.current,
        style: MAP_STYLE_URL,
        center: initialCenter || [77.1, 20.6], // Center on the fetched location or default to India
        zoom: 12, // Adjust zoom level as needed
        attributionControl: false  // Disable the default attribution control
      });

      // Add the geolocate control to the map
      mapRef.current.addControl(
        new maplibregl.GeolocateControl({
          positionOptions: {
            enableHighAccuracy: true
          },
          trackUserLocation: true
        }),
        'top-right'
      );
    } else if (mapRef.current && initialCenter) {
      mapRef.current.setCenter(initialCenter);
    }
  }, [initialCenter]);

  return <div ref={mapContainerRef} className="w-full h-full" />;
};

export default Map;
