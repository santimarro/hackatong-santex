import React from 'react';

const UnderConstruction = () => {
  return (
    <div className="bg-gradient-to-b from-blue-100 to-white min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-3xl bg-white rounded-xl shadow-lg p-8 md:p-12 mx-auto">
        <div className="mb-8">
          <div className="flex justify-center mb-4">
            <img 
              src="/logo.svg" 
              alt="Harvey - Medical AI Assistant Logo" 
              className="h-24 w-auto"
            />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-blue-700 mb-2">Harvey</h1>
          <p className="text-xl text-blue-600 mb-2">Coming Soon</p>
          <div className="flex items-center justify-center">
            <span className="bg-yellow-400 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
              HSIL Hackathon 2025 Winner
            </span>
          </div>
        </div>
        
        <p className="text-xl font-medium text-gray-700 mb-6">
          Putting patients in control of their health data while revolutionizing doctor-patient communication
        </p>
        
        <div className="mb-8 text-left text-gray-600">
          <h2 className="text-xl font-semibold text-blue-600 mb-3">What is Harvey?</h2>
          <p className="mb-4">
            Harvey is our AI assistant that transforms medical consultations by listening to doctor-patient conversations and providing:
          </p>
          <ul className="list-disc pl-5 space-y-2 mb-6">
            <li>Clear treatment plans for patients in accessible language</li>
            <li>Standardized clinical notes for doctors without typing</li>
            <li>Patient ownership of their clinical data and medical history</li>
            <li>Improved adherence to medical advice</li>
            <li>More time for doctors to focus on patient care</li>
          </ul>
          
          <h2 className="text-xl font-semibold text-blue-600 mb-3">Our Vision</h2>
          <p className="mb-4">
            We're building Harvey as an AI-first platform that returns the power to patients by giving them complete ownership and control of their health data, while revolutionizing healthcare through predictive insights and preventive care alerts.
          </p>
        </div>
        
        <div className="p-5 bg-blue-50 rounded-lg mb-8 border-l-4 border-blue-500">
          <h3 className="text-lg font-semibold text-blue-700 mb-2">Your Data, Your Control</h3>
          <p className="italic text-gray-600">
            "The healthcare system has long kept patient data siloed and inaccessible. Harvey flips this model, making patients the true owners of their medical information. When you own your data, you gain agency over your health journey, enabling better decisions and more personalized care."
          </p>
        </div>
        
        <div className="p-4 bg-gray-50 rounded-lg mb-8">
          <p className="italic text-gray-600">
            "How many times does a patient leave a consultation confused, unable to remember key instructions? 
            And how many doctors feel they spend more time on paperwork than with their patients? 
            That forgetfulness costs millions in follow-up consultations, medication errors, and wasted medical hours."
          </p>
        </div>
        
        <div className="text-sm text-gray-500">
          <p>We're working hard to launch Harvey soon.</p>
          <p className="font-medium mt-2">Stay tuned for updates!</p>
        </div>
      </div>
    </div>
  );
};

export default UnderConstruction; 