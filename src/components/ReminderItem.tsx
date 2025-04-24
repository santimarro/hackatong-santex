import React from 'react';
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface ReminderItemProps {
  reminderText: string;
  isChecked: boolean; // Receive checked state from parent
  onCheckedChange: (checked: boolean) => void; // Callback for changes
}

const ReminderItem: React.FC<ReminderItemProps> = ({ 
  reminderText, 
  isChecked, 
  onCheckedChange 
}) => {
  const uniqueId = React.useId();

  const handleCheckedChange = (checked: boolean | 'indeterminate') => {
    // Pass the boolean state change up to the parent
    onCheckedChange(checked === true);
  };

  return (
    <div className="flex items-center justify-between space-x-4 p-3 border-b last:border-b-0">
      <Label 
        htmlFor={uniqueId} 
        className={`flex-1 text-sm font-normal`}
      >
        {reminderText}
      </Label>
      <Checkbox
        id={uniqueId}
        checked={isChecked}
        onCheckedChange={handleCheckedChange}
      />
    </div>
  );
};

export default ReminderItem; 