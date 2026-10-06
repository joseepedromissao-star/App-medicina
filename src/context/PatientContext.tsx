import React, { createContext, useContext, useState, useMemo } from 'react';
import type { PatientData, PatientDerivedMetrics } from '../../types/clinical';
import { derivePatientMetrics, validatePatientData } from '../../lib/conduta-engine';

export const DEFAULT_PATIENT: PatientData = {
  id: 'paciente-leito-1',
  age: 65,
  sex: 'M',
  weightKg: 70,
  heightCm: 172,
  sbp: 120,
  dbp: 80,
  hr: 78,
  rr: 16,
  spo2: 98,
  temperature: 36.6,
  gcs: 15,
  creatinineMgDl: 1.0,
  lactateMmolL: 1.2,
  allergies: [],
  pregnancy: false,
  dialysis: false,
  liverFailure: false,
  activeBleeding: false,
};

interface PatientContextType {
  patient: PatientData;
  setPatient: React.Dispatch<React.SetStateAction<PatientData>>;
  updatePatient: (fields: Partial<PatientData>) => void;
  resetPatient: () => void;
  loadPreset: (presetName: 'eutrofico' | 'choque' | 'renal' | 'idoso') => void;
  metrics: PatientDerivedMetrics | null;
  validationErrors: string[];
  isValid: boolean;
  isConfirmed: boolean;
  confirmPatient: () => void;
  unconfirmPatient: () => void;
  activePresetLabel: string | null;
  isDrawerOpen: boolean;
  openPatientDrawer: () => void;
  closePatientDrawer: () => void;
}

const PatientContext = createContext<PatientContextType | undefined>(undefined);

export const PatientProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Stored purely in memory (LGPD compliant: no localStorage, no cookies, no network transmission)
  const [patient, setPatient] = useState<PatientData>(DEFAULT_PATIENT);
  // Item 3a & b: Iniciar com paciente NÃO confirmado
  const [isConfirmed, setIsConfirmed] = useState<boolean>(false);
  const [activePresetLabel, setActivePresetLabel] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

  const validationErrors = useMemo(() => {
    return validatePatientData(patient);
  }, [patient]);

  const metrics = useMemo<PatientDerivedMetrics | null>(() => {
    try {
      if (validationErrors.length > 0) return null;
      return derivePatientMetrics(patient);
    } catch {
      return null;
    }
  }, [patient, validationErrors]);

  // Item 3c & 3d: updatePatient chama setIsConfirmed(false) e remove a faixa do caso de exemplo
  const updatePatient = (fields: Partial<PatientData>) => {
    setPatient((prev) => ({ ...prev, ...fields }));
    setIsConfirmed(false);
    setActivePresetLabel(null);
  };

  const confirmPatient = () => {
    if (validationErrors.length === 0) {
      setIsConfirmed(true);
    }
  };

  const unconfirmPatient = () => {
    setIsConfirmed(false);
  };

  const resetPatient = () => {
    setPatient(DEFAULT_PATIENT);
    setIsConfirmed(false);
    setActivePresetLabel(null);
  };

  // Item 3d: Casos de exemplo: não auto-confirmar. activePresetLabel = 'CASO DE EXEMPLO — não é paciente real'
  const loadPreset = (presetName: 'eutrofico' | 'choque' | 'renal' | 'idoso') => {
    switch (presetName) {
      case 'choque':
        setPatient({
          id: 'caso-choque',
          age: 68,
          sex: 'M',
          weightKg: 70,
          heightCm: 172,
          sbp: 75,
          dbp: 40,
          hr: 122,
          rr: 28,
          spo2: 89,
          temperature: 38.6,
          gcs: 13,
          creatinineMgDl: 2.1,
          lactateMmolL: 4.2,
          allergies: ['Penicilina'],
          pregnancy: false,
          dialysis: false,
          liverFailure: false,
          activeBleeding: false,
        });
        setActivePresetLabel('CASO DE EXEMPLO — não é paciente real');
        setIsConfirmed(false); // NÃO auto-confirmar
        break;
      case 'renal':
        setPatient({
          id: 'caso-renal',
          age: 72,
          sex: 'F',
          weightKg: 62,
          heightCm: 158,
          sbp: 150,
          dbp: 90,
          hr: 82,
          rr: 18,
          spo2: 95,
          temperature: 36.8,
          gcs: 15,
          creatinineMgDl: 3.2,
          lactateMmolL: 1.6,
          allergies: ['Dipirona'],
          pregnancy: false,
          dialysis: false,
          liverFailure: false,
          activeBleeding: false,
        });
        setActivePresetLabel('CASO DE EXEMPLO — não é paciente real');
        setIsConfirmed(false); // NÃO auto-confirmar
        break;
      case 'idoso':
        setPatient({
          id: 'caso-idoso',
          age: 82,
          sex: 'F',
          weightKg: 54,
          heightCm: 152,
          sbp: 135,
          dbp: 75,
          hr: 76,
          rr: 22,
          spo2: 92,
          temperature: 37.4,
          gcs: 14,
          creatinineMgDl: 1.3,
          allergies: [],
          pregnancy: false,
          dialysis: false,
          liverFailure: false,
          activeBleeding: false,
        });
        setActivePresetLabel('CASO DE EXEMPLO — não é paciente real');
        setIsConfirmed(false); // NÃO auto-confirmar
        break;
      default:
        resetPatient();
    }
  };

  const openPatientDrawer = () => setIsDrawerOpen(true);
  const closePatientDrawer = () => setIsDrawerOpen(false);

  const value = {
    patient,
    setPatient,
    updatePatient,
    resetPatient,
    loadPreset,
    metrics,
    validationErrors,
    isValid: validationErrors.length === 0,
    isConfirmed,
    confirmPatient,
    unconfirmPatient,
    activePresetLabel,
    isDrawerOpen,
    openPatientDrawer,
    closePatientDrawer,
  };

  return <PatientContext.Provider value={value}>{children}</PatientContext.Provider>;
};

export function usePatient() {
  const context = useContext(PatientContext);
  if (!context) {
    throw new Error('usePatient must be used within a PatientProvider');
  }
  return context;
}
