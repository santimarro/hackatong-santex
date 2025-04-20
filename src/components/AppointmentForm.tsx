import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Calendar as CalendarIcon, Loader2 } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  specialtyId: z.string({
    required_error: "Please select a specialty",
  }),
  doctorId: z.string({
    required_error: "Please select a doctor",
  }),
  // Store the specialty and doctor names for easier display
  specialty: z.string().optional(),
  doctorName: z.string().optional(),
  date: z.date({
    required_error: "Please select a date for the appointment",
  }),
  time: z.string({
    required_error: "Please select an available time",
  }),
  location: z.string().default("Virtual"),
  reason: z.string().min(5, {
    message: "Reason must be at least 5 characters",
  }).max(200, {
    message: "Reason cannot exceed 200 characters",
  }),
  additionalInfo: z.string().optional(),
});

export type AppointmentFormValues = z.infer<typeof formSchema>;

interface AppointmentFormProps {
  onSubmit: (data: AppointmentFormValues) => void;
  isSubmitting?: boolean;
  defaultValues?: Partial<AppointmentFormValues>;
}

const AppointmentForm: React.FC<AppointmentFormProps> = ({
  onSubmit,
  isSubmitting = false,
  defaultValues = {}
}) => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  
  // Mock data for form options - in a real app, you would fetch these from your API
  const specialties = [
    { id: "1", name: "Cardiology" },
    { id: "2", name: "Dermatology" },
    { id: "3", name: "Gynecology" },
    { id: "4", name: "Neurology" },
    { id: "5", name: "Ophthalmology" },
    { id: "6", name: "Pediatrics" },
  ];
  
  const doctors = {
    "1": [
      { id: "101", name: "Dr. Robert Garcia", available: true },
      { id: "102", name: "Dr. Maria Lopez", available: true },
    ],
    "2": [
      { id: "201", name: "Dr. Ana Martinez", available: true },
      { id: "202", name: "Dr. Carlos Rodriguez", available: true },
    ],
    "3": [
      { id: "301", name: "Dr. Claudia Fernandez", available: true },
      { id: "302", name: "Dr. Patricia Gonzalez", available: true },
    ],
    "4": [
      { id: "401", name: "Dr. Hector Sanchez", available: true },
      { id: "402", name: "Dr. Lucia Ramirez", available: true },
    ],
    "5": [
      { id: "501", name: "Dr. Juan Perez", available: true },
      { id: "502", name: "Dr. Carolina Torres", available: true },
    ],
    "6": [
      { id: "601", name: "Dr. Valeria Sosa", available: true },
      { id: "602", name: "Dr. Miguel Diaz", available: true },
    ],
  };
  
  const timeSlots = [
    "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
    "11:00", "11:30", "12:00", "12:30", "15:00", "15:30",
    "16:00", "16:30", "17:00", "17:30", "18:00"
  ];

  // Initialize react-hook-form
  const form = useForm<AppointmentFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      reason: "",
      additionalInfo: "",
      ...defaultValues
    },
  });
  
  // Get the currently selected specialty to filter doctors
  const selectedSpecialtyId = form.watch("specialtyId");
  
  // Update specialty and doctor names when selections change
  useEffect(() => {
    if (selectedSpecialtyId) {
      const specialty = specialties.find(s => s.id === selectedSpecialtyId);
      if (specialty) {
        form.setValue("specialty", specialty.name);
      }
      
      const doctorId = form.watch("doctorId");
      if (doctorId) {
        const doctor = doctors[selectedSpecialtyId as keyof typeof doctors]?.find(d => d.id === doctorId);
        if (doctor) {
          form.setValue("doctorName", doctor.name);
        }
      }
    }
  }, [selectedSpecialtyId, form.watch("doctorId")]);
  
  // Handle form submission
  const handleSubmit = (values: AppointmentFormValues) => {
    onSubmit(values);
  };
  
  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <header className="flex items-center px-6 py-4 border-b border-gray-200">
        <button 
          className="mr-2" 
          onClick={() => navigate(-1)}
          type="button"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-bold">New Appointment</h1>
      </header>
      
      {/* Form */}
      <div className="flex-1 overflow-auto py-6 px-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {step === 1 && (
              <>
                <div className="space-y-4">
                  {/* Specialty selection */}
                  <FormField
                    control={form.control}
                    name="specialtyId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Specialty</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            field.onChange(value);
                            // Reset doctor when specialty changes
                            form.setValue("doctorId", "");
                          }}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a specialty" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {specialties.map((specialty) => (
                              <SelectItem key={specialty.id} value={specialty.id}>
                                {specialty.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Doctor selection */}
                  {selectedSpecialtyId && (
                    <FormField
                      control={form.control}
                      name="doctorId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Doctor</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a doctor" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {doctors[selectedSpecialtyId as keyof typeof doctors]?.map((doctor) => (
                                <SelectItem key={doctor.id} value={doctor.id}>
                                  {doctor.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  
                  {/* Date selection */}
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Select a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) => {
                                // Disable past dates and weekends
                                const now = new Date();
                                now.setHours(0, 0, 0, 0);
                                return (
                                  date < now ||
                                  date.getDay() === 0 || // Sunday
                                  date.getDay() === 6    // Saturday
                                );
                              }}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Time selection */}
                  {form.watch("date") && (
                    <FormField
                      control={form.control}
                      name="time"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Time</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a time" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {timeSlots.map((time) => (
                                <SelectItem key={time} value={time}>
                                  {time}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  
                  {/* Location */}
                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location</FormLabel>
                        <FormControl>
                          <Input placeholder="Virtual or physical location" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <Button 
                  type="button" 
                  className="w-full"
                  onClick={() => {
                    const stepOneFields = ["specialtyId", "doctorId", "date", "time", "location"];
                    form.trigger(stepOneFields as any).then((isValid) => {
                      if (isValid) {
                        setStep(2);
                      }
                    });
                  }}
                >
                  Continue
                </Button>
              </>
            )}
            
            {step === 2 && (
              <>
                <div className="space-y-4">
                  {/* Consultation reason */}
                  <FormField
                    control={form.control}
                    name="reason"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reason for consultation</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Briefly describe the reason for your appointment" 
                            className="resize-none" 
                            rows={3}
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Additional information */}
                  <FormField
                    control={form.control}
                    name="additionalInfo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Additional information (optional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Any additional information you think is relevant for the doctor"
                            className="resize-none" 
                            rows={3}
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Appointment summary */}
                  <div className="bg-gray-50 p-4 rounded-lg mt-6">
                    <h3 className="font-medium text-sm mb-2">Appointment Summary</h3>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Specialty:</span>
                        <span>{specialties.find(s => s.id === form.watch("specialtyId"))?.name}</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-gray-500">Doctor:</span>
                        <span>
                          {selectedSpecialtyId &&
                            doctors[selectedSpecialtyId as keyof typeof doctors]?.find(
                              d => d.id === form.watch("doctorId")
                            )?.name}
                        </span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-gray-500">Date:</span>
                        <span>{form.watch("date") ? format(form.watch("date"), "PPP") : ""}</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-gray-500">Time:</span>
                        <span>{form.watch("time")}</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-gray-500">Location:</span>
                        <span>{form.watch("location")}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex space-x-4">
                  <Button 
                    type="button" 
                    variant="outline"
                    className="flex-1"
                    onClick={() => setStep(1)}
                    disabled={isSubmitting}
                  >
                    Back
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-1"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Scheduling...
                      </>
                    ) : (
                      "Schedule Appointment"
                    )}
                  </Button>
                </div>
              </>
            )}
          </form>
        </Form>
      </div>
    </div>
  );
};

export default AppointmentForm;