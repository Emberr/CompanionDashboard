
import React, { useState } from 'react';
import type { UserData } from '../types';

interface ProfileSetupProps {
  onComplete: (initialData: Partial<UserData>) => void;
}

const ProfileSetup: React.FC<ProfileSetupProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    weight: '',
    bodyFat: '',
    goalWeight: '',
    goalBodyFat: '',
    calories: '2000',
    protein: '150',
    carbs: '200',
    fat: '60'
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleNext = () => setStep(step + 1);
  const handleBack = () => setStep(step - 1);

  const handleSubmit = () => {
    const today = new Date().toISOString().split('T')[0];
    const initialData: Partial<UserData> = {
      isProfileComplete: true,
      weightHistory: [{ value: parseFloat(formData.weight), date: today }],
      bodyFatHistory: [{ value: parseFloat(formData.bodyFat), date: today }],
      goals: {
        weight: parseFloat(formData.goalWeight),
        bodyFat: parseFloat(formData.goalBodyFat),
        dailyNutrients: {
          calories: parseInt(formData.calories),
          protein: parseInt(formData.protein),
          carbs: parseInt(formData.carbs),
          fat: parseInt(formData.fat),
          fiber: 30, // Default
          sodium: 2300, // Default
        },
      },
    };
    onComplete(initialData);
  };
  
  const InputField: React.FC<{ name: string, label: string, value: string, type?: string, unit?: string}> = ({ name, label, value, type='number', unit}) => (
      <div>
        <label htmlFor={name} className="block text-sm font-medium text-on-surface-muted">{label}</label>
        <div className="mt-1 relative rounded-md shadow-sm">
           <input type={type} name={name} id={name} value={value} onChange={handleChange} className="bg-surface focus:ring-primary focus:border-primary block w-full sm:text-sm border-gray-600 rounded-md p-2" />
           {unit && <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none"><span className="text-gray-500 sm:text-sm">{unit}</span></div>}
        </div>
      </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-bkg rounded-lg shadow-xl p-8 w-full max-w-md mx-4">
        <h2 className="text-2xl font-bold text-center mb-2">Welcome to AuraFit AI</h2>
        <p className="text-center text-on-surface-muted mb-6">Let's set up your profile.</p>

        {step === 1 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Your Current Stats</h3>
            <InputField name="weight" label="Current Weight" value={formData.weight} unit="kg" />
            <InputField name="bodyFat" label="Current Body Fat" value={formData.bodyFat} unit="%" />
          </div>
        )}
        
        {step === 2 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Your Goals</h3>
            <InputField name="goalWeight" label="Goal Weight" value={formData.goalWeight} unit="kg" />
            <InputField name="goalBodyFat" label="Goal Body Fat" value={formData.goalBodyFat} unit="%" />
          </div>
        )}
        
        {step === 3 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Daily Nutrition Goals</h3>
            <InputField name="calories" label="Calories" value={formData.calories} unit="kcal" />
            <InputField name="protein" label="Protein" value={formData.protein} unit="g" />
            <InputField name="carbs" label="Carbohydrates" value={formData.carbs} unit="g" />
            <InputField name="fat" label="Fat" value={formData.fat} unit="g" />
          </div>
        )}

        <div className="mt-8 flex justify-between">
          {step > 1 ? (
             <button onClick={handleBack} className="bg-surface text-on-surface px-4 py-2 rounded hover:bg-gray-700 transition-colors font-semibold">Back</button>
          ) : <div></div>}
          {step < 3 ? (
             <button onClick={handleNext} className="bg-primary text-on-primary px-4 py-2 rounded hover:bg-primary-variant transition-colors font-semibold">Next</button>
          ) : (
             <button onClick={handleSubmit} className="bg-secondary text-on-primary px-4 py-2 rounded hover:opacity-80 transition-opacity font-semibold">Finish Setup</button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileSetup;
