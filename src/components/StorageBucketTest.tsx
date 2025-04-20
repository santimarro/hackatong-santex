import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';

export default function StorageBucketTest() {
  const [buckets, setBuckets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkBuckets = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // List all buckets
      const { data, error } = await supabase.storage.listBuckets();
      
      if (error) {
        throw error;
      }
      
      setBuckets(data);
    } catch (err: any) {
      console.error('Error listing buckets:', err);
      setError(err.message || 'Failed to list storage buckets');
    } finally {
      setLoading(false);
    }
  };

  // Check if required buckets exist
  const requiredBuckets = ['audio_files', 'attachments', 'profile_images'];
  const missingBuckets = requiredBuckets.filter(
    required => !buckets.some(bucket => bucket.name === required)
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Storage Buckets</CardTitle>
        <CardDescription>Check if your Supabase storage buckets are set up correctly</CardDescription>
      </CardHeader>
      <CardContent>
        <Button 
          onClick={checkBuckets} 
          disabled={loading}
          className="mb-4"
        >
          {loading ? 'Checking...' : 'Check Buckets'}
        </Button>
        
        {error && (
          <div className="p-4 mb-4 rounded-md bg-red-50 text-red-800">
            {error}
          </div>
        )}
        
        {buckets.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Available Buckets:</h3>
            <ul className="list-disc list-inside text-sm pl-4">
              {buckets.map(bucket => (
                <li key={bucket.id} className="text-gray-700">
                  {bucket.name}
                </li>
              ))}
            </ul>
            
            {missingBuckets.length > 0 && (
              <div className="mt-4 p-4 rounded-md bg-yellow-50 text-yellow-800">
                <h4 className="font-medium">Missing required buckets:</h4>
                <ul className="list-disc list-inside mt-2">
                  {missingBuckets.map(bucket => (
                    <li key={bucket}>{bucket}</li>
                  ))}
                </ul>
                <p className="mt-2 text-sm">
                  Please create these buckets in your Supabase dashboard
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}