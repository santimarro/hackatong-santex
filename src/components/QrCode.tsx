import React from 'react';
import { useAuth } from '@/lib/auth-context';
import { QRCodeSVG } from 'qrcode.react';

const QrCode: React.FC = () => {
  const { user } = useAuth();
  
  if (!user) return null;

  // Generate a URL that will be encoded in the QR code
  const qrValue = `${window.location.origin}/emergency/${user.id}`;

  return (
    <div className="flex flex-col items-center">
      <QRCodeSVG 
        value={qrValue}
        size={200}
        level="H"
        includeMargin={true}
        className="rounded-lg"
      />
    </div>
  );
};

export default QrCode; 