
export const fetcher = async (path, options) => {
    // This will be an empty string in development and /<repo-name> in production
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
  
    const url = `${basePath}${path}`;
    
    console.log(`Fetching from: ${url}`); // Add this for easy debugging
  
    const response = await fetch(url, options);
  
    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`HTTP error! Status: ${response.status}. Body: ${errorBody}`);
    }
  
    return response.json();
  };