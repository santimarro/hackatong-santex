import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
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
  Loader2,
  Plus,
  FilePlus
} from "lucide-react";
import BottomNavigation from "@/components/BottomNavigation";
import { useAuth } from '@/lib/auth-context';
import { getProfile, updateProfile, updateEmergencyInfo } from '@/lib/profile-service';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Types for profile data
interface EmergencyContact {
  name: string;
  phone: string;
  relationship?: string;
}

// New type for Family Member
interface FamilyMember {
  id?: string; // Optional ID if managed in DB
  name: string;
  relationship: string; // e.g., 'Hermana'
  dob: string; // Date of birth
  bloodType?: string; // Added Blood Type
  medicalNotes?: string; // Added Medical Notes
}

// Updated ProfileData structure
interface ProfileData {
  fullName: string;
  email: string;
  phone: string; // Added phone back for data consistency
  birthdate: string;
  address: string;
  bloodType: string;
  allergies: string[]; // Moved from EmergencyInfo
  medications: string[]; // Moved from EmergencyInfo
  emergencyContact: EmergencyContact;
  familyMembers: FamilyMember[]; // New field
}

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

// --- Add/Edit Family Member Modal Component (Using Dialog) ---
interface AddFamilyMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddMember?: (member: Omit<FamilyMember, 'id'>) => void;
  isEditing?: boolean;
  initialData?: FamilyMember | null;
  onUpdateMember?: (updatedMember: FamilyMember) => void;
  onDeleteClick?: () => void; // To trigger the confirmation dialog
}

// Define relationship options
const RELATIONSHIP_OPTIONS = ["Wife", "Husband", "Son", "Daughter", "Spouse","Other"];

const AddFamilyMemberModal: React.FC<AddFamilyMemberModalProps> = ({ 
  isOpen, 
  onClose, 
  onAddMember, 
  isEditing = false, 
  initialData = null,
  onUpdateMember,
  onDeleteClick 
}) => {
  // State for all fields in the modal
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [relationship, setRelationship] = useState('');
  const [bloodType, setBloodType] = useState('');
  const [medicalNotes, setMedicalNotes] = useState('');
  const [attachedFile, setAttachedFile] = useState<File | null>(null);

  // Effect to populate form when editing
  useEffect(() => {
    if (isEditing && initialData) {
      setName(initialData.name || '');
      setDob(initialData.dob || '');
      setRelationship(initialData.relationship || '');
      setBloodType(initialData.bloodType || '');
      setMedicalNotes(initialData.medicalNotes || '');
      // You might want to fetch/populate bloodType, notes, file if they are stored per member
      // setBloodType(initialData.bloodType || '');
      // setMedicalNotes(initialData.medicalNotes || '');
      // setAttachedFile(initialData.file || null);
    } else {
      // Clear form when not editing or when initialData is null
      setName('');
      setDob('');
      setRelationship('');
      setBloodType('');
      setMedicalNotes('');
      setAttachedFile(null);
    }
  }, [isOpen, isEditing, initialData]);

  const handleSave = () => {
    if (name && dob && relationship) {
      const memberData = { 
        name, 
        relationship, 
        dob, 
        bloodType: bloodType || undefined,
        medicalNotes: medicalNotes || undefined,
      };

      if (isEditing && onUpdateMember && initialData?.id) {
        onUpdateMember({ ...memberData, id: initialData.id });
      } else if (!isEditing) {
        onAddMember?.(memberData);
      }
      onClose(); // Close modal after save/update
    } else {
      console.warn("Please fill in all required fields.");
      // Maybe show a toast/error message to the user
    }
  };

  const handleAttachFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setAttachedFile(event.target.files[0]);
    }
  };
  
  // Clear form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setName('');
      setDob('');
      setRelationship('');
      setBloodType('');
      setMedicalNotes('');
      setAttachedFile(null);
    }
  }, [isOpen]);

  return (
    // Use Dialog instead of Sheet
    <Dialog open={isOpen} onOpenChange={onClose}>
      {/* Use DialogContent - styled for full screen on mobile, max-width on larger */}
      <DialogContent className="p-0 gap-0 flex flex-col h-screen w-screen max-w-full sm:max-w-lg sm:h-auto sm:rounded-lg">
        <DialogHeader className="p-6 pb-4"> 
          <DialogTitle className="text-xl font-semibold">{isEditing ? 'Edit Family Member' : 'Add Family Member'}</DialogTitle>
          {/* Optional: <DialogDescription>Enter the details...</DialogDescription> */}
        </DialogHeader>
        
        {/* Form Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4"> 
          <div className="space-y-1">
            <Label htmlFor="memberName">Full Name</Label>
            <Input id="memberName" value={name} onChange={(e) => setName(e.target.value)} placeholder="" /> 
          </div>

          <div className="space-y-1">
            <Label htmlFor="memberDob">Date of Birth</Label>
            <Input 
              id="memberDob" 
              type="date" 
              value={dob} 
              onChange={(e) => setDob(e.target.value)} 
              placeholder="dd/mm/aaaa" 
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="memberRelationship">Relationship</Label>
            <Select value={relationship} onValueChange={setRelationship}>
              <SelectTrigger id="memberRelationship">
                <SelectValue placeholder="Select relationship" />
              </SelectTrigger>
              <SelectContent>
                {RELATIONSHIP_OPTIONS.map(option => (
                  <SelectItem key={option} value={option}>{option}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="memberBloodType">Blood Type</Label>
            <Select value={bloodType} onValueChange={setBloodType}>
              <SelectTrigger id="memberBloodType">
                <SelectValue placeholder="Select blood type" />
              </SelectTrigger>
              <SelectContent>
                {BLOOD_TYPES.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="memberMedicalNotes">Medical Notes</Label>
            <Textarea 
              id="memberMedicalNotes"
              value={medicalNotes}
              onChange={(e) => setMedicalNotes(e.target.value)}
              placeholder="Enter any allergies, chronic conditions, or other important medical information..." 
              rows={4} 
            />
          </div>

          {/* Attach Medical Records Button (UI only) */}
          <div>
            <Button 
              variant="outline"
              className="w-full flex items-center justify-center gap-2" 
              onClick={() => document.getElementById('fileInput')?.click()} 
              type="button"
            >
              <FilePlus className="w-4 h-4" /> Attach Medical Records
            </Button>
            <input 
              type="file" 
              id="fileInput" 
              className="hidden" 
              onChange={handleAttachFile} 
            />
            {attachedFile && <p className="text-xs text-gray-500 mt-1">File: {attachedFile.name}</p>} 
          </div>
        </div>

        {/* Use DialogFooter for buttons */}
        <DialogFooter className="p-6 pt-4 border-t flex flex-col sm:flex-row sm:justify-end sm:space-x-2 space-y-2 sm:space-y-0">
          {/* DialogClose wraps the Cancel button */}
          {isEditing && onDeleteClick && (
            <Button 
              variant="destructive"
              className="w-full sm:w-auto"
              onClick={onDeleteClick} 
              type="button"
            >
              <Trash2 className="w-4 h-4 mr-2" /> Delete Member
            </Button>
          )}
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={handleSave}>{isEditing ? 'Update Member' : 'Save Member'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const Profile = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [isEditMemberModalOpen, setIsEditMemberModalOpen] = useState<boolean>(false);
  const [memberToEditIndex, setMemberToEditIndex] = useState<number | null>(null);
  const [memberToDeleteIndex, setMemberToDeleteIndex] = useState<number | null>(null);

  // Updated initial blank profile
  const initialProfile: ProfileData = {
    fullName: '',
    email: user?.email || '',
    phone: '', // Added phone back
    birthdate: '',
    address: '',
    bloodType: '',
    allergies: [],
    medications: [],
    emergencyContact: {
      name: '',
      phone: '',
      relationship: ''
    },
    familyMembers: [],
  };

  const [profile, setProfile] = useState<ProfileData>(initialProfile);
  const [editableProfile, setEditableProfile] = useState<ProfileData>(initialProfile);

  // State for managing allergy/medication inputs in edit mode
  const [newAllergy, setNewAllergy] = useState('');
  const [newMedication, setNewMedication] = useState('');

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const profileData = await getProfile(user.id); // Fetches the raw profile data

        if (profileData) {
          // Use 'any' for emergencyInfo initially for flexibility, then assign defaults
          const emergencyInfo: any = (typeof profileData.emergency_info === 'object' && profileData.emergency_info !== null)
            ? profileData.emergency_info
            : {}; // Default to empty object if null/not object

          const fetchedProfile: ProfileData = {
            fullName: profileData.full_name || '',
            email: user.email || '',
            phone: emergencyInfo?.phone || '', // Safe access for phone
            birthdate: emergencyInfo?.birthdate || '',
            address: emergencyInfo?.address || '',
            bloodType: emergencyInfo?.bloodType || '',
            allergies: emergencyInfo?.allergies || [], // Default to empty array
            medications: emergencyInfo?.medications || [], // Default to empty array
            emergencyContact: emergencyInfo?.emergencyContact || { name: '', phone: '', relationship: '' },
            familyMembers: (emergencyInfo?.familyMembers || []).map((member: any) => ({
              id: member.id || Date.now().toString() + Math.random(), // Ensure ID exists
              name: member.name || '',
              relationship: member.relationship || '',
              dob: member.dob || '',
              bloodType: member.bloodType || '', // Add bloodType
              medicalNotes: member.medicalNotes || '' // Add medicalNotes
            })),
          };

          setProfile(fetchedProfile);
          setEditableProfile(fetchedProfile);
        } else {
          // If no profile found, use defaults but keep email
          const defaultProfile: ProfileData = {
            ...initialProfile,
            email: user.email || '',
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

      // Prepare data to save, matching the expected Supabase structure.
      // We'll likely update the main profile `full_name` and the `emergency_info` JSONB.
      const emergencyInfoToSave = {
        phone: editableProfile.phone, // Include phone
        birthdate: editableProfile.birthdate,
        address: editableProfile.address,
        bloodType: editableProfile.bloodType,
        allergies: editableProfile.allergies,
        medications: editableProfile.medications,
        emergencyContact: editableProfile.emergencyContact,
        familyMembers: editableProfile.familyMembers,
      };

      // Update the profile name
      await updateProfile(user.id, {
        full_name: editableProfile.fullName,
        updated_at: new Date().toISOString(),
        // Potentially add other direct fields here if they aren't in emergency_info
      });

      // Update emergency info JSONB
      // Ensure updateEmergencyInfo can handle the new structure
      await updateEmergencyInfo(user.id, emergencyInfoToSave);

      // Update the local state
      setProfile(editableProfile);
      setIsEditing(false);

      toast({
        title: 'Success',
        description: 'Profile updated successfully'
      });
    } catch (error: any) {
      console.error('Error saving profile:', error);
      toast({
        title: 'Error saving profile',
        description: error.message || 'Could not save profile. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // --- Handlers for Allergies/Medications ---
  const handleAddItem = (field: 'allergies' | 'medications', value: string) => {
    if (!value.trim()) return;

    setEditableProfile(prev => ({
      ...prev,
      [field]: [...(prev[field] || []), value.trim()] // Ensure field exists before spreading
    }));

    // Reset input field
    if (field === 'allergies') {
      setNewAllergy('');
    } else if (field === 'medications') {
      setNewMedication('');
    }
  };

  const handleRemoveItem = (field: 'allergies' | 'medications', index: number) => {
    setEditableProfile(prev => ({
      ...prev,
      [field]: prev[field]?.filter((_, i) => i !== index) || []
    }));
  };

  // --- Handlers for Family Members ---
   const handleAddFamilyMember = (member: Omit<FamilyMember, 'id'>) => {
     // Update both profile and editableProfile for immediate visual feedback
     // Ensure new fields are included, assign temporary ID
     const newMember: FamilyMember = { 
       ...member, 
       id: Date.now().toString(), 
       bloodType: member.bloodType || '', // Default to empty string if undefined
       medicalNotes: member.medicalNotes || '' // Default to empty string if undefined
     }; 
     setProfile(prev => ({
       ...prev,
       familyMembers: [...(prev.familyMembers || []), newMember]
     }));
     setEditableProfile(prev => ({
       ...prev,
       familyMembers: [...(prev.familyMembers || []), newMember]
     }));
  };

  const handleUpdateFamilyMember = (updatedMember: FamilyMember) => {
     // Ensure the updated member data includes all fields
     const updateMemberInList = (members: FamilyMember[] | undefined) => 
       (members || []).map(m => m.id === updatedMember.id ? { 
         ...updatedMember, // Spread all properties from the updated member
         bloodType: updatedMember.bloodType || '', // Ensure defaults
         medicalNotes: updatedMember.medicalNotes || '' 
       } : m);

     setProfile(prev => ({
       ...prev,
       familyMembers: updateMemberInList(prev.familyMembers)
     }));
     setEditableProfile(prev => ({
       ...prev,
       familyMembers: updateMemberInList(prev.familyMembers)
     }));
     // Close the edit modal after update
     setIsEditMemberModalOpen(false);
     setMemberToEditIndex(null);
  };

  const handleRemoveFamilyMember = (indexToRemove: number) => {
     // Update BOTH states using filter based on index
     const filterByIndex = (members: FamilyMember[] | undefined) => 
       (members || []).filter((_, index) => index !== indexToRemove);

     setProfile(prev => ({
       ...prev,
       familyMembers: filterByIndex(prev.familyMembers)
     }));
      setEditableProfile(prev => ({
        ...prev,
        familyMembers: filterByIndex(prev.familyMembers)
      }));
     // Close confirmation dialog
     setMemberToDeleteIndex(null);
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
      {/* Header with Save/Cancel */}
      <div className="flex justify-between items-center">
        <h3 className="font-medium text-lg">Edit Profile</h3>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setEditableProfile(profile); // Reset changes
              setIsEditing(false);
            }}
            disabled={isSaving}
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

      {/* User Info Card (Editable) */}
      <Card>
         <CardContent className="p-4 pt-6 space-y-4">
           {/* Full Name */}
           <div className="space-y-1">
             <Label htmlFor="fullName">Full Name</Label>
             <Input
               id="fullName"
               value={editableProfile.fullName}
               onChange={(e) => setEditableProfile({...editableProfile, fullName: e.target.value})}
               placeholder="Enter your full name"
               required
             />
           </div>
           {/* Email (Read-only) */}
           <div className="space-y-1">
             <Label htmlFor="email">Email</Label>
             <Input id="email" value={editableProfile.email} disabled className="bg-gray-50" />
           </div>
            {/* Phone (Editable) */}
           <div className="space-y-1">
             <Label htmlFor="phone">Phone</Label>
             <Input
               id="phone"
               value={editableProfile.phone}
               onChange={(e) => setEditableProfile({...editableProfile, phone: e.target.value})}
               placeholder="Phone number"
             />
           </div>
         </CardContent>
       </Card>

      {/* --- Personal Information Card (Editable) - Restructured --- */}
      <Card>
        <CardHeader>
          {/* Removed Edit button from here, title remains */}
          <CardTitle className="text-base">Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
            {/* Grid Layout - 2 columns for editing */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-4 text-sm">
                 {/* --- Left Column --- */}
                 <div className="space-y-4"> 
                     {/* Date of Birth Input */}
                     <div className="space-y-1">
                         <Label htmlFor="birthdate">Date of Birth</Label>
                         <Input
                            id="birthdate"
                            type="date"
                            value={editableProfile.birthdate}
                            onChange={(e) => setEditableProfile({...editableProfile, birthdate: e.target.value})}
                         />
                     </div>
                     
                     {/* Address Input */}
                     <div className="space-y-1">
                         <Label htmlFor="address">Address</Label>
                         <Textarea
                           id="address"
                           value={editableProfile.address}
                           onChange={(e) => setEditableProfile({...editableProfile, address: e.target.value})}
                           placeholder="Enter your complete address"
                           rows={2}
                         />
                     </div>

                     {/* Emergency Contact Inputs */}
                     <div className="pt-2 border-t border-gray-100 mt-2">
                        <h4 className="font-medium mb-2 text-gray-600 text-xs uppercase">Emergency Contact</h4>
                        <div className="space-y-2">
                        <div className="space-y-1">
                            <Label htmlFor="emergencyName">Name</Label>
                            <Input
                                id="emergencyName"
                                value={editableProfile.emergencyContact?.name || ''} 
                                onChange={(e) => setEditableProfile({...editableProfile, emergencyContact: {...(editableProfile.emergencyContact || { name: '', phone: '' }), name: e.target.value}})}
                                placeholder="Contact name"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="emergencyPhone">Phone</Label>
                            <Input
                                id="emergencyPhone"
                                value={editableProfile.emergencyContact?.phone || ''} 
                                onChange={(e) => setEditableProfile({...editableProfile, emergencyContact: {...(editableProfile.emergencyContact || { name: '', phone: '' }), phone: e.target.value}})}
                                placeholder="Contact phone number"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="emergencyRelationship">Relationship</Label>
                            <Input
                                id="emergencyRelationship"
                                value={editableProfile.emergencyContact?.relationship || ''} 
                                onChange={(e) => setEditableProfile({...editableProfile, emergencyContact: {...(editableProfile.emergencyContact || { name: '', phone: '' }), relationship: e.target.value}})}
                                placeholder="e.g., Spouse, Parent, Friend"
                            />
                        </div>
                        </div>
                     </div>
                 </div>

                 {/* --- Right Column --- */}
                 <div className="space-y-4">
                     {/* Blood Type Select */}
                     <div className="space-y-1">
                         <Label htmlFor="bloodType">Blood Type</Label>
                         <Select
                           value={editableProfile.bloodType}
                           onValueChange={(value) => setEditableProfile({...editableProfile, bloodType: value})}
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

                      {/* Allergies Input/List */}
                      <div className="space-y-1">
                         <Label>Allergies</Label>
                         <div className="flex space-x-2">
                           <Input
                             value={newAllergy}
                             onChange={(e) => setNewAllergy(e.target.value)}
                             placeholder="Add allergy"
                             onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddItem('allergies', newAllergy); }}}
                           />
                           <Button variant="secondary" size="icon" onClick={() => handleAddItem('allergies', newAllergy)}><PlusCircle className="h-4 w-4" /></Button>
                         </div>
                         <div className="flex flex-wrap gap-2 mt-2">
                           {editableProfile.allergies?.map((item, index) => (
                             <div key={index} className="flex items-center bg-gray-100 rounded-full px-3 py-1 text-xs">
                               <span>{item}</span>
                               <button className="ml-2 text-gray-500 hover:text-gray-700" onClick={() => handleRemoveItem('allergies', index)}><X className="h-3 w-3" /></button>
                             </div>
                           ))}
                           {(editableProfile.allergies?.length === 0) && <p className="text-xs text-gray-500 mt-1">No allergies added</p>}
                         </div>
                     </div>

                     {/* Medications Input/List */}                     
                     <div className="space-y-1">
                         <Label>Medications</Label>
                         <div className="flex space-x-2">
                           <Input
                             value={newMedication}
                             onChange={(e) => setNewMedication(e.target.value)}
                             placeholder="Add medication"
                              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddItem('medications', newMedication); }}}
                           />
                           <Button variant="secondary" size="icon" onClick={() => handleAddItem('medications', newMedication)}><PlusCircle className="h-4 w-4" /></Button>
                         </div>
                          <div className="flex flex-wrap gap-2 mt-2">
                           {editableProfile.medications?.map((item, index) => (
                             <div key={index} className="flex items-center bg-gray-100 rounded-full px-3 py-1 text-xs">
                               <span>{item}</span>
                               <button className="ml-2 text-gray-500 hover:text-gray-700" onClick={() => handleRemoveItem('medications', index)}><X className="h-3 w-3" /></button>
                             </div>
                           ))}
                           {(editableProfile.medications?.length === 0) && <p className="text-xs text-gray-500 mt-1">No medications added</p>}
                         </div>
                     </div>
                 </div>
            </div>
        </CardContent>
      </Card>

      {/* Family Members Card (Editable) */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Family Members</CardTitle>
           <Button variant="outline" size="sm" onClick={() => setIsAddMemberModalOpen(true)}>
             <Plus className="h-4 w-4 mr-1" /> Add Member
           </Button>
        </CardHeader>
        <CardContent className="p-4 space-y-3">
          {(editableProfile.familyMembers || []).length === 0 ? (
            <p className="text-sm text-gray-500">No family members added yet.</p>
          ) : (
            (editableProfile.familyMembers || []).map((member, index) => (
              <Card key={member.id || index} className="p-3 bg-gray-50">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="font-medium text-base mb-1">{member.name}</p>
                        <p className="text-sm text-gray-600">{member.relationship}, born {member.dob ? new Date(member.dob).toLocaleDateString() : 'N/A'}</p>
                        {/* Separator and Medical Details */} 
                        {(member.bloodType || member.medicalNotes) && (
                          <div className="mt-2 pt-2 border-t border-gray-200 space-y-1">
                            {member.bloodType && (
                              <p className="text-xs text-gray-600">
                                <span className="font-medium text-gray-500">Blood:</span> {member.bloodType}
                              </p>
                            )}
                            {member.medicalNotes && (
                              <p className="text-xs text-gray-600 whitespace-pre-wrap">
                                <span className="font-medium text-gray-500">Notes:</span> {member.medicalNotes}
                              </p>
                            )}
                          </div>
                        )}
                    </div>
                    <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700 h-8 w-8" onClick={() => handleRemoveFamilyMember(index)}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
              </Card>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderProfileView = () => (
    <div className="space-y-6">
      {/* User Info Card */}
       <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="bg-gray-200 rounded-full p-3 mr-4"> {/* Slightly smaller padding */}
                <User className="h-8 w-8 text-gray-500" /> {/* Slightly smaller icon */}
              </div>
              <div className="flex-1">
                 <div>
                   <h2 className="text-lg font-semibold">{profile.fullName || 'User Name'}</h2> {/* Adjusted font size */}
                   <p className="text-sm text-gray-500">{profile.email}</p> {/* Adjusted font size */}
                   {/* Display phone here if desired, e.g., <p className="text-sm text-gray-500">{profile.phone || 'No phone'}</p> */}
                 </div>
              </div>
            </div>
          </CardContent>
       </Card>

      {/* Personal Information Card */}
      <Card>
        <CardContent className="p-4">
            {/* Title and Edit button moved inside CardContent */}
            <div className="flex items-center justify-between mb-4"> {/* Added margin-bottom */}
              <h3 className="text-base font-medium">Personal Information</h3> {/* Using h3 with medium font weight */}
              <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
                <Edit className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Grid Layout - 2 columns */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-4 text-sm"> 
                 {/* Left Column */}
                 <div className="space-y-4"> 
                     <div>
                         <p className="text-gray-500">Date of Birth</p>
                         <p>{profile.birthdate ? new Date(profile.birthdate).toLocaleDateString() : 'Not specified'}</p>
                     </div>
                     <div>
                         <p className="text-gray-500">Address</p>
                         <p>{profile.address || 'Not specified'}</p>
                     </div>
                     <div>
                         <p className="text-gray-500">Emergency Contact</p>
                         {profile.emergencyContact?.name ? (
                         <p>
                             {profile.emergencyContact.name}
                             {profile.emergencyContact.relationship ? ` (${profile.emergencyContact.relationship})` : ''} - {profile.emergencyContact.phone}
                         </p>
                         ) : (
                         <p>Not specified</p>
                         )}
                     </div>
                 </div>

                 {/* Right Column */}
                 <div className="space-y-4">
                     <div>
                         <p className="text-gray-500">Blood Type</p>
                         <p>{profile.bloodType || 'Not specified'}</p>
                     </div>
                      <div>
                         <p className="text-gray-500">Allergies</p>
                         {(profile.allergies || []).length > 0 ? (
                            (profile.allergies || []).join(', ')
                         ) : (
                         <p>None</p>
                         )}
                     </div>
                     <div>
                         <p className="text-gray-500">Medications</p>
                         {(profile.medications || []).length > 0 ? (
                         (profile.medications || []).join(', ')
                         ) : (
                         <p>None</p>
                         )}
                     </div>
                 </div>
            </div>
        </CardContent>
      </Card>

      {/* Family Members Card */}
      <Card>
        <CardContent className="p-4">
          {/* Title moved inside CardContent */}
          <h3 className="text-base font-medium mb-3">Family Members</h3> {/* Added bottom margin */}
          
          {/* List or Placeholder */}
          <div className="space-y-3 mb-4"> {/* Added container div and bottom margin */}
            {(profile.familyMembers || []).length === 0 ? (
              <p className="text-sm text-gray-500 text-left">No family members registered.</p> 
            ) : (
              (profile.familyMembers || []).map((member, index) => (
                <Card key={member.id || index} className="p-3 bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-base mb-1">{member.name}</p>
                      <p className="text-sm text-gray-600">{member.relationship}, born {member.dob ? new Date(member.dob).toLocaleDateString() : 'N/A'}</p>
                      {/* Separator and Medical Details */} 
                      {(member.bloodType || member.medicalNotes) && (
                        <div className="mt-2 pt-2 border-t border-gray-200 space-y-1">
                          {member.bloodType && (
                            <p className="text-xs text-gray-600">
                              <span className="font-medium text-gray-500">Blood:</span> {member.bloodType}
                            </p>
                          )}
                          {member.medicalNotes && (
                            <p className="text-xs text-gray-600 whitespace-pre-wrap">
                              <span className="font-medium text-gray-500">Notes:</span> {member.medicalNotes}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                    <Button
                       variant="ghost"
                       size="sm"
                       className="text-gray-700 hover:text-gray-900 flex-shrink-0 ml-2"
                       onClick={() => {
                         setMemberToEditIndex(index);
                         setIsEditMemberModalOpen(true);
                       }}
                     >
                       <Edit className="h-4 w-4" />
                     </Button>
                  </div>
                 </Card>
               ))
             )}
           </div>

          {/* Add Button moved below list/placeholder, made wider */}
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => setIsAddMemberModalOpen(true)}
          >
             <Plus className="h-4 w-4 mr-2" /> Add Family Member
           </Button>
        </CardContent>
      </Card>
    </div>
  );


  return (
    <div className="flex flex-col h-screen bg-gray-50"> {/* Changed background */}
      {/* Header */}
      <header className="bg-white py-3 px-4 flex items-center shadow-sm"> {/* Adjusted padding/shadow */}
        {/* Back button removed as per new design? Adding it back for navigation safety */}
         <button className="p-2 mr-2 -ml-2" onClick={() => navigate(-1)}>
           <ArrowLeft className="h-5 w-5" />
         </button>
         {/* Title Centered? Or keep left? Let's keep it left aligned with icon */}
         <div className="flex items-center">
             <Stethoscope className="h-6 w-6 text-primary mr-2" />
             <h1 className="text-lg font-semibold text-primary">Harvey</h1>
         </div>
         <div className="flex-grow"></div> {/* Spacer */}
         <h2 className="text-base font-medium mr-2">Profile</h2> {/* Right side title */}
      </header>

      {/* Main content */}
      <div className="flex-1 overflow-auto py-4 px-4 pb-20"> {/* Adjusted padding */}
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-4"> {/* Adjusted spacing */}
            {isEditing ? (
              renderEditableProfile()
            ) : (
              renderProfileView()
            )}

            {/* Logout button - outside the main view cards */}
            {!isEditing && (
              <Button
                variant="outline"
                className="w-full mt-6 border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            )}
          </div>
        )}
      </div>

       {/* Add Family Member Modal */}
       <AddFamilyMemberModal
         isOpen={isAddMemberModalOpen}
         onClose={() => setIsAddMemberModalOpen(false)}
         onAddMember={handleAddFamilyMember}
         isEditing={false}
       />

       {/* --- Edit Family Member Modal --- */}
       {memberToEditIndex !== null && (
         <AddFamilyMemberModal
           isOpen={isEditMemberModalOpen}
           onClose={() => {
             setIsEditMemberModalOpen(false);
             setMemberToEditIndex(null);
           }}
           isEditing={true}
           initialData={profile.familyMembers?.[memberToEditIndex] || null}
           onUpdateMember={handleUpdateFamilyMember}
           onDeleteClick={() => {
              setMemberToDeleteIndex(memberToEditIndex);
              setIsEditMemberModalOpen(false);
            }}
         />
       )}

       {/* --- Confirmation Dialog for Deleting Family Member --- */}
       <AlertDialog open={memberToDeleteIndex !== null} onOpenChange={(open) => !open && setMemberToDeleteIndex(null)}>
         <AlertDialogContent>
           <AlertDialogHeader>
             <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
             <AlertDialogDescription>
               This action will remove the family member from this list. This change will be permanently saved the next time you edit and save your profile.
             </AlertDialogDescription>
           </AlertDialogHeader>
           <AlertDialogFooter>
             <AlertDialogCancel onClick={() => setMemberToDeleteIndex(null)}>Cancel</AlertDialogCancel>
             <AlertDialogAction onClick={() => {
                if (memberToDeleteIndex !== null) {
                  handleRemoveFamilyMember(memberToDeleteIndex);
                  setMemberToEditIndex(null);
                }
             }} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
           </AlertDialogFooter>
         </AlertDialogContent>
       </AlertDialog>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
};

export default Profile; 