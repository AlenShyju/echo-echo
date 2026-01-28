// api/search.js (Edge Function)
export const config = {
  runtime: 'edge',
};

// Mock data for development when API key is not set
const mockVideos = [
  {
    id: 'dQw4w9WgXcQ',
    videoId: 'dQw4w9WgXcQ',
    title: 'Never Gonna Give You Up',
    artist: 'Rick Astley',
    thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg',
    duration: '3:33'
  },
  {
    id: 'JGwWNGJdvx8',
    videoId: 'JGwWNGJdvx8',
    title: 'Shape of You',
    artist: 'Ed Sheeran',
    thumbnail: 'https://i.ytimg.com/vi/JGwWNGJdvx8/mqdefault.jpg',
    duration: '3:54'
  },
  {
    id: 'kJQP7kiw5Fk',
    videoId: 'kJQP7kiw5Fk',
    title: 'Despacito',
    artist: 'Luis Fonsi',
    thumbnail: 'https://i.ytimg.com/vi/kJQP7kiw5Fk/mqdefault.jpg',
    duration: '3:47'
  },
  {
    id: '09R8_2nJtjg',
    videoId: '09R8_2nJtjg',
    title: 'Sugar',
    artist: 'Maroon 5',
    thumbnail: 'https://i.ytimg.com/vi/09R8_2nJtjg/mqdefault.jpg',
    duration: '3:55'
  },
  {
    id: 'OPf0YbXqDm0',
    videoId: 'OPf0YbXqDm0',
    title: 'Uptown Funk',
    artist: 'Mark Ronson ft. Bruno Mars',
    thumbnail: 'https://i.ytimg.com/vi/OPf0YbXqDm0/mqdefault.jpg',
    duration: '4:30'
  },
  {
    id: 'nfs8NYg7yQM',
    videoId: 'nfs8NYg7yQM',
    title: 'Blinding Lights',
    artist: 'The Weeknd',
    thumbnail: 'https://i.ytimg.com/vi/nfs8NYg7yQM/mqdefault.jpg',
    duration: '3:22'
  },
  {
    id: 'k2qgadSvNyU',
    videoId: 'k2qgadSvNyU',
    title: 'Dance Monkey',
    artist: 'Tones and I',
    thumbnail: 'https://i.ytimg.com/vi/k2qgadSvNyU/mqdefault.jpg',
    duration: '3:29'
  },
  {
    id: 'fLexgOxsZu0',
    videoId: 'fLexgOxsZu0',
    title: 'Bad Guy',
    artist: 'Billie Eilish',
    thumbnail: 'https://i.ytimg.com/vi/fLexgOxsZu0/mqdefault.jpg',
    duration: '3:14'
  },
  {
    id: 'TUVcZfQe-Kw',
    videoId: 'TUVcZfQe-Kw',
    title: 'Starboy',
    artist: 'The Weeknd ft. Daft Punk',
    thumbnail: 'https://i.ytimg.com/vi/TUVcZfQe-Kw/mqdefault.jpg',
    duration: '3:50'
  },
  {
    id: 'Djx_5QOiENI',
    videoId: 'Djx_5QOiENI',
    title: 'Memories',
    artist: 'Maroon 5',
    thumbnail: 'https://i.ytimg.com/vi/Djx_5QOiENI/mqdefault.jpg',
    duration: '3:09'
  }
];

function filterMockVideos(query) {
  if (!query) return mockVideos;
  return mockVideos.filter(video => 
    video.title.toLowerCase().includes(query.toLowerCase()) ||
    video.artist.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 10);
}

export default async function handler(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');
  const maxResults = searchParams.get('maxResults') || 10;
  
  const API_KEY = process.env.YOUTUBE_API_KEY;
  
  // If no API key is set, return mock data
  if (!API_KEY) {
    console.log('No API key set, returning mock data');
    const videos = filterMockVideos(query);
    
    return new Response(JSON.stringify(videos), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }
  
  // Handle OPTIONS request for CORS
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }
  
  // Return error if no query
  if (!query) {
    return new Response(JSON.stringify({ error: 'Query parameter is required' }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
  
  try {
    // YouTube API request
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=${maxResults}&q=${encodeURIComponent(query)}+music&type=video&videoCategoryId=10&key=${API_KEY}`,
      {
        cf: {
          cacheTtl: 3600,
          cacheEverything: true,
        },
      }
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('YouTube API error:', response.status, errorText);
      
      // Fallback to mock data if API fails
      const videos = filterMockVideos(query);
      return new Response(JSON.stringify(videos), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=3600',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
    
    const data = await response.json();
    
    // Transform the data
    const videos = data.items.map(item => ({
      id: item.id.videoId,
      videoId: item.id.videoId,
      title: item.snippet.title.replace(/&#39;/g, "'").replace(/&quot;/g, '"'),
      artist: item.snippet.channelTitle,
      thumbnail: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default.url,
      duration: '--:--'
    }));
    
    return new Response(JSON.stringify(videos), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('YouTube API error:', error);
    
    // Fallback to mock data
    const videos = filterMockVideos(query);
    return new Response(JSON.stringify(videos), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}