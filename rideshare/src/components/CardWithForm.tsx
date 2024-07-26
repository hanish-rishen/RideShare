// components/CardWithForm.jsx
import React from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function Details() {
  return (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Ride Share</CardTitle>
        <CardDescription>Get your ride in one-click.</CardDescription>
      </CardHeader>
      <CardContent>
        <form>
          <div className="grid w-full items-center gap-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="name">Start Location</Label>
              <Input id="name" placeholder="Your Location" />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="name">Destination</Label>
              <Input id="name" placeholder="End Location" />
            </div>
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button>Find Ride</Button>
      </CardFooter>
    </Card>
  );
}
