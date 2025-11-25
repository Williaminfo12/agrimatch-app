// Fixed: Removed missing vite/client reference
declare var process: {
  env: {
    API_KEY: string;
    [key: string]: string | undefined;
  }
}

// Ensure CSS imports work without vite/client
declare module "*.css";
