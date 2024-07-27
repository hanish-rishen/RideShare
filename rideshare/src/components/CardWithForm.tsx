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
  const [showForm, setShowForm] = useState(true);
  const [recentLocations, setRecentLocations] = useState<string[]>([]);
  const [filteredLocations, setFilteredLocations] = useState<string[]>([]);
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
        updateRecentLocations(startLocation);
        updateRecentLocations(endLocation);
        setShowForm(false);
      }
    } catch (error) {
      setError((error as Error).message);
    }

    // Introduce a delay of 2.5 seconds before setting loading to false
    setTimeout(() => setLoading(false), 500);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const fetchLocations = async () => {
    try {
      const { data: locationsData, error: locationsError } = await supabase
        .from('rideshare')
        .select('latitude, longitude, user_id, start_time')
        .order('start_time', { ascending: false });

      if (locationsError) {
        console.error("Error fetching locations:", locationsError.message);
        return;
      }

      setLocations(locationsData || []);

      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('user_id, username');

      if (usersError) {
        console.error("Error fetching users:", usersError.message);
        return;
      }

      setUsers(usersData || []);
    } catch (error) {
      console.error("Error fetching data:", (error as Error).message);
    }
  };

  const findMatches = () => {
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

    const nearbyUsers = locations.filter(location => {
      if (location.user_id === user.id) return false;
      const distance = getDistance(latitude, longitude, location.latitude, location.longitude);
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

    setMatches(nearbyUsers);
  };

  const updateRecentLocations = (location: string) => {
    setRecentLocations(prevLocations => {
      const updatedLocations = [location, ...prevLocations.filter(loc => loc !== location)];
      if (updatedLocations.length > 5) updatedLocations.pop();
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

  useEffect(() => {
    if (!showForm) {
      findMatches();
    }
  }, [locations, users, showForm]);

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
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-600">Loading...</p>
                </div>
              ) : showForm ? (
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
                      type="tel"
                      placeholder="Your phone number"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" disabled={loading} className="w-full">Find Ride</Button>
                </form>
              ) : (
                <>
                  {matches.length > 0 ? (
                    <div className="space-y-4">
                      {matches.map((match, index) => (
                        <Card key={index} className="p-4 bg-gray-200 border border-gray-300 rounded-md shadow-md">
                          <CardHeader>
                            <CardTitle className="text-lg font-bold text-gray-800">{match.username}</CardTitle>
                            <CardDescription className="text-gray-600">Distance: {match.distance.toFixed(2)} km</CardDescription>
                          </CardHeader>
                        </Card>
                      ))}
                      <Button className="w-full mt-4" onClick={() => setShowForm(true)}>New Ride</Button>
                    </div>
                  ) : (
                    <p className="text-gray-600">No nearby rides found.</p>
                  )}
                </>
              )}
            </CardContent>
            <Button onClick={handleLogout} className="mt-4">Logout</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
