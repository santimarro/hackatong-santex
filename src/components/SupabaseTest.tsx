import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { supabase } from '../lib/supabase';

export default function SupabaseTest() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string>('');
  const [debug, setDebug] = useState<any>({});

  const testConnection = async () => {
    try {
      setStatus('loading');
      setMessage('Testing connection to Supabase...');
      
      // First, test a simple connection by getting the Supabase service status
      const { error: healthError } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
      
      if (healthError) {
        throw healthError;
      }

      // If we get here, basic connection works
      setStatus('success');
      setMessage('Successfully connected to Supabase!');
      setDebug({
        url: import.meta.env.VITE_SUPABASE_URL?.slice(0, 15) + '...',
        keyPreview: import.meta.env.VITE_SUPABASE_ANON_KEY?.slice(0, 10) + '...',
        clientInfo: supabase.auth.getSession() ? 'Session available' : 'No session',
        headers: 'Connection successful'
      });
    } catch (error: any) {
      console.error('Supabase connection test failed:', error);
      
      // Try to get more detailed error information
      let errorDetails = {
        message: error.message || 'Unknown error',
        code: error.code || 'No code',
        details: error.details || 'No details',
        hint: error.hint || 'No hint'
      };
      
      // Test network connectivity to the Supabase URL
      let networkStatus = 'Unknown';
      try {
        // Try a basic fetch to the URL (this will likely fail with CORS but tells us if network is reachable)
        const response = await fetch(import.meta.env.VITE_SUPABASE_URL + '/auth/v1/health', {
          method: 'GET',
          mode: 'no-cors', // This prevents CORS errors for this test
        });
        networkStatus = 'Network appears reachable';
      } catch (netError: any) {
        networkStatus = `Network error: ${netError.message}`;
      }
      
      setStatus('error');
      setMessage(`Failed to connect to Supabase: ${error.message || 'Unknown error'}`);
      setDebug({
        url: import.meta.env.VITE_SUPABASE_URL,
        keyLength: import.meta.env.VITE_SUPABASE_ANON_KEY?.length,
        keyPreview: import.meta.env.VITE_SUPABASE_ANON_KEY?.slice(0, 10) + '...',
        error: errorDetails,
        networkTest: networkStatus,
        // Include full error for debugging (stringified)
        fullError: JSON.stringify(error)
      });
    }
  };

  return (
    <Card className="max-w-md mx-auto my-8">
      <CardHeader>
        <CardTitle>Supabase Connection Test</CardTitle>
        <CardDescription>Test the connection to your Supabase instance</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Button 
            onClick={testConnection} 
            disabled={status === 'loading'}
            className="w-full"
          >
            {status === 'loading' ? 'Testing...' : 'Test Connection'}
          </Button>
          
          {message && (
            <div className={`p-4 rounded-md ${
              status === 'success' ? 'bg-green-50 text-green-800' : 
              status === 'error' ? 'bg-red-50 text-red-800' : 
              'bg-blue-50 text-blue-800'
            }`}>
              {message}
            </div>
          )}
          
          {Object.keys(debug).length > 0 && (
            <div className="mt-4 p-4 bg-gray-50 rounded-md text-xs font-mono overflow-auto">
              <pre>{JSON.stringify(debug, null, 2)}</pre>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="text-sm text-gray-500">
        This is a diagnostic tool to help debug connection issues.
      </CardFooter>
    </Card>
  );
}