export interface ParsedCurl {
  method: string;
  baseUrl: string;
  endpoint: string;
  headers: Record<string, string>;
  queryParams: Array<{ name: string; value: string }>;
  body?: string;
}

/**
 * Parses a curl command and extracts HTTP method, URL, headers, query parameters, and body
 */
export function parseCurlCommand(curlCommand: string): ParsedCurl {
  // Normalize the curl command - remove line continuations and extra whitespace
  const normalized = curlCommand
    .replace(/\\\s*\n\s*/g, ' ') // Remove line continuations
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();

  if (!normalized.startsWith('curl')) {
    throw new Error('Invalid curl command: must start with "curl"');
  }

  const result: ParsedCurl = {
    method: 'GET',
    baseUrl: '',
    endpoint: '',
    headers: {},
    queryParams: [],
  };

  // Extract HTTP method from -X flag
  const methodMatch = normalized.match(/-X\s+(\w+)/i);
  if (methodMatch) {
    result.method = methodMatch[1].toUpperCase();
  }

  // Extract URL - try multiple patterns
  let url: string | null = null;
  
  // Pattern 1: Quoted URL after curl or -X flag
  const quotedUrlMatch = normalized.match(/(?:curl\s+)?(?:-X\s+\w+\s+)?["'](https?:\/\/[^"']+)["']/i);
  if (quotedUrlMatch) {
    url = quotedUrlMatch[1];
  } else {
    // Pattern 2: Unquoted URL
    const unquotedUrlMatch = normalized.match(/(?:curl\s+)?(?:-X\s+\w+\s+)?(https?:\/\/[^\s"']+)/i);
    if (unquotedUrlMatch) {
      url = unquotedUrlMatch[1];
    } else {
      // Pattern 3: URL without protocol (relative path)
      const pathMatch = normalized.match(/(?:curl\s+)?(?:-X\s+\w+\s+)?["']?([\/][^"'\s]+)["']?/i);
      if (pathMatch) {
        url = pathMatch[1];
      }
    }
  }

  if (!url) {
    throw new Error('Could not find URL in curl command');
  }

  // Parse URL to extract base URL and endpoint
  try {
    const urlObj = new URL(url);
    result.baseUrl = `${urlObj.protocol}//${urlObj.host}`;
    result.endpoint = urlObj.pathname;

    // Extract query parameters from URL
    urlObj.searchParams.forEach((value, name) => {
      result.queryParams.push({ name, value });
    });
  } catch (e) {
    // If URL parsing fails, try to extract path manually
    const pathMatch = url.match(/\/\/[^\/]+(\/[^\?]*)/);
    if (pathMatch) {
      result.endpoint = pathMatch[1];
      const hostMatch = url.match(/(https?:\/\/[^\/]+)/);
      if (hostMatch) {
        result.baseUrl = hostMatch[1];
      }
    } else {
      // Assume it's just a path
      result.endpoint = url.startsWith('/') ? url : `/${url}`;
    }

    // Extract query string manually if present
    const queryMatch = url.match(/\?([^#]+)/);
    if (queryMatch) {
      const queryString = queryMatch[1];
      queryString.split('&').forEach((param) => {
        const [name, value = ''] = param.split('=');
        if (name) {
          result.queryParams.push({
            name: decodeURIComponent(name),
            value: decodeURIComponent(value),
          });
        }
      });
    }
  }

  // Extract headers from -H flags
  const headerRegex = /-H\s+["']([^"']+)["']/gi;
  let headerMatch;
  while ((headerMatch = headerRegex.exec(normalized)) !== null) {
    const headerValue = headerMatch[1];
    const colonIndex = headerValue.indexOf(':');
    if (colonIndex > 0) {
      const headerName = headerValue.substring(0, colonIndex).trim();
      const headerVal = headerValue.substring(colonIndex + 1).trim();
      result.headers[headerName] = headerVal;
    }
  }

  // Extract body from -d or --data flags
  const bodyMatch = normalized.match(/(?:-d|--data)\s+["']([^"']+)["']/i);
  if (bodyMatch) {
    result.body = bodyMatch[1];
  } else {
    // Try with escaped quotes or different quote styles
    const bodyMatch2 = normalized.match(/(?:-d|--data)\s+['"](.*?)['"]/s);
    if (bodyMatch2) {
      result.body = bodyMatch2[1];
    }
  }

  // Validate method
  const validMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];
  if (!validMethods.includes(result.method)) {
    throw new Error(`Invalid HTTP method: ${result.method}. Must be one of: ${validMethods.join(', ')}`);
  }

  return result;
}

