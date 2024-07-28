# RideShare

Welcome to RideShare! This project aims to foster a community of students and office workers who share rides within and around a university campus or workplace. By leveraging Supabase for backend services, Next.js for the frontend, and other open-source tools, RideShare provides a platform for users to offer or request rides, significantly reducing travel expenses and environmental impact.

## Use-Cases
## Scenario 1: Transit between Office and Housing Soceity
Raj and Neha both live in Green Meadows and work at Tech Park.
Raj's shift starts at 9 AM, and Neha's ends at 9 AM. Every day, they awkwardly wave at each other as they pass by, thinking, "Why am I paying for a full ride when we could just share?"
With RideShare, Raj and Neha finally solve this daily dilemma. Raj offers a ride to Tech Park, starting from Green Meadows at 8:30 AM. Neha, finishing her night shift at 9 AM, hops onto the same two-wheeler for a ride back to Green Meadows. They split the cost, saving money and time.

## Scenario 2: Transit between College and Housing Soceity
Imagine Rahul and Mukesh, both living in Abode Valley but with opposite schedules. Rahul heads to campus at 12 PM while Mukesh returns home at the same time. Through RideShare, they can pair up, share a rented bike, and split the costs. Rahul brings the bike to campus, and Mukesh takes it back home, saving both time and money. This concept can be applied to popular office spaces and housing areas, making commuting efficient and affordable.

## Features

- **User Authentication**: Secure registration and login using university credentials.
- **Schedule and Route Matching**: Matches drivers with passengers based on similar schedules and destinations.
- **Booking**: Book rides
- **Communication**: Communicate with the Other Person

## Tech Stack

- **Frontend**: Next.js, TypeScript, ShadCN
- **Backend**: Supabase
- **Map**: MapLibre, OpenStreetMaps (for open-source mapping)

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Supabase account and project
- MapLibre API key

### Step 1: Clone the Repository

```
git clone https://github.com/yourusername/rideshare.git
cd rideshare
```


### Step 2: Install Dependencies

## Using npm
```
npm install
```

## Or using yarn
```
yarn install
```

### Step 3: Configure Environment Variables
### Create a .env.local file in the root directory and add the following variables:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_MAPLIBRE_KEY=your_maplibre_key
```

### Replace your_supabase_url, your_supabase_anon_key, and your_maplibre_key with your actual Supabase and MapLibre credentials.
### Step 4: Run the Application
### Using npm
```
npm run dev
```

### Or using yarn
```
yarn dev
```

### The application should now be running on http://localhost:3000.

### License:
### This project is open-source and available under the MIT License.

### Thank you for using RideShare – Sharing rides, saving costs, and building a community.







