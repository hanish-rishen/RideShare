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
import { motion, AnimatePresence } from 'framer-motion';
import { FaCopy } from 'react-icons/fa';

export function Details() {
  const [startLocation, setStartLocation] = useState('');
  const [endLocation, setEndLocation] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locations, setLocations] = useState<{ latitude: number; longitude: number; user_id: string; phone_number: string; start_location: string; end_location: string }[]>([]);
  const [users, setUsers] = useState<{ user_id: string; username: string }[]>([]);
  const [matches, setMatches] = useState<{ user_id: string; latitude: number; longitude: number; phone_number: string; username: string; distance: number }[]>([]);
  const [showForm, setShowForm] = useState(true);
  const [recentLocations, setRecentLocations] = useState<string[]>([]);
  const [isCopied, setIsCopied] = useState(false);
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

    // Introduce a delay of 500 milliseconds before setting loading to false
    setTimeout(() => setLoading(false), 500);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const handleNewRide = () => {
    setShowForm(true);
  };

  const fetchLocations = async () => {
    try {
      const { data: locationsData, error: locationsError } = await supabase
        .from('rideshare')
        .select('latitude, longitude, user_id, phone_number, start_location, end_location, start_time')
        .order('start_time', { ascending: false });

      if (locationsError) {
        console.error("Error fetching locations:", locationsError.message);
        return;
      }

      setLocations(locationsData || []);
    } catch (error) {
      console.error("Error fetching data:", (error as Error).message);
    }
  };

  const fetchUsers = async () => {
    try {
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

  const deleteMatchedPairs = async (user_ids: string[]) => {
    try {
      const { error } = await supabase
        .from('rideshare')
        .delete()
        .in('user_id', user_ids);

      if (error) {
        console.error("Error deleting matched pairs:", error.message);
      }
    } catch (error) {
      console.error("Error deleting matched pairs:", (error as Error).message);
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

    const { latitude, longitude, start_location: currentUserStartLocation, end_location: currentUserEndLocation } = currentUserLocation;

    const nearbyUsers = locations
      .filter(location => location.user_id !== user.id)
      .map(location => {
        const distance = getDistance(latitude, longitude, location.latitude, location.longitude);
        return {
          ...location,
          distance: distance
        };
      })
      .filter(user => user.distance <= thresholdDistance && user.start_location === currentUserEndLocation);

    const matchesWithUsernames = nearbyUsers.map(user => {
      const matchedUser = users.find(u => u.user_id === user.user_id);
      return {
        ...user,
        username: matchedUser?.username || 'Unknown'
      };
    });

    if (matchesWithUsernames.length > 0) {
      const nearestUser = matchesWithUsernames.reduce((nearest, user) => {
        return user.distance < nearest.distance ? user : nearest;
      }, matchesWithUsernames[0]);

      deleteMatchedPairs([user.id, nearestUser.user_id]); // Delete both current user and matched user
      setMatches([nearestUser]);
    } else {
      setMatches([]);
    }
  };

  const updateRecentLocations = (location: string) => {
    setRecentLocations(prevLocations => {
      const updatedLocations = [location, ...prevLocations.filter(loc => loc !== location)];
      if (updatedLocations.length > 5) updatedLocations.pop();
      return updatedLocations;
    });
  };

  useEffect(() => {
    if (!showForm) {
      fetchLocations();
      fetchUsers(); // Fetch users after hiding the form
    }
  }, [showForm]);

  useEffect(() => {
    if (!showForm) {
      findMatches();
    }
  }, [locations, users, showForm]);

  const handleCopyPhoneNumber = (phoneNumber: string) => {
    navigator.clipboard.writeText(phoneNumber);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="relative flex items-center justify-center h-screen w-screen px-4 bg-gray-100">
      <Card className="w-full max-w-4xl h-full max-h-[90vh] flex flex-col md:flex-row bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="w-full h-64 md:h-full md:w-1/2 p-1">
          <Map />
        </div>
        <div className="w-full h-full md:w-1/2 p-4 flex flex-col justify-between">
          <div className="flex-grow flex flex-col justify-between">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-gray-700">
                {showForm ? 'Enter Ride Details' : 'Nearby Users'}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-grow">
              <AnimatePresence>
                {showForm ? (
                  <motion.form
                    key="form"
                    onSubmit={handleSubmit}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-4"
                  >
                    <div className="space-y-1">
                      <Label htmlFor="startLocation">Start Location</Label>
                      <select
                        id="startLocation"
                        value={startLocation}
                        onChange={(e) => setStartLocation(e.target.value)}
                        className="w-full border rounded-md p-2"
                      >
                        <option value="">Select a start location</option>
                        <option value="Techpark">Techpark</option>
                        <option value="Abode">Abode</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="endLocation">End Location</Label>
                      <select
                        id="endLocation"
                        value={endLocation}
                        onChange={(e) => setEndLocation(e.target.value)}
                        className="w-full border rounded-md p-2"
                      >
                        <option value="">Select an end location</option>
                        <option value="Techpark">Techpark</option>
                        <option value="Abode">Abode</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="phoneNumber">Phone Number</Label>
                      <Input
                        id="phoneNumber"
                        type="text"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                      />
                    </div>
                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600"
                    >
                      {loading ? 'Loading...' : 'Find Ride'}
                    </Button>
                  </motion.form>
                ) : (
                  <motion.div
                    key="matches"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    {matches.length > 0 ? (
                      matches.map(match => (
                        <div key={match.user_id} className="space-y-2">
                          <div className="font-bold text-lg">{match.username}</div>
                          <div>Phone Number: {match.phone_number}</div>
                          <div>
                            Distance: {match.distance.toFixed(2)} km
                          </div>
                          <Button
                            onClick={() => handleCopyPhoneNumber(match.phone_number)}
                            className="flex items-center space-x-2"
                          >
                            <FaCopy />
                            <span>Copy Phone Number</span>
                          </Button>
                          {isCopied && <span className="text-green-500">Copied!</span>}
                        </div>
                      ))
                    ) : (
                      <div className="text-gray-500">No matches found.</div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </div>
          <div className="mt-4 flex flex-col space-y-2">
            {!showForm && (
              <Button
                onClick={handleNewRide}
                className="bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600"
              >
                Add New Ride
              </Button>
            )}
            <Button
              onClick={handleLogout}
              className="bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-600"
            >
              Logout
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
