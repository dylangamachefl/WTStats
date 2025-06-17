// In utils/fetcher.js or lib/fetcher.js

export const fetcher = async (path) => {
  // Log the environment variable to see what the browser is getting.
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
  console.log(`[Fetcher] Using basePath: '${basePath}'`);

  // Ensure the path starts with a slash
  const finalPath = path.startsWith('/') ? path : `/${path}`;
  const url = `${basePath}${finalPath}`;

  console.log(`[Fetcher] Attempting to fetch from URL: ${url}`);

  try {
    const response = await fetch(url);

    // This block handles HTTP errors (like 404, 500)
    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`[Fetcher] HTTP error! Status: ${response.status} for URL: ${url}`);
      throw new Error(`Failed to fetch ${url}. Status: ${response.status}. Server response: ${errorBody}`);
    }

    // If response is OK, parse JSON
    return await response.json();

  } catch (error) {
    // This block catches network failures (TypeError) or the error thrown above.
    // We check if it's the TypeError to give a more specific message.
    if (error instanceof TypeError) {
      console.error(`[Fetcher] Network error or invalid URL: ${url}. The fetch failed. This often means the basePath is missing.`, error);
      throw new Error(`Network error while trying to fetch ${url}. Please check the console for details.`);
    }
    // Re-throw any other errors
    throw error;
  }
};