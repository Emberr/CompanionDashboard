import React, { useState } from 'react';
import type { UserData } from '../types';

interface ProfileSetupProps {
  onComplete: (initialData: Partial<UserData>) => void;
}

const InputField: React.FC<{ 
  name: string, 
  label: string, 
  value: string, 
  type?: string, 
  unit?: string,
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void 
}> = ({ name, label, value, type='number', unit, onChange }) => (
  <div>
    <label htmlFor={name} className="block text-sm font-medium text-on-surface-muted">{label}</label>
    <div className="mt-1 relative rounded-md shadow-sm">
       <input 
         type={type} 
         name={name} 
         id={name} 
         value={value} 
         onChange={onChange} 
         className="bg-surface focus:ring-primary focus:border-primary block w-full sm:text-sm border-gray-600 rounded-md p-2" 
       />
       {unit && <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none"><span className="text-gray-500 sm:text-sm">{unit}</span></div>}
    </div>
  </div>
);

const ProfileSetup: React.FC<ProfileSetupProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    gender: 'male',
    age: '30',
    height: '180',
    weight: '80',
    bodyFat: '20',
    goalWeight: '75',
    goalBodyFat: '15',
    activityLevel: 'moderate',
    goal: 'lose', // 'lose', 'maintain', 'gain'
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleNext = () => setStep(step + 1);
  const handleBack = () => setStep(step - 1);

  const handleSubmit = () => {
    const today = new Date().toISOString().split('T')[0];

    // Calculate Macros
    const weightKg = parseFloat(formData.weight);
    const heightCm = parseFloat(formData.height);
    const ageY = parseInt(formData.age);

    let bmr = 0;
    if (formData.gender === 'male') {
        bmr = 10 * weightKg + 6.25 * heightCm - 5 * ageY + 5;
    } else {
        bmr = 10 * weightKg + 6.25 * heightCm - 5 * ageY - 161;
    }
    
    const activityMultipliers = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, very_active: 1.9 };
    const tdee = bmr * activityMultipliers[formData.activityLevel as keyof typeof activityMultipliers];

    let calorieGoal = tdee;
    if (formData.goal === 'lose') calorieGoal -= 500;
    if (formData.goal === 'gain') calorieGoal += 500;

    const proteinGoal = weightKg * 1.8; // g
    const fatGoal = (calorieGoal * 0.25) / 9; // g
    const carbGoal = (calorieGoal - (proteinGoal * 4) - (fatGoal * 9)) / 4; // g

    const initialData: Partial<UserData> = {
      isProfileComplete: true,
      gender: formData.gender as 'male' | 'female',
      age: ageY,
      height: heightCm,
      activityLevel: formData.activityLevel as UserData['activityLevel'],
      weightHistory: [{ value: parseFloat(formData.weight), date: today }],
      bodyFatHistory: [{ value: parseFloat(formData.bodyFat), date: today }],
      goals: {
        weight: parseFloat(formData.goalWeight),
        bodyFat: parseFloat(formData.goalBodyFat),
        dailyNutrients: {
          calories: Math.round(calorieGoal),
          protein: Math.round(proteinGoal),
          carbs: Math.round(carbGoal),
          fat: Math.round(fatGoal),
          fiber: 30, // Default
          sodium: 2300, // Default
        },
      },
      supplementsTaken: { date: today, takenItemIds: [] }
    };
    onComplete(initialData);
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-bkg rounded-lg shadow-xl p-8 w-full max-w-md mx-4">
        <h2 className="text-2xl font-bold text-center mb-2">Welcome to IgnisHealth</h2>
        <p className="text-center text-on-surface-muted mb-6">Let's personalize your experience.</p>

        {step === 1 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">About You</h3>
            <div>
                 <label htmlFor="gender" className="block text-sm font-medium text-on-surface-muted">Gender</label>
                 <select name="gender" value={formData.gender} onChange={handleChange} className="mt-1 bg-surface focus:ring-primary focus:border-primary block w-full sm:text-sm border-gray-600 rounded-md p-2">
                     <option value="male">Male</option>
                     <option value="female">Female</option>
                 </select>
            </div>
            <InputField name="age" label="Age" value={formData.age} unit="years" onChange={handleChange} />
            <InputField name="height" label="Height" value={formData.height} unit="cm" onChange={handleChange} />
          </div>
        )}
        
        {step === 2 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Your Current Stats</h3>
             <InputField name="weight" label="Current Weight" value={formData.weight} unit="kg" onChange={handleChange} />
            <InputField name="bodyFat" label="Current Body Fat (optional)" value={formData.bodyFat} unit="%" onChange={handleChange} />
          </div>
        )}
        
        {step === 3 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Your Goals</h3>
            <InputField name="goalWeight" label="Goal Weight" value={formData.goalWeight} unit="kg" onChange={handleChange} />
            <InputField name="goalBodyFat" label="Goal Body Fat (optional)" value={formData.goalBodyFat} unit="%" onChange={handleChange} />
            <div>
                 <label htmlFor="activityLevel" className="block text-sm font-medium text-on-surface-muted">Weekly Activity Level</label>
                 <select name="activityLevel" value={formData.activityLevel} onChange={handleChange} className="mt-1 bg-surface focus:ring-primary focus:border-primary block w-full sm:text-sm border-gray-600 rounded-md p-2">
                     <option value="sedentary">Sedentary (little or no exercise)</option>
                     <option value="light">Lightly Active (light exercise/sports 1-3 days/week)</option>
                     <option value="moderate">Moderately Active (moderate exercise/sports 3-5 days/week)</option>
                     <option value="active">Very Active (hard exercise/sports 6-7 days a week)</option>
                     <option value="very_active">Extra Active (very hard exercise/sports & physical job)</option>
                 </select>
            </div>
            <div>
                 <label htmlFor="goal" className="block text-sm font-medium text-on-surface-muted">Primary Goal</label>
                 <select name="goal" value={formData.goal} onChange={handleChange} className="mt-1 bg-surface focus:ring-primary focus:border-primary block w-full sm:text-sm border-gray-600 rounded-md p-2">
                     <option value="lose">Fat Loss</option>
                     <option value="maintain">Maintain</option>
                     <option value="gain">Muscle Gain</option>
                 </select>
            </div>
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
