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
  const [locations, setLocations] = useState<{ latitude: number; longitude: number; user_id: string; phone_number: string }[]>([]);
  const [users, setUsers] = useState<{ user_id: string; username: string }[]>([]);
  const [matches, setMatches] = useState<{ user_id: string; latitude: number; longitude: number; phone_number: string; username: string; distance: number }[]>([]);
  const [showForm, setShowForm] = useState(true);
  const [recentLocations, setRecentLocations] = useState<string[]>([]);
  const [filteredLocations, setFilteredLocations] = useState<string[]>([]);
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
        .select('latitude, longitude, user_id, phone_number, start_time')
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

    const nearbyUsers = locations
      .filter(location => location.user_id !== user.id)
      .map(location => {
        const distance = getDistance(latitude, longitude, location.latitude, location.longitude);
        return {
          ...location,
          distance: distance
        };
      })
      .filter(user => user.distance <= thresholdDistance);

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

  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>, setLocation: React.Dispatch<React.SetStateAction<string>>) => {
    const value = e.target.value;
    setLocation(value);
    setFilteredLocations(recentLocations.filter(loc => loc.toLowerCase().includes(value.toLowerCase())));
  };

  const handleSuggestionClick = (suggestion: string, setLocation: React.Dispatch<React.SetStateAction<string>>) => {
    setLocation(suggestion);
    setFilteredLocations([]);
  };

  const handleCopyPhoneNumber = (phone: string) => {
    navigator.clipboard.writeText(phone)
      .then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000); // Reset copy status after 2 seconds
      })
      .catch((error) => {
        console.error("Failed to copy text:", error);
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
                      <Input
                        id="startLocation"
                        value={startLocation}
                        onChange={(e) => handleLocationChange(e, setStartLocation)}
                        className="w-full"
                        list="recent-start-locations"
                      />
                      <datalist id="recent-start-locations">
                        {filteredLocations.map((loc, index) => (
                          <option key={index} value={loc} />
                        ))}
                      </datalist>
                      <AnimatePresence>
                        {filteredLocations.length > 0 && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="mt-2 bg-white border border-gray-200 rounded-md shadow-lg"
                          >
                            {filteredLocations.map((loc, index) => (
                              <div
                                key={index}
                                onClick={() => handleSuggestionClick(loc, setStartLocation)}
                                className="p-2 cursor-pointer hover:bg-gray-100"
                              >
                                {loc}
                              </div>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="endLocation">End Location</Label>
                      <Input
                        id="endLocation"
                        value={endLocation}
                        onChange={(e) => handleLocationChange(e, setEndLocation)}
                        className="w-full"
                        list="recent-end-locations"
                      />
                      <datalist id="recent-end-locations">
                        {filteredLocations.map((loc, index) => (
                          <option key={index} value={loc} />
                        ))}
                      </datalist>
                      <AnimatePresence>
                        {filteredLocations.length > 0 && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="mt-2 bg-white border border-gray-200 rounded-md shadow-lg"
                          >
                            {filteredLocations.map((loc, index) => (
                              <div
                                key={index}
                                onClick={() => handleSuggestionClick(loc, setEndLocation)}
                                className="p-2 cursor-pointer hover:bg-gray-100"
                              >
                                {loc}
                              </div>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="phoneNumber">Phone Number</Label>
                      <Input
                        id="phoneNumber"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="w-full"
                      />
                    </div>
                    {error && <p className="text-red-500">{error}</p>}
                    <Button type="submit" className="w-full bg-blue-600 text-white py-2 mt-4" disabled={loading}>
                      {loading ? 'Loading...' : 'Find Ride'}
                    </Button>
                  </motion.form>
                ) : (
                  <motion.div
                    key="matches"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-4"
                  >
                    {matches.length > 0 ? (
                      <div className="space-y-2">
                        <p>Here are the nearby users:</p>
                        {matches.map((match, index) => (
                          <div key={index} className="flex items-center justify-between p-2 border border-gray-200 rounded-md">
                            <div>
                              <p className="font-bold">{match.username}</p>
                              <p className="text-sm text-gray-600">{match.phone_number}</p>
                            </div>
                            <Button
                              variant="secondary"
                              onClick={() => handleCopyPhoneNumber(match.phone_number)}
                              className="flex items-center"
                            >
                              <FaCopy className="mr-1" />
                              {isCopied ? 'Copied!' : 'Copy'}
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p>No matches found within 5 kilometers.</p>
                    )}
                    <Button onClick={handleNewRide} className="w-full bg-blue-600 text-white py-2 mt-4">
                      New Ride
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </div>
          <Button onClick={handleLogout} variant="outline" className="mt-4">
            Logout
          </Button>
        </div>
      </Card>
    </div>
  );
}
