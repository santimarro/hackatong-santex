import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export default function UrlTester() {
  const [url, setUrl] = useState<string>(import.meta.env.VITE_SUPABASE_URL || '');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [result, setResult] = useState<string>('');

  const testUrl = async () => {
    if (!url) {
      setResult('Please enter a URL');
      return;
    }

    setStatus('loading');
    setResult('Testing URL...');

    try {
      // Add /auth/v1/health to the URL if it's a Supabase URL
      const testUrl = url.includes('supabase.co') ? `${url}/auth/v1/health` : url;
      
      // Use no-cors mode to avoid CORS errors
      const response = await fetch(testUrl, {
        method: 'GET',
        mode: 'no-cors',
        headers: {
          'Accept': 'application/json',
        },
      });

      // Since no-cors won't give us response details, just check if fetch completed
      setStatus('success');
      setResult('URL appears to be reachable (network connectivity successful)');
    } catch (error: any) {
      setStatus('error');
      setResult(`Error testing URL: ${error.message}`);
      console.error('Error testing URL:', error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>URL Connectivity Test</CardTitle>
        <CardDescription>Test basic network connectivity to a URL</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex space-x-2">
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enter URL to test"
              className="flex-1"
            />
            <Button 
              onClick={testUrl} 
              disabled={status === 'loading'}
            >
              {status === 'loading' ? 'Testing...' : 'Test URL'}
            </Button>
          </div>
          
          {result && (
            <div className={`p-4 rounded-md ${
              status === 'success' ? 'bg-green-50 text-green-800' : 
              status === 'error' ? 'bg-red-50 text-red-800' : 
              'bg-blue-50 text-blue-800'
            }`}>
              {result}
            </div>
          )}
          
          <div className="text-xs text-gray-500 mt-2">
            <p>Note: This test only checks basic network connectivity.</p>
            <p>Due to browser security restrictions (CORS), it cannot verify if the API is working correctly.</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}