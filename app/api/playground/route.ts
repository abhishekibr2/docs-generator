import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { url, method, headers, body: requestBody } = body;

    if (!url || !method) {
      return NextResponse.json(
        { error: 'URL and method are required' },
        { status: 400 }
      );
    }

    // Validate URL
    let targetUrl: URL;
    try {
      targetUrl = new URL(url);
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL' },
        { status: 400 }
      );
    }

    // Build fetch options
    const fetchOptions: RequestInit = {
      method,
      headers: {
        ...headers,
        // Remove Content-Type if no body for GET/HEAD requests
        ...(method === 'GET' || method === 'HEAD' ? {} : {}),
      },
    };

    // Add body for methods that support it
    if (requestBody && ['POST', 'PUT', 'PATCH'].includes(method)) {
      fetchOptions.body = requestBody;
    }

    // Make the request
    const response = await fetch(targetUrl.toString(), fetchOptions);

    // Get response data
    let responseData: any;
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      try {
        responseData = await response.json();
      } catch {
        responseData = await response.text();
      }
    } else {
      responseData = await response.text();
    }

    // Get response headers
    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    // Return response with status and headers
    return NextResponse.json({
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
      data: responseData,
    });
  } catch (error: any) {
    console.error('Playground proxy error:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to execute request',
        status: 0,
        statusText: 'Error',
        headers: {},
        data: null,
      },
      { status: 500 }
    );
  }
}

