import React, { useState } from 'react';
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
import { ArrowLeft, Calendar as CalendarIcon, Clock } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  specialtyId: z.string({
    required_error: "Selecciona una especialidad",
  }),
  doctorId: z.string({
    required_error: "Selecciona un doctor",
  }),
  date: z.date({
    required_error: "Selecciona una fecha para la consulta",
  }),
  time: z.string({
    required_error: "Selecciona un horario disponible",
  }),
  reason: z.string().min(5, {
    message: "El motivo debe tener al menos 5 caracteres",
  }).max(200, {
    message: "El motivo no puede exceder los 200 caracteres",
  }),
  additionalInfo: z.string().optional(),
});

const AppointmentForm = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  
  // Mock data for form options
  const specialties = [
    { id: "1", name: "Cardiología" },
    { id: "2", name: "Dermatología" },
    { id: "3", name: "Ginecología" },
    { id: "4", name: "Neurología" },
    { id: "5", name: "Oftalmología" },
    { id: "6", name: "Pediatría" },
  ];
  
  const doctors = {
    "1": [
      { id: "101", name: "Dr. Roberto García", available: true },
      { id: "102", name: "Dra. María López", available: true },
    ],
    "2": [
      { id: "201", name: "Dra. Ana Martínez", available: true },
      { id: "202", name: "Dr. Carlos Rodríguez", available: true },
    ],
    "3": [
      { id: "301", name: "Dra. Claudia Fernández", available: true },
      { id: "302", name: "Dra. Patricia González", available: true },
    ],
    "4": [
      { id: "401", name: "Dr. Héctor Sánchez", available: true },
      { id: "402", name: "Dra. Lucía Ramírez", available: true },
    ],
    "5": [
      { id: "501", name: "Dr. Juan Pérez", available: true },
      { id: "502", name: "Dra. Carolina Torres", available: true },
    ],
    "6": [
      { id: "601", name: "Dra. Valeria Sosa", available: true },
      { id: "602", name: "Dr. Miguel Díaz", available: true },
    ],
  };
  
  const timeSlots = [
    "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
    "11:00", "11:30", "12:00", "12:30", "15:00", "15:30",
    "16:00", "16:30", "17:00", "17:30", "18:00"
  ];

  // Initialize react-hook-form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      reason: "",
      additionalInfo: "",
    },
  });
  
  // Get the currently selected specialty to filter doctors
  const selectedSpecialtyId = form.watch("specialtyId");
  
  // Handle form submission
  const onSubmit = (values: z.infer<typeof formSchema>) => {
    console.log(values);
    
    // Here you would normally send the form data to your backend
    // For this demo, we'll just simulate success and navigate back
    setTimeout(() => {
      // Navigate to appointment list with a success message
      navigate('/appointments', { 
        state: { message: "Consulta agendada exitosamente" } 
      });
    }, 1000);
  };
  
  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <header className="flex items-center px-6 py-4 border-b border-gray-200">
        <button 
          className="mr-2" 
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-bold">Nueva consulta</h1>
      </header>
      
      {/* Form */}
      <div className="flex-1 overflow-auto py-6 px-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {step === 1 && (
              <>
                <div className="space-y-4">
                  {/* Specialty selection */}
                  <FormField
                    control={form.control}
                    name="specialtyId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Especialidad</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona una especialidad" />
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
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecciona un doctor" />
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
                        <FormLabel>Fecha</FormLabel>
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
                                  <span>Selecciona una fecha</span>
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
                          <FormLabel>Horario</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecciona un horario" />
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
                </div>
                
                <Button 
                  type="button" 
                  className="w-full"
                  onClick={() => {
                    const stepOneFields = ["specialtyId", "doctorId", "date", "time"];
                    const stepOneValid = stepOneFields.every(field => {
                      const result = form.trigger(field as any);
                      return result;
                    });
                    
                    if (stepOneValid) {
                      setStep(2);
                    }
                  }}
                >
                  Continuar
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
                        <FormLabel>Motivo de la consulta</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe brevemente el motivo de tu consulta" 
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
                        <FormLabel>Información adicional (opcional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Cualquier información adicional que creas relevante para el médico"
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
                    <h3 className="font-medium text-sm mb-2">Resumen de la consulta</h3>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Especialidad:</span>
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
                        <span className="text-gray-500">Fecha:</span>
                        <span>{form.watch("date") ? format(form.watch("date"), "PPP") : ""}</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-gray-500">Horario:</span>
                        <span>{form.watch("time")}</span>
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
                  >
                    Atrás
                  </Button>
                  <Button type="submit" className="flex-1">
                    Agendar consulta
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