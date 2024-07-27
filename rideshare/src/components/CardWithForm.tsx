"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabaseClient";
import { useUser } from "@/lib/hooks/useUser";
import { useRouter } from 'next/navigation';
import Map from "@/components/Map";

export function Details() {
  const [startLocation, setStartLocation] = useState('');
  const [endLocation, setEndLocation] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locations, setLocations] = useState<{ latitude: number; longitude: number; user_id: string }[]>([]);
  const [users, setUsers] = useState<{ user_id: string; username: string }[]>([]);
  const [matches, setMatches] = useState<{ user_id: string; latitude: number; longitude: number; username: string; distance: number }[]>([]);
  const [showForm, setShowForm] = useState(true); // State to control form display
  const [recentLocations, setRecentLocations] = useState<string[]>([]); // State to store recent locations
  const [filteredLocations, setFilteredLocations] = useState<string[]>([]); // State to store filtered suggestions
  const { user } = useUser();
  const router = useRouter();

  const getCurrentLocation = (): Promise<GeolocationCoordinates> => {
    return new Promise((resolve, reject) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => resolve(position.coords),
          (error) => reject(error)
        );
      } else {
        reject(new Error("Geolocation is not supported by this browser."));
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!user) {
      setError("User not logged in.");
      setLoading(false);
      return;
    }

    try {
      const coords = await getCurrentLocation();
      const { latitude, longitude } = coords;

      const { error } = await supabase
        .from('rideshare')
        .insert({
          start_location: startLocation,
          end_location: endLocation,
          user_id: user.id,
          latitude: latitude,
          longitude: longitude,
          phone_number: phoneNumber,
        });

      if (error) {
        setError(error.message);
      } else {
        fetchLocations(); // Fetch locations after successful insertion
        setShowForm(false); // Hide the form after successful submission
        updateRecentLocations(startLocation);
        updateRecentLocations(endLocation);
      }
    } catch (error) {
      setError((error as Error).message);
    }

    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const fetchLocations = async () => {
    try {
      // Fetch locations from rideshare table
      const { data: locationsData, error: locationsError } = await supabase
        .from('rideshare')
        .select('latitude, longitude, user_id, start_time')
        .order('start_time', { ascending: false });

      if (locationsError) {
        console.error("Error fetching locations:", locationsError.message);
        return;
      }

      setLocations(locationsData || []);

      // Fetch usernames from users table
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('user_id, username');

      if (usersError) {
        console.error("Error fetching users:", usersError.message);
        return;
      }

      setUsers(usersData || []);

      // Find matches after fetching locations and users
      findMatches(locationsData || [], usersData || []);
    } catch (error) {
      console.error("Error fetching data:", (error as Error).message);
    }
  };

  const findMatches = (locations: { latitude: number; longitude: number; user_id: string }[], users: { user_id: string; username: string }[]) => {
    if (!user) return;

    const R = 6371; // Radius of the Earth in kilometers
    const thresholdDistance = 5; // Threshold distance in kilometers

    const toRad = (value: number) => value * Math.PI / 180;

    const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
      const dLat = toRad(lat2 - lat1);
      const dLon = toRad(lon2 - lon1);
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c; // Distance in kilometers
    };

    const currentUserLocation = locations.find(location => location.user_id === user.id);

    if (!currentUserLocation) return;

    const { latitude, longitude } = currentUserLocation;

    console.log(`Current user location: (${latitude}, ${longitude})`);

    // Find nearby users and include their usernames and distances
    const nearbyUsers = locations.filter(location => {
      if (location.user_id === user.id) return false;
      const distance = getDistance(latitude, longitude, location.latitude, location.longitude);
      console.log(`Distance to user ${location.user_id}: ${distance} km`);
      return distance <= thresholdDistance;
    }).map(location => {
      const user = users.find(user => user.user_id === location.user_id);
      const distance = getDistance(latitude, longitude, location.latitude, location.longitude);
      return {
        ...location,
        username: user?.username || 'Unknown',
        distance: distance // Include the distance in the results
      };
    });

    console.log("Nearby users:", nearbyUsers);
    setMatches(nearbyUsers);
  };

  const updateRecentLocations = (location: string) => {
    setRecentLocations(prevLocations => {
      const updatedLocations = [location, ...prevLocations.filter(loc => loc !== location)];
      if (updatedLocations.length > 5) updatedLocations.pop(); // Keep the last 5 locations
      return updatedLocations;
    });
  };

  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>, setLocation: React.Dispatch<React.SetStateAction<string>>) => {
    const value = e.target.value;
    setLocation(value);
    setFilteredLocations(recentLocations.filter(loc => loc.toLowerCase().includes(value.toLowerCase())));
  };

  const handleSuggestionClick = (suggestion: string, setLocation: React.Dispatch<React.SetStateAction<string>>) => {
    setLocation(suggestion);
    setFilteredLocations([]);
  };

  useEffect(() => {
    if (!showForm) {
      fetchLocations();
    }
  }, [showForm]);

  return (
    <div className="relative flex items-center justify-center h-screen w-screen px-4 bg-gray-100">
      <Card className="w-full max-w-4xl h-full max-h-[90vh] flex flex-col md:flex-row bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="w-full h-64 md:h-full md:w-1/2 p-1">
          <Map />
        </div>
        <div className="w-full h-full md:w-1/2 p-4 flex flex-col justify-between">
          <div className="flex-grow flex flex-col justify-between">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-gray-800">RideShare</CardTitle>
              <CardDescription className="text-gray-600">Get your ride in one-click.</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col justify-between">
              {showForm ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && <p className="text-red-500">{error}</p>}
                  <div className="relative flex flex-col space-y-1.5">
                    <Label htmlFor="start_location" className="text-gray-700">Start Location</Label>
                    <Input
                      id="start_location"
                      placeholder="Your Location"
                      value={startLocation}
                      onChange={(e) => handleLocationChange(e, setStartLocation)}
                      required
                    />
                    {filteredLocations.length > 0 && (
                      <ul className="absolute z-10 bg-white border border-gray-300 mt-1 rounded-lg shadow-lg max-h-40 overflow-auto w-full">
                        {filteredLocations.map((location, index) => (
                          <li
                            key={index}
                            className="p-2 cursor-pointer hover:bg-gray-200"
                            onClick={() => handleSuggestionClick(location, setStartLocation)}
                          >
                            {location}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div className="relative flex flex-col space-y-1.5">
                    <Label htmlFor="end_location" className="text-gray-700">End Location</Label>
                    <Input
                      id="end_location"
                      placeholder="Destination"
                      value={endLocation}
                      onChange={(e) => handleLocationChange(e, setEndLocation)}
                      required
                    />
                    {filteredLocations.length > 0 && (
                      <ul className="absolute z-10 bg-white border border-gray-300 mt-1 rounded-lg shadow-lg max-h-40 overflow-auto w-full">
                        {filteredLocations.map((location, index) => (
                          <li
                            key={index}
                            className="p-2 cursor-pointer hover:bg-gray-200"
                            onClick={() => handleSuggestionClick(location, setEndLocation)}
                          >
                            {location}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div className="relative flex flex-col space-y-1.5">
                    <Label htmlFor="phone_number" className="text-gray-700">Phone Number</Label>
                    <Input
                      id="phone_number"
                      placeholder="Your Phone Number"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      required
                    />
                  </div>
                  <div className="flex space-x-4">
                    <Button type="submit" disabled={loading} className="text-white">
                      {loading ? 'Submitting...' : 'Find Ride'}
                    </Button>
                    <Button onClick={handleLogout} className="bg-red-500 text-white">
                      Logout
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="flex-grow overflow-auto">
                  {matches.length > 0 ? (
                    <ul className="divide-y divide-gray-200">
                      {matches.map((match, index) => (
                        <li key={index} className="py-4 px-2 flex justify-between items-center text-sm md:text-base">
                          <div className="flex flex-col">
                            <span className="font-semibold">{match.username}</span>
                            <span>{match.latitude}, {match.longitude}</span>
                            <span>{match.distance.toFixed(2)} km</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-600">No nearby rides found.</p>
                  )}
                </div>
              )}
            </CardContent>
          </div>
        </div>
      </Card>
    </div>
  );
}
