import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Card, 
  CardContent 
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { 
  Loader2, 
  User, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  ChevronRight 
} from 'lucide-react';
import BottomNavigation from '@/components/BottomNavigation';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/components/ui/use-toast';
import { Review, ReviewFeed, getDoctorReviewFeed } from '@/lib/doctor-review-service';

const PatientsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(true);
  const [reviewFeed, setReviewFeed] = useState<ReviewFeed | null>(null);
  const [activeTab, setActiveTab] = useState<string>('pending');

  useEffect(() => {
    const fetchPatients = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        const data = await getDoctorReviewFeed(user.id);
        setReviewFeed(data);
      } catch (err: any) {
        console.error('Error fetching patients:', err);
        toast({
          title: "Error",
          description: err.message || 'Failed to load patients',
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchPatients();
  }, [user, toast]);

  // Get all reviews from all patients
  const getAllReviews = (): Review[] => {
    if (!reviewFeed) return [];
    
    const allReviews: Review[] = [];
    
    Object.values(reviewFeed.patients).forEach(patient => {
      allReviews.push(...patient.reviews);
    });
    
    return allReviews;
  };

  // Filter reviews based on status
  const filterReviews = (status: string): Review[] => {
    const allReviews = getAllReviews();
    
    switch (status) {
      case 'pending':
        return allReviews.filter(review => !review.review_status || review.review_status === 'pending_review');
      case 'reviewed':
        return allReviews.filter(review => review.review_status === 'reviewed');
      case 'rejected':
        return allReviews.filter(review => review.review_status === 'rejected');
      default:
        return allReviews;
    }
  };

  const getReviewStatusIcon = (status: string | null) => {
    switch (status) {
      case 'reviewed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'pending_review':
      case null:
      default:
        return <Clock className="h-4 w-4 text-amber-500" />;
    }
  };

  const handleSelectReview = (review: Review) => {
    navigate(`/summary-review/${review.summary_id}`);
  };

  const renderReviewList = (reviews: Review[]) => {
    if (reviews.length === 0) {
      return (
        <div className="text-center py-10 text-gray-500">
          No consultations found with this status
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {reviews.map(review => (
          <Card 
            key={review.summary_id} 
            className="cursor-pointer hover:bg-gray-50"
            onClick={() => handleSelectReview(review)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    {getReviewStatusIcon(review.review_status)}
                    <h3 className="font-medium">{review.title}</h3>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {review.patient_name}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(review.date).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    {review.summary_type === 'medical' ? 'Medical summary' : 
                     review.summary_type === 'patient' ? 'Patient summary' : 
                     review.summary_type === 'comprehensive' ? 'Comprehensive summary' : 
                     'Summary'}
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };
  
  // Group patients by first letter for the directory view
  const getPatientsByFirstLetter = () => {
    if (!reviewFeed) return {};
    
    const patientsByLetter: Record<string, {id: string, name: string}[]> = {};
    
    Object.entries(reviewFeed.patients).forEach(([patientId, patientData]) => {
      const firstLetter = patientData.patient_name.charAt(0).toUpperCase();
      
      if (!patientsByLetter[firstLetter]) {
        patientsByLetter[firstLetter] = [];
      }
      
      patientsByLetter[firstLetter].push({
        id: patientId,
        name: patientData.patient_name
      });
    });
    
    // Sort each letter group alphabetically
    Object.keys(patientsByLetter).forEach(letter => {
      patientsByLetter[letter].sort((a, b) => a.name.localeCompare(b.name));
    });
    
    return patientsByLetter;
  };

  const renderPatientDirectory = () => {
    const patientsByLetter = getPatientsByFirstLetter();
    const sortedLetters = Object.keys(patientsByLetter).sort();
    
    if (sortedLetters.length === 0) {
      return (
        <div className="text-center py-10 text-gray-500">
          No patients found
        </div>
      );
    }
    
    return (
      <div>
        {sortedLetters.map(letter => (
          <div key={letter} className="mb-6">
            <h3 className="font-semibold text-sm text-gray-500 mb-2">{letter}</h3>
            <div className="space-y-2">
              {patientsByLetter[letter].map(patient => (
                <Card 
                  key={patient.id} 
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => navigate(`/patient/${patient.id}`)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center">
                      <User className="h-5 w-5 text-gray-400 mr-3" />
                      <span>{patient.name}</span>
                      <ChevronRight className="h-5 w-5 text-gray-400 ml-auto" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <h1 className="text-xl font-bold">My Patients</h1>
      </div>
      
      {/* Main content */}
      <div className="flex-1 overflow-auto p-6 pb-20">
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Tabs defaultValue="pending" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full grid grid-cols-4 mb-6">
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="reviewed">Reviewed</TabsTrigger>
              <TabsTrigger value="rejected">Rejected</TabsTrigger>
              <TabsTrigger value="directory">Directory</TabsTrigger>
            </TabsList>
            
            <TabsContent value="pending">
              {renderReviewList(filterReviews('pending'))}
            </TabsContent>
            
            <TabsContent value="reviewed">
              {renderReviewList(filterReviews('reviewed'))}
            </TabsContent>
            
            <TabsContent value="rejected">
              {renderReviewList(filterReviews('rejected'))}
            </TabsContent>
            
            <TabsContent value="directory">
              {renderPatientDirectory()}
            </TabsContent>
          </Tabs>
        )}
      </div>
      
      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
};

export default PatientsPage; 