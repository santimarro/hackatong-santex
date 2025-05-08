import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase'; // Adjust path as needed
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, AlertTriangle, Copy, UserPlus, LogIn } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast'; // Or your custom toast hook
import MarkdownRenderer from '@/components/MarkdownRenderer'; // Assuming you have this for summaries
import { format } from 'date-fns'; // For formatting dates

// Define the expected shape of the data from the RPC function
// This should align with the RETURNS TABLE definition in your SQL function
interface SharedConsultationDetails {
  consultation_id: string;
  consultation_title: string;
  consultation_status: string | null;
  consultation_review_status: string | null;
  patient_full_name: string | null;
  appointment_date: string | null;
  summary_id: string | null;
  summary_content: string | null;
  summary_type: string | null;
  summary_original_content: string | null;
  summary_is_reviewed: boolean | null;
  summary_reviewed_at: string | null;
  summary_reviewed_by_doctor_name: string | null;
  consultation_current_doctor_id: string | null;
  consultation_shared_to_email: string | null;
}

const DoctorReviewPage: React.FC = () => {
  const { shareHash } = useParams<{ shareHash: string }>();
  const [details, setDetails] = useState<SharedConsultationDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchDetails = async () => {
      if (!shareHash) {
        setError('Invalid share link. No hash provided.');
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const { data, error: rpcError } = await supabase.rpc('get_consultation_details_by_share_hash', {
          p_share_hash: shareHash,
        });

        if (rpcError) {
          console.error('RPC Error:', rpcError);
          throw new Error(rpcError.message || 'Failed to fetch consultation details.');
        }
        
        // RPC function returns an array, we expect one item or empty
        if (data && data.length > 0) {
          setDetails(data[0] as SharedConsultationDetails);
        } else {
          setError('Invalid or expired share link, or no details found for this link.');
        }
      } catch (e: any) {
        console.error('Fetch details error:', e);
        setError(e.message || 'An unexpected error occurred.');
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [shareHash]);

  const handleCopyToClipboard = () => {
    if (details?.summary_content) {
      navigator.clipboard.writeText(details.summary_content)
        .then(() => {
          toast({
            title: 'Copied!',
            description: 'Summary copied to clipboard.',
          });
        })
        .catch(err => {
          console.error('Failed to copy:', err);
          toast({
            title: 'Copy Failed',
            description: 'Could not copy summary to clipboard. Please try again manually.',
            variant: 'destructive',
          });
        });
    } else {
        toast({
            title: 'Nothing to Copy',
            description: 'There is no summary content available to copy.',
            variant: 'destructive',
        });
    }
  };
  
  const formatDisplayDate = (dateString?: string | null) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'PPP p'); // e.g., April 18, 2025, 11:00 AM
    } catch {
      return dateString; // Fallback to original string if formatting fails
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-gray-600">Loading consultation details...</p>
      </div>
    );
  }

  if (error || !details) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4 text-center">
        <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
        <h1 className="text-2xl font-semibold text-red-700 mb-2">Access Denied or Link Expired</h1>
        <p className="text-gray-600 mb-6">{error || 'Could not retrieve consultation details. The link may be invalid, expired, or the consultation is no longer shared.'}</p>
        <Button asChild>
          <Link to="/">Go to Homepage</Link>
        </Button>
      </div>
    );
  }

  // Determine if the viewing doctor is the one this was specifically shared with (by email)
  // This is a placeholder for now; actual check would happen after login
  // const isIntendedDoctor = details.consultation_shared_to_email === loggedInDoctorEmail;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <header className="mb-8 text-center">
        <img src="/logo.png" alt="Harvey Logo" className="mx-auto h-16 w-auto mb-4" /> {/* Add your logo */}
        <h1 className="text-3xl font-bold text-gray-800">Consultation Review</h1>
        <p className="text-md text-gray-600">Shared by: {details.patient_full_name || 'A Harvey User'}</p>
      </header>

      <Card className="max-w-3xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl">{details.consultation_title}</CardTitle>
          <CardDescription>
            Appointment Date: {formatDisplayDate(details.appointment_date)}
            {details.summary_type && <span className="block mt-1">Summary Type: <span className="font-semibold">{details.summary_type}</span></span>}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Summary for Your Review:</h3>
            {details.summary_content ? (
              <div className="prose prose-sm max-w-none p-4 border rounded-md bg-white">
                <MarkdownRenderer markdown={details.summary_content} />
              </div>
            ) : (
              <p className="text-gray-500 italic">No summary content available.</p>
            )}
          </div>
          
          {details.summary_original_content && details.summary_original_content !== details.summary_content && (
            <div className="mb-6">
                <h3 className="text-md font-semibold text-gray-600 mb-1">Original AI Summary (for reference):</h3>
                <details className="p-3 border rounded-md bg-gray-50 text-xs">
                    <summary className="cursor-pointer text-gray-500 hover:text-gray-700">Show original content</summary>
                    <div className="mt-2 prose prose-xs max-w-none">
                        <MarkdownRenderer markdown={details.summary_original_content} />
                    </div>
                </details>
            </div>
          )}

          {details.summary_is_reviewed && (
            <Alert variant="default" className="mb-6 bg-green-50 border-green-300">
              <AlertTriangle className="h-4 w-4 !text-green-600" />
              <AlertTitle className="text-green-700">Summary Reviewed</AlertTitle>
              <AlertDescription className="text-green-600">
                This summary was reviewed on {formatDisplayDate(details.summary_reviewed_at)}
                {details.summary_reviewed_by_doctor_name && ` by Dr. ${details.summary_reviewed_by_doctor_name}`}.
              </AlertDescription>
            </Alert>
          )}

          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <Button onClick={handleCopyToClipboard} className="w-full sm:w-auto flex-1" disabled={!details.summary_content}>
              <Copy className="mr-2 h-4 w-4" /> Copy Summary to EHR
            </Button>
            {/* Placeholder for Edit/Accept actions, which would require auth */}
          </div>

          <div className="mt-8 pt-6 border-t">
            <h3 className="text-lg font-semibold text-center text-gray-700 mb-3">Manage this and future summaries with Harvey?</h3>
            <p className="text-sm text-center text-gray-600 mb-4">
              Register or log in to Harvey to easily manage all shared patient consultations, suggest edits, and more.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button variant="outline" asChild className="w-full sm:w-auto">
                <Link to={`/auth?mode=register&email=${encodeURIComponent(details.consultation_shared_to_email || '')}&isDoctor=true`}>
                  <UserPlus className="mr-2 h-4 w-4" /> Create Doctor Account
                </Link>
              </Button>
              <Button variant="default" asChild className="w-full sm:w-auto">
                <Link to={`/auth?mode=login&email=${encodeURIComponent(details.consultation_shared_to_email || '')}`}>
                  <LogIn className="mr-2 h-4 w-4" /> Doctor Login
                </Link>
              </Button>
            </div>
            <p className="text-xs text-center text-gray-500 mt-4">
                If you are Dr. {details.consultation_shared_to_email?.split('@')[0]}, your email <span className="font-medium">({details.consultation_shared_to_email})</span> has been pre-filled for convenience.
            </p>
          </div>
        </CardContent>
      </Card>

      <footer className="mt-12 text-center text-sm text-gray-500">
        <p>&copy; {new Date().getFullYear()} Harvey. All rights reserved.</p>
        <p className="mt-1">Empowering patients and doctors with clear medical communication.</p>
      </footer>
    </div>
  );
};

export default DoctorReviewPage; 