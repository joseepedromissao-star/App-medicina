import React, { createContext, useContext, useState, useMemo } from 'react';
import type { WeightOrigin, PediatricInput } from '../../lib/pediatric';

export interface PediatricPatientData {
  ageYears: number | '';
  ageExtraMonths: number | '';
  ageMonths: number | null;
  weightKg: number | '';
  weightOrigin: WeightOrigin | '';
}

interface PediatricContextType {
  pediatricPatient: PediatricPatientData;
  setPediatricPatient: React.Dispatch<React.SetStateAction<PediatricPatientData>>;
  updatePediatricPatient: (fields: Partial<Omit<PediatricPatientData, 'ageMonths'>>) => void;
  resetPediatricPatient: () => void;
  isPediatricConfirmed: boolean;
  confirmPediatricPatient: () => void;
  unconfirmPediatricPatient: () => void;
  pediatricInput: PediatricInput | null;
  clearPediatricActive: () => void;
}

const DEFAULT_PEDIATRIC_PATIENT: PediatricPatientData = {
  ageYears: '',
  ageExtraMonths: '',
  ageMonths: null,
  weightKg: '',
  weightOrigin: '',
};

const PediatricContext = createContext<PediatricContextType | undefined>(undefined);

export const PediatricProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [pediatricPatient, setPediatricPatient] = useState<PediatricPatientData>(DEFAULT_PEDIATRIC_PATIENT);
  // Paciente pediátrico começa NÃO confirmado
  const [isPediatricConfirmed, setIsPediatricConfirmed] = useState<boolean>(false);

  const updatePediatricPatient = (fields: Partial<Omit<PediatricPatientData, 'ageMonths'>>) => {
    setPediatricPatient((prev) => {
      const nextYears = fields.ageYears !== undefined ? fields.ageYears : prev.ageYears;
      const nextExtraMonths = fields.ageExtraMonths !== undefined ? fields.ageExtraMonths : prev.ageExtraMonths;
      
      const yearsNum = typeof nextYears === 'number' ? nextYears : 0;
      const extraMonthsNum = typeof nextExtraMonths === 'number' ? nextExtraMonths : 0;
      
      const hasAgeInput = nextYears !== '' || nextExtraMonths !== '';
      const totalMonths = hasAgeInput ? Math.max(0, yearsNum * 12 + extraMonthsNum) : null;

      return {
        ...prev,
        ...fields,
        ageYears: nextYears,
        ageExtraMonths: nextExtraMonths,
        ageMonths: totalMonths,
      };
    });
    setIsPediatricConfirmed(false);
  };

  const confirmPediatricPatient = () => {
    setIsPediatricConfirmed(true);
  };

  const unconfirmPediatricPatient = () => {
    setIsPediatricConfirmed(false);
  };

  const resetPediatricPatient = () => {
    setPediatricPatient(DEFAULT_PEDIATRIC_PATIENT);
    setIsPediatricConfirmed(false);
  };

  const clearPediatricActive = () => {
    setIsPediatricConfirmed(false);
  };

  const pediatricInput = useMemo<PediatricInput | null>(() => {
    if (
      pediatricPatient.ageMonths === null ||
      typeof pediatricPatient.weightKg !== 'number' ||
      !pediatricPatient.weightOrigin
    ) {
      return null;
    }
    return {
      ageMonths: pediatricPatient.ageMonths,
      weightKg: pediatricPatient.weightKg,
      weightOrigin: pediatricPatient.weightOrigin as WeightOrigin,
    };
  }, [pediatricPatient.ageMonths, pediatricPatient.weightKg, pediatricPatient.weightOrigin]);

  return (
    <PediatricContext.Provider
      value={{
        pediatricPatient,
        setPediatricPatient,
        updatePediatricPatient,
        resetPediatricPatient,
        isPediatricConfirmed,
        confirmPediatricPatient,
        unconfirmPediatricPatient,
        pediatricInput,
        clearPediatricActive,
      }}
    >
      {children}
    </PediatricContext.Provider>
  );
};

export const usePediatric = (): PediatricContextType => {
  const context = useContext(PediatricContext);
  if (!context) {
    throw new Error('usePediatric deve ser usado dentro de um PediatricProvider');
  }
  return context;
};
