import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetClose } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import QRCode from "react-qr-code";
import {
  ArrowLeft,
  User,
  Calendar,
  Settings,
  LogOut,
  Shield,
  Bell,
  Stethoscope,
  Edit,
  Save,
  X,
  PlusCircle,
  Printer,
  AlertTriangle,
  Clock,
  Pill,
  RefreshCw,
  Trash2,
  Loader2
} from "lucide-react";
import BottomNavigation from "@/components/BottomNavigation";
import { useAuth } from '@/lib/auth-context';
import { getProfile, updateProfile, updateEmergencyInfo } from '@/lib/profile-service';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

// Types for profile data
interface EmergencyContact {
  name: string;
  phone: string;
  relationship?: string;
}

interface EmergencyInfo {
  bloodType: string;
  allergies: string[];
  conditions: string[];
  medications: string[];
  lastConsultation?: string;
  recommendations?: string[];
  pendingTests?: string[];
}


interface ProfileData {
  fullName: string;
  email: string;
  phone: string;
  birthdate: string;
  address: string;
  bloodType: string; 
  emergencyContact: EmergencyContact;
  emergencyInfo?: EmergencyInfo;
}

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const Profile = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);

  // Initial blank profile
  const initialProfile: ProfileData = {
    fullName: '',
    email: user?.email || '',
    phone: '',
    birthdate: '',
    address: '',
    bloodType: '',
    emergencyContact: {
      name: '',
      phone: '',
      relationship: ''
    },
    emergencyInfo: {
      bloodType: '',
      allergies: [],
      conditions: [],
      medications: [],
      lastConsultation: '',
      recommendations: [],
      pendingTests: []
    },
    medicationReminders: []
  };

  const [profile, setProfile] = useState<ProfileData>(initialProfile);
  const [editableProfile, setEditableProfile] = useState<ProfileData>(initialProfile);

  // New fields for emergency info editing
  const [newAllergy, setNewAllergy] = useState('');
  const [newCondition, setNewCondition] = useState('');
  const [newMedicationText, setNewMedicationText] = useState('');
  const [newRecommendation, setNewRecommendation] = useState('');
  const [newPendingTest, setNewPendingTest] = useState('');

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const profileData = await getProfile(user.id);
        
        if (profileData) {
          // Extract data from profile and emergency_info
          const emergencyInfo = profileData.emergency_info as EmergencyInfo || {
            bloodType: '',
            allergies: [],
            conditions: [],
            medications: [],
            recommendations: [],
            pendingTests: []
          };
          
          // Load medication reminders (from emergency_info or as separate field)
          const medicationReminders = (profileData.emergency_info as any)?.medicationReminders || [];
          
          const newProfile: ProfileData = {
            fullName: profileData.full_name || '',
            email: user.email || '',
            phone: (profileData.emergency_info as any)?.phone || '',
            birthdate: (profileData.emergency_info as any)?.birthdate || '',
            address: (profileData.emergency_info as any)?.address || '',
            bloodType: emergencyInfo.bloodType || '',
            emergencyContact: (profileData.emergency_info as any)?.emergencyContact || {
              name: '',
              phone: '',
              relationship: ''
            },
            emergencyInfo,
            medicationReminders
          };
          
          setProfile(newProfile);
          setEditableProfile(newProfile);
        } else {
          // If no profile found, use defaults but keep email
          const defaultProfile = {
            ...initialProfile,
            email: user.email || '',
            emergencyInfo: {
              bloodType: '',
              allergies: [],
              conditions: [],
              medications: [],
              lastConsultation: '',
              recommendations: [],
              pendingTests: []
            }
          };
          setProfile(defaultProfile);
          setEditableProfile(defaultProfile);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        toast({
          title: 'Error',
          description: 'Could not load profile. Please try again later.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, [user, toast]);

  const handleSaveProfile = async () => {
    if (!user) return;
    
    try {
      setIsSaving(true);
      
      // Prepare emergency info with all the data we want to store
      const emergencyInfo = {
        bloodType: editableProfile.bloodType,
        phone: editableProfile.phone,
        birthdate: editableProfile.birthdate,
        address: editableProfile.address,
        emergencyContact: editableProfile.emergencyContact,
        allergies: editableProfile.emergencyInfo?.allergies || [],
        conditions: editableProfile.emergencyInfo?.conditions || [],
        medications: editableProfile.emergencyInfo?.medications || [],
        recommendations: editableProfile.emergencyInfo?.recommendations || [],
        pendingTests: editableProfile.emergencyInfo?.pendingTests || [],
        medicationReminders: editableProfile.medicationReminders || []
      };
      
      // Update the profile
      await updateProfile(user.id, {
        full_name: editableProfile.fullName,
        updated_at: new Date().toISOString()
      });
      
      // Update emergency info
      await updateEmergencyInfo(user.id, emergencyInfo);
      
      // Update the profile state
      setProfile(editableProfile);
      setIsEditing(false);
      
      toast({
        title: 'Success',
        description: 'Profile updated successfully'
      });
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: 'Error',
        description: 'Could not save profile. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };


  const handleAddItem = (field: 'allergies' | 'conditions' | 'medications' | 'recommendations' | 'pendingTests', value: string) => {
    if (!value.trim()) return;
    
    setEditableProfile(prev => {
      // Initialize emergencyInfo if it doesn't exist
      const currentEmergencyInfo = prev.emergencyInfo || {
        bloodType: '',
        allergies: [],
        conditions: [],
        medications: []
      };
      
      return {
        ...prev,
        emergencyInfo: {
          ...currentEmergencyInfo,
          [field]: [...(currentEmergencyInfo[field] || []), value.trim()]
        }
      };
    });
    
    // Reset input field
    switch(field) {
      case 'allergies':
        setNewAllergy('');
        break;
      case 'conditions':
        setNewCondition('');
        break;
      case 'medications':
        setNewMedicationText('');
        break;
      case 'recommendations':
        setNewRecommendation('');
        break;
      case 'pendingTests':
        setNewPendingTest('');
        break;
    }
  };

  const handleRemoveItem = (field: 'allergies' | 'conditions' | 'medications' | 'recommendations' | 'pendingTests', index: number) => {
    setEditableProfile(prev => {
      if (!prev.emergencyInfo) return prev;
      
      return {
        ...prev,
        emergencyInfo: {
          ...prev.emergencyInfo,
          [field]: prev.emergencyInfo[field]?.filter((_, i) => i !== index) || []
        }
      };
    });
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/auth');
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        title: 'Error',
        description: 'Could not sign out. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Generate the emergency URL for QR code
  const publicEmergencyUrl = user ? `${window.location.origin}/emergency/public/${user.id}` : '';

  const renderEditableProfile = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="font-medium text-lg">Edit Profile</h3>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              setEditableProfile(profile);
              setIsEditing(false);
            }}
          >
            <X className="h-4 w-4 mr-1" />
            Cancel
          </Button>
          <Button 
            size="sm" 
            onClick={handleSaveProfile}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-1" />
                Save
              </>
            )}
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-4 pt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input 
              id="fullName" 
              value={editableProfile.fullName} 
              onChange={(e) => setEditableProfile({...editableProfile, fullName: e.target.value})}
              placeholder="Enter your full name"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email" 
              value={editableProfile.email} 
              disabled 
              className="bg-gray-50"
            />
            <p className="text-xs text-gray-500">Email cannot be modified</p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input 
              id="phone" 
              value={editableProfile.phone} 
              onChange={(e) => setEditableProfile({...editableProfile, phone: e.target.value})}
              placeholder="Ex: +1 555 123 4567"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="birthdate">Date of Birth</Label>
            <Input 
              id="birthdate" 
              type="date" 
              value={editableProfile.birthdate} 
              onChange={(e) => setEditableProfile({...editableProfile, birthdate: e.target.value})}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea 
              id="address" 
              value={editableProfile.address} 
              onChange={(e) => setEditableProfile({...editableProfile, address: e.target.value})}
              placeholder="Enter your complete address"
              rows={2}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="bloodType">Blood Type</Label>
            <Select 
              value={editableProfile.bloodType} 
              onValueChange={(value) => setEditableProfile({
                ...editableProfile, 
                bloodType: value, 
                emergencyInfo: {
                  ...editableProfile.emergencyInfo!,
                  bloodType: value
                }
              })}
            >
              <SelectTrigger id="bloodType">
                <SelectValue placeholder="Select blood type" />
              </SelectTrigger>
              <SelectContent>
                {BLOOD_TYPES.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="pt-2 border-t border-gray-100">
            <h4 className="font-medium mb-2">Emergency Contact</h4>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="emergencyName">Name</Label>
                <Input 
                  id="emergencyName" 
                  value={editableProfile.emergencyContact.name} 
                  onChange={(e) => setEditableProfile({
                    ...editableProfile, 
                    emergencyContact: {
                      ...editableProfile.emergencyContact,
                      name: e.target.value
                    }
                  })}
                  placeholder="Contact name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="emergencyPhone">Phone</Label>
                <Input 
                  id="emergencyPhone" 
                  value={editableProfile.emergencyContact.phone} 
                  onChange={(e) => setEditableProfile({
                    ...editableProfile, 
                    emergencyContact: {
                      ...editableProfile.emergencyContact,
                      phone: e.target.value
                    }
                  })}
                  placeholder="Ex: +1 555 123 4567"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="emergencyRelationship">Relationship</Label>
                <Input 
                  id="emergencyRelationship" 
                  value={editableProfile.emergencyContact.relationship || ''} 
                  onChange={(e) => setEditableProfile({
                    ...editableProfile, 
                    emergencyContact: {
                      ...editableProfile.emergencyContact,
                      relationship: e.target.value
                    }
                  })}
                  placeholder="Ex: Brother, Daughter, Mother, etc."
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Emergency Medical Information</CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          <div className="space-y-2">
            <Label>Allergies</Label>
            <div className="flex space-x-2">
              <Input 
                value={newAllergy} 
                onChange={(e) => setNewAllergy(e.target.value)}
                placeholder="Add allergy"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddItem('allergies', newAllergy);
                  }
                }}
              />
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={() => handleAddItem('allergies', newAllergy)}
              >
                <PlusCircle className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {editableProfile.emergencyInfo?.allergies?.map((allergy, index) => (
                <div key={index} className="flex items-center bg-gray-100 rounded-full px-3 py-1">
                  <span className="text-sm">{allergy}</span>
                  <button 
                    className="ml-2 text-gray-500 hover:text-gray-700"
                    onClick={() => handleRemoveItem('allergies', index)}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {(!editableProfile.emergencyInfo?.allergies || editableProfile.emergencyInfo.allergies.length === 0) && (
                <p className="text-sm text-gray-500">No allergies added</p>
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Medical Conditions</Label>
            <div className="flex space-x-2">
              <Input 
                value={newCondition} 
                onChange={(e) => setNewCondition(e.target.value)}
                placeholder="Add medical condition"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddItem('conditions', newCondition);
                  }
                }}
              />
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={() => handleAddItem('conditions', newCondition)}
              >
                <PlusCircle className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-1 mt-2">
              {editableProfile.emergencyInfo?.conditions?.map((condition, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                  <span className="text-sm">{condition}</span>
                  <button 
                    className="text-gray-500 hover:text-gray-700"
                    onClick={() => handleRemoveItem('conditions', index)}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
              {(!editableProfile.emergencyInfo?.conditions || editableProfile.emergencyInfo.conditions.length === 0) && (
                <p className="text-sm text-gray-500">No medical conditions added</p>
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Current Medications</Label>
            <div className="flex space-x-2">
              <Input 
                value={newMedicationText} 
                onChange={(e) => setNewMedicationText(e.target.value)}
                placeholder="Add medication"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddItem('medications', newMedicationText);
                  }
                }}
              />
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={() => handleAddItem('medications', newMedicationText)}
              >
                <PlusCircle className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-1 mt-2">
              {editableProfile.emergencyInfo?.medications?.map((medication, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                  <span className="text-sm">{medication}</span>
                  <button 
                    className="text-gray-500 hover:text-gray-700"
                    onClick={() => handleRemoveItem('medications', index)}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
              {(!editableProfile.emergencyInfo?.medications || editableProfile.emergencyInfo.medications.length === 0) && (
                <p className="text-sm text-gray-500">No medications added</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderProfileView = () => (
    <div className="space-y-6">
      {/* User profile card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center">
            <div className="bg-gray-200 rounded-full p-4 mr-4">
              <User className="h-10 w-10 text-gray-500" />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold">{profile.fullName || 'Usuario'}</h2>
                  <p className="text-gray-500">{profile.email}</p>
                  {profile.phone && <p className="text-gray-500">{profile.phone}</p>}
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setIsEditing(true)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Personal information */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-medium text-lg">Personal Information</h3>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowQRModal(true)}
          >
            QR Code
          </Button>
        </div>
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-sm text-gray-500">Date of Birth</p>
                <p>{profile.birthdate ? new Date(profile.birthdate).toLocaleDateString() : 'Not specified'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Blood Type</p>
                <p>{profile.bloodType || 'Not specified'}</p>
              </div>
            </div>
            
            <div>
              <p className="text-sm text-gray-500">Address</p>
              <p>{profile.address || 'Not specified'}</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-500">Emergency Contact</p>
              {profile.emergencyContact.name ? (
                <p>
                  {profile.emergencyContact.name}
                  {profile.emergencyContact.relationship ? ` (${profile.emergencyContact.relationship})` : ''} - {profile.emergencyContact.phone}
                </p>
              ) : (
                <p>Not specified</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Medical Info */}
      <div>
        <h3 className="font-medium text-lg mb-3">Medical Information</h3>
        <Card>
          <CardContent className="p-4 space-y-4">
            <div>
              <p className="text-sm text-gray-500">Allergies</p>
              {profile.emergencyInfo?.allergies && profile.emergencyInfo.allergies.length > 0 ? (
                <div className="flex flex-wrap gap-1 mt-1">
                  {profile.emergencyInfo.allergies.map((allergy, index) => (
                    <span key={index} className="bg-red-50 text-red-600 text-xs py-1 px-2 rounded-full">
                      {allergy}
                    </span>
                  ))}
                </div>
              ) : (
                <p>None registered</p>
              )}
            </div>
            
            <div>
              <p className="text-sm text-gray-500">Medical Conditions</p>
              {profile.emergencyInfo?.conditions && profile.emergencyInfo.conditions.length > 0 ? (
                <ul className="list-disc pl-5 text-sm mt-1">
                  {profile.emergencyInfo.conditions.map((condition, index) => (
                    <li key={index}>{condition}</li>
                  ))}
                </ul>
              ) : (
                <p>None registered</p>
              )}
            </div>
            
            <div>
              <p className="text-sm text-gray-500">Medications</p>
              {profile.emergencyInfo?.medications && profile.emergencyInfo.medications.length > 0 ? (
                <ul className="list-disc pl-5 text-sm mt-1">
                  {profile.emergencyInfo.medications.map((medication, index) => (
                    <li key={index}>{medication}</li>
                  ))}
                </ul>
              ) : (
                <p>None registered</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );


  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white py-4 px-6 flex justify-between items-center">
        <div className="flex items-center">
          <button className="mr-2" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-bold text-primary flex items-center">
            <Stethoscope className="h-5 w-5 mr-2" />
            Harvey
          </h1>
        </div>
        <h2 className="text-base font-medium">Profile</h2>
      </header>
      
      {/* Main content */}
      <div className="flex-1 overflow-auto py-6 px-6 pb-16">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-6">
            {isEditing ? (
              renderEditableProfile()
            ) : (
              renderProfileView()
            )}

            {/* Logout button */}
            {!isEditing && (
              <Button 
                variant="outline" 
                className="w-full border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            )}
          </div>
        )}
      </div>
      
      {/* QR Code Modal */}
      <Sheet open={showQRModal} onOpenChange={setShowQRModal}>
        <SheetContent className="sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Emergency QR Code</SheetTitle>
            <SheetDescription>
              This QR code contains vital information in case of emergency.
              Print it and carry it with you.
            </SheetDescription>
          </SheetHeader>
          <div className="py-6 flex flex-col items-center">
            {/* Código QR generado dinámicamente */}
            <div className="border-2 border-black p-4 mb-6 bg-white">
              <QRCode
                value={publicEmergencyUrl}
                size={256}
                style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                viewBox={`0 0 256 256`}
              />
            </div>
            
            <Button className="mb-6" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Print QR Code
            </Button>
            
            {/* Vista previa de información de emergencia */}
            <Card className="w-full border-red-200">
              <CardContent className="p-4">
                <div className="flex items-center mb-4">
                  <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
                  <h2 className="text-lg font-bold text-red-500">Emergency Medical Information</h2>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium">Patient: {profile.fullName}</h3>
                    {profile.birthdate && (
                      <p className="text-sm">Date of birth: {new Date(profile.birthdate).toLocaleDateString()}</p>
                    )}
                    {profile.bloodType && (
                      <p className="text-sm">Blood type: {profile.bloodType}</p>
                    )}
                  </div>
                  
                  {profile.emergencyInfo?.allergies && profile.emergencyInfo.allergies.length > 0 && (
                    <div>
                      <h3 className="font-medium">Allergies:</h3>
                      <ul className="list-disc pl-5 text-sm">
                        {profile.emergencyInfo.allergies.map((allergy, index) => (
                          <li key={index}>{allergy}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {profile.emergencyInfo?.conditions && profile.emergencyInfo.conditions.length > 0 && (
                    <div>
                      <h3 className="font-medium">Pre-existing medical conditions:</h3>
                      <ul className="list-disc pl-5 text-sm">
                        {profile.emergencyInfo.conditions.map((condition, index) => (
                          <li key={index}>{condition}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {profile.emergencyInfo?.medications && profile.emergencyInfo.medications.length > 0 && (
                    <div>
                      <h3 className="font-medium">Current medications:</h3>
                      <ul className="list-disc pl-5 text-sm">
                        {profile.emergencyInfo.medications.map((med, index) => (
                          <li key={index}>{med}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {profile.emergencyContact && profile.emergencyContact.name && (
                    <div>
                      <h3 className="font-medium">Emergency contact:</h3>
                      <p className="text-sm">
                        {profile.emergencyContact.name}
                        {profile.emergencyContact.relationship ? ` (${profile.emergencyContact.relationship})` : ''} — {profile.emergencyContact.phone}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </SheetContent>
      </Sheet>
      
      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
};

export default Profile; 