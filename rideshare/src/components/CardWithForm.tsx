"use client"

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabaseClient"; // Import your Supabase client
import { useUser } from "@/lib/hooks/useUser"; // Custom hook to get user information

export function Details() {
  const [startLocation, setStartLocation] = useState('');
  const [endLocation, setEndLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useUser(); // Get the user from the custom hook

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!user) {
      setError("User not logged in.");
      setLoading(false);
      return;
    }

    const { error } = await supabase
      .from('rideshare')
      .insert({
        start_location: startLocation,
        end_location: endLocation,
        user_id: user.id,
      });

    if (error) {
      setError(error.message);
    } else {
      // Optionally, handle success (e.g., clear form, show success message)
    }

    setLoading(false);
  };

  return (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Ride Share</CardTitle>
        <CardDescription>Get your ride in one-click.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          {error && <p className="text-red-500">{error}</p>}
          <div className="grid w-full items-center gap-4">
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
          </div>
          <div className="flex justify-end mt-4">
            <Button type="submit" disabled={loading}>
              {loading ? 'Finding Ride...' : 'Find Ride'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
