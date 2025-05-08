import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, XCircle, Edit, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/lib/auth-context';
import { 
  getSummaryForReview, 
  canReviewSummary, 
  submitSummaryReview,
  ReviewDecision
} from '@/lib/doctor-review-service';
import { getDiffHTML } from '@/lib/diff-utils';

interface SummaryData {
  id: string;
  type: string;
  content: string;
  provider: string;
  created_at: string;
  reviewed: boolean;
  reviewed_at: string | null;
  reviewed_by: string | null;
  original_content: string | null;
  consultation_id: string;
  consultations: {
    id: string;
    title: string;
    patient_id: string;
    doctor_id: string;
    appointment_date: string;
    appointment_location: string;
    status: string;
    review_status: string | null;
    profiles: {
      id: string;
      full_name: string;
      avatar_url: string | null;
    }
  }
}

const SummaryReview = () => {
  const { summaryId } = useParams<{ summaryId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [canReview, setCanReview] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [reviewNotes, setReviewNotes] = useState('');
  const [pendingDecision, setPendingDecision] = useState<ReviewDecision | null>(null);
  const [diffHtml, setDiffHtml] = useState<string | null>(null);

  useEffect(() => {
    const fetchSummary = async () => {
      if (!summaryId || !user) {
        setIsLoading(false);
        return;
      }

      try {
        // Check if user can review this summary
        const canUserReview = await canReviewSummary(summaryId, user.id);
        setCanReview(canUserReview);

        if (!canUserReview) {
          toast({
            title: "Unauthorized",
            description: "You don't have permission to review this summary",
            variant: "destructive",
          });
          navigate(-1);
          return;
        }

        // Fetch summary data
        const summaryData = await getSummaryForReview(summaryId);
        setSummary(summaryData);
        
        // Initialize edited content with the current content
        setEditedContent(summaryData.content);
      } catch (err: any) {
        console.error('Error fetching summary:', err);
        toast({
          title: "Error",
          description: err.message || 'Failed to load summary',
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchSummary();
  }, [summaryId, user, toast, navigate]);

  const handleEdit = () => {
    if (!summary) return;
    
    setEditedContent(summary.content);
    setIsEditDialogOpen(true);
  };

  const handleConfirmDecision = (decision: ReviewDecision) => {
    setPendingDecision(decision);
    setIsConfirmDialogOpen(true);
  };

  const handleUpdateDiff = () => {
    if (!summary) return;
    
    // Generate diff HTML between original and edited content
    const diff = getDiffHTML(summary.content, editedContent);
    setDiffHtml(diff);
  };

  const handleSubmitReview = async () => {
    if (!summary || !user || !pendingDecision) return;
    
    setIsSubmitting(true);
    
    try {
      await submitSummaryReview({
        doctor_id: user.id,
        summary_id: summary.id,
        decision: pendingDecision,
        updated_content: pendingDecision === 'edit' ? editedContent : undefined,
        review_notes: reviewNotes
      });
      
      toast({
        title: "Success",
        description: `Summary ${pendingDecision === 'approve' ? 'approved' : pendingDecision === 'reject' ? 'rejected' : 'edited'} successfully`,
      });
      
      // Navigate back to the patients page
      navigate('/patients');
    } catch (error: any) {
      console.error('Error submitting review:', error);
      toast({
        title: "Error",
        description: error.message || 'Failed to submit review',
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
      setIsConfirmDialogOpen(false);
      setIsEditDialogOpen(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="p-6">
        <div className="mb-4">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        <div className="text-center py-10">
          <p className="text-gray-500">Summary not found</p>
        </div>
      </div>
    );
  }

  const formatSummaryType = (type: string) => {
    switch (type) {
      case 'medical':
        return 'Medical Summary';
      case 'patient':
        return 'Patient Summary';
      case 'comprehensive':
        return 'Comprehensive Summary';
      default:
        return 'Summary';
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 flex items-center">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mr-2 p-0">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold">{formatSummaryType(summary.type)}</h1>
      </div>
      
      {/* Main content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="mb-6">
          <Card>
            <CardContent className="p-4">
              <h2 className="font-bold text-lg mb-2">{summary.consultations.title}</h2>
              <p className="text-sm text-gray-500">
                Patient: {summary.consultations.profiles.full_name}
              </p>
              {summary.consultations.appointment_date && (
                <p className="text-sm text-gray-500">
                  Date: {new Date(summary.consultations.appointment_date).toLocaleDateString()}
                </p>
              )}
              {summary.consultations.appointment_location && (
                <p className="text-sm text-gray-500">
                  Location: {summary.consultations.appointment_location}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
        
        <div className="mb-6">
          <h3 className="font-medium text-md mb-2">
            {formatSummaryType(summary.type)} - Review Required
          </h3>
          <div className="p-4 bg-white border border-gray-200 rounded-lg whitespace-pre-wrap">
            {summary.content}
          </div>
        </div>
        
        {/* Review actions */}
        <div className="flex flex-col sm:flex-row gap-3 mb-20">
          <Button 
            variant="default" 
            className="flex-1 bg-green-600 hover:bg-green-700"
            onClick={() => handleConfirmDecision('approve')}
            disabled={!canReview}
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Approve
          </Button>
          
          <Button 
            variant="default" 
            className="flex-1 bg-red-600 hover:bg-red-700"
            onClick={() => handleConfirmDecision('reject')}
            disabled={!canReview}
          >
            <XCircle className="h-4 w-4 mr-2" />
            Reject
          </Button>
          
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={handleEdit}
            disabled={!canReview}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </div>
      </div>
      
      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Summary</DialogTitle>
            <DialogDescription>
              Make changes to the summary content. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4">
            <Textarea 
              value={editedContent} 
              onChange={(e) => setEditedContent(e.target.value)}
              className="min-h-[300px] font-mono text-sm"
            />
          </div>
          
          <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-4">
            <Button 
              variant="outline" 
              onClick={() => setIsEditDialogOpen(false)}
              className="sm:order-1"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                handleUpdateDiff();
                handleConfirmDecision('edit');
                setIsEditDialogOpen(false);
              }}
              className="sm:order-2"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Confirm Dialog */}
      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {pendingDecision === 'approve' ? 'Approve Summary' : 
               pendingDecision === 'reject' ? 'Reject Summary' : 
               'Edit Summary'}
            </DialogTitle>
            <DialogDescription>
              {pendingDecision === 'approve' ? 'Are you sure you want to approve this summary?' : 
               pendingDecision === 'reject' ? 'Are you sure you want to reject this summary?' : 
               'Are you sure you want to save these edits?'}
            </DialogDescription>
          </DialogHeader>
          
          {pendingDecision === 'edit' && diffHtml && (
            <div className="my-4 border border-gray-200 rounded-md p-4 max-h-[200px] overflow-auto">
              <div dangerouslySetInnerHTML={{ __html: diffHtml }} />
            </div>
          )}
          
          <div className="mt-4">
            <label className="text-sm font-medium">Review Notes (optional)</label>
            <Textarea 
              value={reviewNotes} 
              onChange={(e) => setReviewNotes(e.target.value)}
              placeholder="Add any notes about your decision..."
              className="mt-1"
            />
          </div>
          
          <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-4">
            <Button 
              variant="outline" 
              onClick={() => setIsConfirmDialogOpen(false)}
              className="sm:order-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitReview}
              className={`sm:order-2 ${
                pendingDecision === 'approve' ? 'bg-green-600 hover:bg-green-700' : 
                pendingDecision === 'reject' ? 'bg-red-600 hover:bg-red-700' : ''
              }`}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  {pendingDecision === 'approve' ? 'Approve' : 
                   pendingDecision === 'reject' ? 'Reject' : 
                   'Save Changes'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SummaryReview; 