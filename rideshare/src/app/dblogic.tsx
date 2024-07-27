import { supabase } from "@/lib/supabaseClient";
import { UUID } from "crypto";

interface Ride {
  id: UUID;
  user_id: string;
  start_location: string;
  destination_location: string;
  start_time: string; // Assuming start_time is stored as a string in ISO format
}

async function pair_users(): Promise<void> {
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

    // Create a map to store rides based on start and destination locations for efficient matching
    const rideMap = new Map<string, Ride[]>();

    timeFilteredRides.forEach((ride) => {
      const key = ${ride.start_location}->${ride.destination_location};
      if (!rideMap.has(key)) {
        rideMap.set(key, []);
      }
      rideMap.get(key)!.push(ride);
    });

    const ridePairs: [Ride, Ride][] = [];

    rideMap.forEach((rides, key) => {
      const [start_location, destination_location] = key.split('->');
      const reverseKey = ${destination_location}->${start_location};

      if (rideMap.has(reverseKey)) {
        const reverseRides = rideMap.get(reverseKey)!;

        for (const rideA of rides) {
          for (const rideB of reverseRides) {
            if (
              rideA.user_id !== rideB.user_id &&
              Math.abs(new Date(rideA.start_time).getTime() - new Date(rideB.start_time).getTime()) <= timeRange
            ) {
              ridePairs.push([rideA, rideB]);
              rideMap.delete(key);
              rideMap.delete(reverseKey);
              break;
            }
          }
        }
      }
    });

    if (ridePairs.length > 0) {
      ridePairs.forEach(([rideA, rideB]) => {
        console.log(Matched Ride A: ${JSON.stringify(rideA)});
        console.log(Matched Ride B: ${JSON.stringify(rideB)});

        // Notify users
        notify_users(rideA, rideB);
      });
    } else {
      console.log('No matching rides found within the specified time and location range.');
    }
  } catch (error) {
    console.error(Error finding matching rides: ${error.message});
  }
}

async function notify_users(rideA: Ride, rideB: Ride): Promise<void> {
  try {
    // Example notification logic
    const messageA = You have been matched with another rider. Ride details: ${JSON.stringify(rideB)};
    const messageB = You have been matched with another rider. Ride details: ${JSON.stringify(rideA)};

    // Simulating notification sending
    console.log(Notifying user ${rideA.user_id}: ${messageA});
    console.log(Notifying user ${rideB.user_id}: ${messageB});

    // Update ride status in the database (example)
    await supabase
      .from('RideShare')
      .update({ status: 'matched' })
      .in('id', [rideA.id, rideB.id]);

  } catch (error) {
    console.error(Error notifying users: ${error.message});
  }
}

// Example usage:
pair_users();