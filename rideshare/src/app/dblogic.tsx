import { supabase } from "@/lib/supabaseClient";

interface Ride {
  id: number;
  user_id: string;
  start_location: string;
  destination_location: string;
  start_time: string; // Assuming start_time is stored as a string in ISO format
}

export async function addReq(start_loc: string, end_loc: string, user_id: string): Promise<void> {
  const start_time = new Date().toISOString(); // Current time as start_time

  const { data, error } = await supabase
    .from('RideShare')
    .insert([
      {
        user_id,
        start_location: start_loc,
        destination_location: end_loc,
        start_time
      }
    ]);

  if (error) {
    console.error('Error adding ride request:', error.message);
    throw error;
  }

  console.log('Ride request added:', data);
  await pair_users(start_loc, end_loc, user_id);
}

async function pair_users(start_loc: string, end_loc: string, user_id: string): Promise<void> {
  try {
    const { data: rides, error } = await supabase
      .from<Ride>('RideShare')
      .select('*');

    if (error) {
      throw new Error(Error fetching rides: ${error.message});
    }

    const currentTime = new Date().toISOString();
    const timeRange = 10 * 60 * 1000; // 10 minutes in milliseconds

    // Filter rides based on start time range
    const timeFilteredRides = rides.filter((ride) => {
      const rideStartTime = new Date(ride.start_time).getTime();
      const currentStartTime = new Date(currentTime).getTime();

      return Math.abs(rideStartTime - currentStartTime) <= timeRange;
    });

    // Filter rides based on matching start and end locations
    const ridePairs: [Ride, Ride][] = [];

    for (let i = 0; i < timeFilteredRides.length; i++) {
      for (let j = i + 1; j < timeFilteredRides.length; j++) {
        if (
          timeFilteredRides[i].start_location === timeFilteredRides[j].destination_location &&
          timeFilteredRides[i].destination_location === timeFilteredRides[j].start_location
        ) {
          ridePairs.push([timeFilteredRides[i], timeFilteredRides[j]]);
        }
      }
    }

    if (ridePairs.length > 0) {
      const bestPair = ridePairs[0]; // Simplified: choosing the first pair for demonstration

      console.log(Matched Ride A: ${JSON.stringify(bestPair[0])});
      console.log(Matched Ride B: ${JSON.stringify(bestPair[1])});

      // Further logic to handle matched rides
      // Example: Update the database or notify users
    } else {
      console.log('No matching rides found within the specified time and location range.');
    }
  } catch (error) {
    console.error(Error finding matching rides: ${error.message});
  }
}

// Example usage:


addReq('LocationA', 'LocationB', 'user123');
