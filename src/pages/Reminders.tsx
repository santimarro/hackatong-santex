import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  ArrowLeft,
  PlusCircle,
  Pill,
  Clock,
  Trash2,
  Loader2,
  Stethoscope
} from "lucide-react";
import BottomNavigation from "@/components/BottomNavigation";
import { useAuth } from '@/lib/auth-context';
import { getProfile, updateEmergencyInfo } from '@/lib/profile-service';
import { useToast } from '@/hooks/use-toast';

// Types for medication reminders
interface MedicationReminder {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  time: string;
  active: boolean;
}

interface EmergencyInfo {
  bloodType?: string;
  allergies?: string[];
  conditions?: string[];
  medications?: string[];
  medicationReminders?: MedicationReminder[];
}

const Reminders = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [emergencyInfo, setEmergencyInfo] = useState<EmergencyInfo>({
    medicationReminders: []
  });
  const [showAddMedicationForm, setShowAddMedicationForm] = useState(false);
  const [newMedication, setNewMedication] = useState<Omit<MedicationReminder, 'id'>>({
    name: '',
    dosage: '',
    frequency: '',
    time: '08:00',
    active: true
  });

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;

      try {
        setIsLoading(true);
        const profileData = await getProfile(user.id);
        
        if (profileData && profileData.emergency_info) {
          // Extract medication reminders
          const emergencyInfoData = profileData.emergency_info as EmergencyInfo;
          setEmergencyInfo(emergencyInfoData);
        }
      } catch (error) {
        console.error('Error fetching medication reminders:', error);
        toast({
          title: 'Error',
          description: 'Could not load medication reminders. Please try again later.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [user, toast]);

  const handleAddMedicationReminder = async () => {
    if (!newMedication.name || !newMedication.dosage || !newMedication.frequency) {
      toast({
        title: 'Error',
        description: 'Please complete all reminder fields',
        variant: 'destructive',
      });
      return;
    }
    
    const medication: MedicationReminder = {
      id: Date.now().toString(),
      ...newMedication
    };
    
    const updatedReminders = [...(emergencyInfo.medicationReminders || []), medication];
    
    try {
      setIsSaving(true);
      
      // Update emergency info in the database
      if (user) {
        await updateEmergencyInfo(user.id, {
          ...emergencyInfo,
          medicationReminders: updatedReminders
        });
      }
      
      // Update local state
      setEmergencyInfo({
        ...emergencyInfo,
        medicationReminders: updatedReminders
      });
      
      // Reset form
      setNewMedication({
        name: '',
        dosage: '',
        frequency: '',
        time: '08:00',
        active: true
      });
      
      setShowAddMedicationForm(false);
      
      toast({
        title: 'Success',
        description: 'Medication reminder added successfully'
      });
    } catch (error) {
      console.error('Error adding medication reminder:', error);
      toast({
        title: 'Error',
        description: 'Could not save medication reminder. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteMedicationReminder = async (id: string) => {
    if (!user) return;
    
    try {
      setIsSaving(true);
      
      const updatedReminders = (emergencyInfo.medicationReminders || []).filter(m => m.id !== id);
      
      // Update emergency info in the database
      await updateEmergencyInfo(user.id, {
        ...emergencyInfo,
        medicationReminders: updatedReminders
      });
      
      // Update local state
      setEmergencyInfo({
        ...emergencyInfo,
        medicationReminders: updatedReminders
      });
      
      toast({
        title: 'Success',
        description: 'Medication reminder deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting medication reminder:', error);
      toast({
        title: 'Error',
        description: 'Could not delete medication reminder. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleMedicationReminder = async (id: string) => {
    if (!user) return;
    
    try {
      setIsSaving(true);
      
      const updatedReminders = (emergencyInfo.medicationReminders || []).map(m => 
        m.id === id ? {...m, active: !m.active} : m
      );
      
      // Update emergency info in the database
      await updateEmergencyInfo(user.id, {
        ...emergencyInfo,
        medicationReminders: updatedReminders
      });
      
      // Update local state
      setEmergencyInfo({
        ...emergencyInfo,
        medicationReminders: updatedReminders
      });
      
      toast({
        title: 'Success',
        description: 'Medication reminder updated successfully'
      });
    } catch (error) {
      console.error('Error updating medication reminder:', error);
      toast({
        title: 'Error',
        description: 'Could not update medication reminder. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white py-4 px-6 flex justify-between items-center">
        <h1 className="text-xl font-bold text-primary flex items-center">
          <Stethoscope className="h-5 w-5 mr-2" />
          Harvey
        </h1>
        <h2 className="text-base font-medium">Medication Reminders</h2>
      </header>
      
      {/* Main content */}
      <div className="flex-1 overflow-auto py-6 px-6 pb-16">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="font-medium text-lg">Medication Reminders</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddMedicationForm(true)}
              >
                <PlusCircle className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>
            
            {showAddMedicationForm && (
              <Card>
                <CardContent className="p-4 pt-6 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="med-name">Medication Name</Label>
                    <Input
                      id="med-name"
                      placeholder="Ex: Paracetamol"
                      value={newMedication.name}
                      onChange={(e) => setNewMedication({...newMedication, name: e.target.value})}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="med-dosage">Dosage</Label>
                    <Input
                      id="med-dosage"
                      placeholder="Ex: 500mg"
                      value={newMedication.dosage}
                      onChange={(e) => setNewMedication({...newMedication, dosage: e.target.value})}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="med-frequency">Frequency</Label>
                    <Select
                      value={newMedication.frequency}
                      onValueChange={(value) => setNewMedication({...newMedication, frequency: value})}
                    >
                      <SelectTrigger id="med-frequency">
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="twice_daily">Twice daily</SelectItem>
                        <SelectItem value="three_daily">Three times daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="as_needed">As needed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="med-time">Time</Label>
                    <Input
                      id="med-time"
                      type="time"
                      value={newMedication.time}
                      onChange={(e) => setNewMedication({...newMedication, time: e.target.value})}
                    />
                  </div>
                  
                  <div className="flex justify-end space-x-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAddMedicationForm(false)}
                      disabled={isSaving}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={handleAddMedicationReminder}
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        'Save'
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {(!emergencyInfo.medicationReminders || emergencyInfo.medicationReminders.length === 0) && !showAddMedicationForm && (
              <Card>
                <CardContent className="p-8 text-center">
                  <Pill className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                  <h3 className="text-lg font-medium mb-2">No reminders</h3>
                  <p className="text-gray-500 mb-4">Set up reminders for your medications</p>
                  <Button
                    onClick={() => setShowAddMedicationForm(true)}
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add medication
                  </Button>
                </CardContent>
              </Card>
            )}
            
            {emergencyInfo.medicationReminders && emergencyInfo.medicationReminders.length > 0 && (
              <div className="space-y-3">
                {emergencyInfo.medicationReminders.map((medication) => (
                  <Card key={medication.id} className="overflow-hidden">
                    <CardContent className="p-0">
                      <div className="flex items-center justify-between p-4">
                        <div className="flex-1">
                          <div className="flex items-start">
                            <Pill className="h-5 w-5 text-primary mt-0.5 mr-2" />
                            <div>
                              <h4 className="font-medium">{medication.name}</h4>
                              <p className="text-sm text-gray-500">{medication.dosage}</p>
                              <div className="flex items-center mt-1">
                                <Clock className="h-3 w-3 text-gray-400 mr-1" />
                                <span className="text-xs text-gray-500">
                                  {medication.time}
                                  {medication.frequency === 'daily' && ' (Daily)'}
                                  {medication.frequency === 'twice_daily' && ' (Twice daily)'}
                                  {medication.frequency === 'three_daily' && ' (Three times daily)'}
                                  {medication.frequency === 'weekly' && ' (Weekly)'}
                                  {medication.frequency === 'monthly' && ' (Monthly)'}
                                  {medication.frequency === 'as_needed' && ' (As needed)'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <div className="flex items-center mr-3">
                            <Switch
                              checked={medication.active}
                              onCheckedChange={() => handleToggleMedicationReminder(medication.id)}
                            />
                            <span className="ml-2 text-sm">{medication.active ? 'Active' : 'Inactive'}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteMedicationReminder(medication.id)}
                          >
                            <Trash2 className="h-4 w-4 text-gray-500" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
};

export default Reminders;