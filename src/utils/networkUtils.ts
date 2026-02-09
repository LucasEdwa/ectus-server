import { networkInterfaces } from 'os';

/**
 * Get the local network IP address (non-loopback IPv4)
 */
export const getLocalNetworkIP = (): string | null => {
  const networks = networkInterfaces();
  
  for (const interfaceName in networks) {
    const networkInterface = networks[interfaceName];
    if (!networkInterface) continue;
    
    for (const network of networkInterface) {
      // Skip over non-IPv4 and internal (i.e., 127.0.0.1) addresses
      if (network.family === 'IPv4' && !network.internal) {
        return network.address;
      }
    }
  }
  
  return null;
};

/**
 * Get connection information for the server
 */
export const getConnectionInfo = (port: number) => {
  const localIP = getLocalNetworkIP();
  
  return {
    port,
    localhost: `http://localhost:${port}`,
    localNetwork: localIP ? `http://${localIP}:${port}` : null,
    graphql: {
      localhost: `http://localhost:${port}/graphql`,
      localNetwork: localIP ? `http://${localIP}:${port}/graphql` : null,
    },
    ip: localIP
  };
};