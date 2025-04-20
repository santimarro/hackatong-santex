import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import SupabaseTest from '@/components/SupabaseTest';
import StorageBucketTest from '@/components/StorageBucketTest';
import UrlTester from '@/components/UrlTester';

export default function Debug() {
  const [envVars, setEnvVars] = useState<Record<string, string>>({});

  const loadEnvVariables = () => {
    // Only show environment variables that start with VITE_
    const vars: Record<string, string> = {};
    Object.keys(import.meta.env).forEach(key => {
      if (key.startsWith('VITE_')) {
        const value = import.meta.env[key] as string;
        // Mask API keys and sensitive information - show only first few chars
        if (key.includes('KEY') || key.includes('SECRET') || key.includes('PASSWORD')) {
          vars[key] = value.slice(0, 5) + '...' + value.slice(-3);
        } else {
          vars[key] = value;
        }
      }
    });
    setEnvVars(vars);
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Debug Tools</h1>
      
      <div className="grid gap-6">
        {/* Environment Variables */}
        <Card>
          <CardHeader>
            <CardTitle>Environment Variables</CardTitle>
            <CardDescription>View the environment variables available to the application</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={loadEnvVariables} variant="outline" className="mb-4">
              Load Environment Variables
            </Button>
            
            {Object.keys(envVars).length > 0 && (
              <div className="bg-gray-50 p-4 rounded-md">
                <pre className="text-xs overflow-auto">{JSON.stringify(envVars, null, 2)}</pre>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* URL Tester */}
        <UrlTester />
        
        {/* Supabase Connection Test */}
        <SupabaseTest />
        
        {/* Storage Bucket Test */}
        <StorageBucketTest />
        
        {/* Browser Storage */}
        <Card>
          <CardHeader>
            <CardTitle>Browser Storage</CardTitle>
            <CardDescription>View and manage browser storage (localStorage, sessionStorage)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <Button 
                onClick={() => {
                  const storage: Record<string, string> = {};
                  for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key) storage[key] = localStorage.getItem(key) || '';
                  }
                  console.log('localStorage:', storage);
                  alert('localStorage data logged to console');
                }}
                variant="outline"
              >
                Log localStorage
              </Button>
              
              <Button 
                onClick={() => {
                  const storage: Record<string, string> = {};
                  for (let i = 0; i < sessionStorage.length; i++) {
                    const key = sessionStorage.key(i);
                    if (key) storage[key] = sessionStorage.getItem(key) || '';
                  }
                  console.log('sessionStorage:', storage);
                  alert('sessionStorage data logged to console');
                }}
                variant="outline"
              >
                Log sessionStorage
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* Direct Supabase Verification */}
        <Card>
          <CardHeader>
            <CardTitle>Direct Supabase Verification</CardTitle>
            <CardDescription>Manually check your Supabase setup</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm">
                Verify your Supabase project by checking these URLs directly:
              </p>
              <ul className="list-disc list-inside text-sm space-y-2">
                <li>
                  <span className="font-medium">Project Dashboard:</span>{' '}
                  <a 
                    href="https://app.supabase.com/project/_" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-blue-600 hover:underline"
                  >
                    Open Supabase Dashboard
                  </a>
                </li>
                <li className="text-sm">
                  Make sure your project's URL in the dashboard matches the one in your .env file
                </li>
                <li className="text-sm">
                  Check that authentication is enabled (Auth → Settings)
                </li>
                <li className="text-sm">
                  Verify that you've created the storage buckets: audio_files, attachments, profile_images
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}