"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabaseClient";
import { useUser } from "@/lib/hooks/useUser";
import Map from "@/components/Map";

export function Details() {
  const [startLocation, setStartLocation] = useState('');
  const [endLocation, setEndLocation] = useState('');
  const [phoneNumber, setPhoneNumber] = useState(''); // Add state for phone number
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useUser();

  // Function to get current geolocation
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
          phone_number: phoneNumber, // Add phone number to the insert
        });

      if (error) {
        setError(error.message);
      } else {
        // Optionally, handle success (e.g., clear form, show success message)
      }
    } catch (error) {
      setError((error as Error).message);
    }

    setLoading(false);
  };

  return (
    <div className="relative flex items-center justify-center h-screen w-screen px-4">
      <iframe
        src="https://lottie.host/embed/d997ffb3-e906-495e-9669-c3da4041e23b/LxBNuJf5AE.json"
        className="absolute inset-0 w-full h-full"
        style={{ zIndex: -1 }}
        frameBorder="0"
      ></iframe>
      <Card className="w-full max-w-4xl h-full max-h-[90vh] flex flex-col md:flex-row bg-opacity-80 bg-white backdrop-blur-sm">
        <div className="w-full h-64 md:h-full md:w-1/2 p-1">
          <Map />
        </div>
        <div className="w-full h-full md:w-1/2 p-4 flex items-center justify-center">
          <div className="w-full h-full flex flex-col justify-center">
            <CardHeader>
              <CardTitle>Ride Share</CardTitle>
              <CardDescription>Get your ride in one-click.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col justify-between">
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && <p className="text-red-500">{error}</p>}
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="start_location">Start Location</Label>
                  <Input
                    id="start_location"
                    placeholder="Your Location"
                    value={startLocation}
                    onChange={(e) => setStartLocation(e.target.value)}
                    required
                  />
                </div>
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="end_location">Destination</Label>
                  <Input
                    id="end_location"
                    placeholder="End Location"
                    value={endLocation}
                    onChange={(e) => setEndLocation(e.target.value)}
                    required
                  />
                </div>
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="phone_number">Phone Number</Label>
                  <Input
                    id="phone_number"
                    placeholder="Your Phone Number"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    required
                  />
                </div>
                <div className="flex justify-end">
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Finding Ride...' : 'Find Ride'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </div>
        </div>
      </Card>
    </div>
  );
}
