const environments = {
  development: {
    deviceLocal: "http://192.168.68.153:4000/api",
  },
  production: "https://foodscan.com/api",
};

const getBaseUrl = () => {
  // Check if running in development mode
  const isDev = typeof __DEV__ !== 'undefined' ? __DEV__ : !process.env.NODE_ENV || process.env.NODE_ENV === 'development';

  if (isDev) {
    return environments.development.deviceLocal;
  } else {
    return environments.production;
  }
};

const baseURL = getBaseUrl();

// Verify baseURL is a string
if (typeof baseURL !== 'string') {
  console.error('baseURL is not a string:', baseURL);
  throw new Error('Invalid baseURL configuration');
}

console.log('API baseURL:', baseURL);

export default baseURL;
