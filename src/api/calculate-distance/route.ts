import { NextApiRequest, NextApiResponse } from 'next';
import { Client } from '@googlemaps/google-maps-services-js';

const client = new Client({});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { origin, destination } = req.body;

  try {
    const response = await client.distancematrix({
      params: {
        origins: [origin],
        destinations: [destination],
        key: process.env.GOOGLE_MAPS_API_KEY!,
      },
    });

    const distance = response.data.rows[0].elements[0].distance.value / 1609.34; // Convert meters to miles
    
    res.status(200).json({ distance });
  } catch (error) {
    console.error('Error calculating distance:', error);
    res.status(500).json({ message: 'Error calculating distance' });
  }
}