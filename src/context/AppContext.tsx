import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { CircuitRow, NetworkSpeedEntry, DSLAMStatus, DefectiveSetsEntry, User, AuditEntry, DailySheetData } from '@/types';
import { initialCircuits, initialNetworkSpeed, initialDSLAMStatus, initialDefectiveSets, users } from '@/data/initialData';
// Import the Firebase Service we just created
import { fetchDailySheet, saveDailySheet } from '@/services/sheetService';

interface AppContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  users: User[];
  isEditMode: boolean;
  setIsEditMode: (value: boolean) => void; // Modified to trigger Save
  isLoading: boolean; // New: To show spinners if needed
  positionDate: Date;
  setPositionDate: (date: Date) => void;
  circuits: CircuitRow[];
  updateCircuit: (id: string, field: keyof CircuitRow, value: unknown) => void;
  networkSpeed: NetworkSpeedEntry;
  updateNetworkSpeed: (field: keyof NetworkSpeedEntry, value: unknown) => void;
  dslamStatus: DSLAMStatus;
  updateDSLAMStatus: (field: keyof DSLAMStatus, value: number) => void;
  defectiveSets: DefectiveSetsEntry;
  updateDefectiveSets: (field: keyof DefectiveSetsEntry, value: unknown) => void;
  recentChanges: AuditEntry[];
  reorderCircuits: (oldIndex: number, newIndex: number) => void;
  saveData: () => Promise<void>; // New: Manual Save function
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(users[0]);
  const [isEditMode, setIsEditModeState] = useState(false); // Renamed internal state
  const [isLoading, setIsLoading] = useState(false);

  const [positionDate, setPositionDate] = useState(new Date());

  // State Initialization
  const [circuits, setCircuits] = useState<CircuitRow[]>(initialCircuits);
  const [networkSpeed, setNetworkSpeed] = useState<NetworkSpeedEntry>(initialNetworkSpeed);
  const [dslamStatus, setDSLAMStatus] = useState<DSLAMStatus>(initialDSLAMStatus);
  const [defectiveSets, setDefectiveSets] = useState<DefectiveSetsEntry>(initialDefectiveSets);
  const [recentChanges, setRecentChanges] = useState<AuditEntry[]>([]);

  // 1. FETCH DATA ON DATE CHANGE
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        console.log("Fetching data for:", positionDate.toISOString().split('T')[0]);
        const data = await fetchDailySheet(positionDate);

        // Update all local states with the data from Firebase
        if (data) {
          setCircuits(data.circuits);
          setNetworkSpeed(data.networkSpeed);
          setDSLAMStatus(data.dslamStatus);
          setDefectiveSets(data.defectiveSets);
        }
      } catch (error) {
        console.error("Failed to load sheet data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [positionDate]);

  // 2. SAVE FUNCTION
  const saveData = useCallback(async () => {
    try {
      const fullData: DailySheetData = {
        positionDate: positionDate,
        circuits,
        networkSpeed,
        dslamStatus,
        defectiveSets
      };
      await saveDailySheet(fullData);
    } catch (error) {
      console.error("Error saving data:", error);
    }
  }, [positionDate, circuits, networkSpeed, dslamStatus, defectiveSets]);

  // 3. WRAPPER FOR EDIT MODE (Auto-save on exit)
  const setIsEditMode = (value: boolean) => {
    if (isEditMode === true && value === false) {
      // User is turning OFF edit mode -> SAVE DATA
      console.log("Exiting Edit Mode... Saving Data.");
      saveData();
    }
    setIsEditModeState(value);
  };

  const reorderCircuits = (oldIndex: number, newIndex: number) => {
    setCircuits((items) => {
      const result = Array.from(items);
      const [removed] = result.splice(oldIndex, 1);
      result.splice(newIndex, 0, removed);
      return result;
    });
  };

  const addToRecentChanges = useCallback((entry: AuditEntry) => {
    setRecentChanges(prev => [entry, ...prev].slice(0, 100));
  }, []);

  // --- UPDATE HANDLERS (Unchanged logic, just kept for completeness) ---

  const updateCircuit = useCallback((id: string, field: keyof CircuitRow, value: unknown) => {
    setCircuits(prev => {
      const updateRow = (rows: CircuitRow[]): CircuitRow[] => {
        return rows.map(row => {
          if (row.id === id) {
            const oldValue = String(row[field] ?? '');
            const newValue = String(value ?? '');

            const auditEntry: AuditEntry = {
              userId: currentUser?.id ?? 'unknown',
              userName: currentUser?.name ?? 'Unknown User',
              timestamp: new Date(),
              fieldName: `Circuit "${row.name}" - ${field}`,
              oldValue,
              newValue,
            };

            addToRecentChanges(auditEntry);

            return {
              ...row,
              [field]: value,
              lastEditedBy: currentUser?.name ?? null,
              lastEditedAt: new Date(),
              auditTrail: [...row.auditTrail, auditEntry],
            };
          }
          if (row.subRows) {
            return { ...row, subRows: updateRow(row.subRows) };
          }
          return row;
        });
      };
      return updateRow(prev);
    });
  }, [currentUser, addToRecentChanges]);

  const updateNetworkSpeed = useCallback((field: keyof NetworkSpeedEntry, value: unknown) => {
    setNetworkSpeed(prev => {
      const oldValue = String(prev[field] ?? '');
      const newValue = String(value ?? '');

      const auditEntry: AuditEntry = {
        userId: currentUser?.id ?? 'unknown',
        userName: currentUser?.name ?? 'Unknown User',
        timestamp: new Date(),
        fieldName: `Network Speed - ${field}`,
        oldValue,
        newValue,
      };

      addToRecentChanges(auditEntry);

      return {
        ...prev,
        [field]: value,
        lastEditedBy: currentUser?.name ?? null,
        lastEditedAt: new Date(),
        auditTrail: [...prev.auditTrail, auditEntry],
      };
    });
  }, [currentUser, addToRecentChanges]);

  const updateDSLAMStatus = useCallback((field: keyof DSLAMStatus, value: number) => {
    setDSLAMStatus(prev => {
      const oldValue = String(prev[field] ?? '');
      const newValue = String(value ?? '');

      const auditEntry: AuditEntry = {
        userId: currentUser?.id ?? 'unknown',
        userName: currentUser?.name ?? 'Unknown User',
        timestamp: new Date(),
        fieldName: `DSLAM Status - ${field}`,
        oldValue,
        newValue,
      };

      addToRecentChanges(auditEntry);

      return {
        ...prev,
        [field]: value,
        lastEditedBy: currentUser?.name ?? null,
        lastEditedAt: new Date(),
        auditTrail: [...prev.auditTrail, auditEntry],
      };
    });
  }, [currentUser, addToRecentChanges]);

  const updateDefectiveSets = useCallback((field: keyof DefectiveSetsEntry, value: unknown) => {
    setDefectiveSets(prev => {
      const oldValue = String(prev[field] ?? '');
      const newValue = String(value ?? '');

      const auditEntry: AuditEntry = {
        userId: currentUser?.id ?? 'unknown',
        userName: currentUser?.name ?? 'Unknown User',
        timestamp: new Date(),
        fieldName: `Defective Sets - ${field}`,
        oldValue,
        newValue,
      };

      addToRecentChanges(auditEntry);

      return {
        ...prev,
        [field]: value,
        lastEditedBy: currentUser?.name ?? null,
        lastEditedAt: new Date(),
        auditTrail: [...prev.auditTrail, auditEntry],
      };
    });
  }, [currentUser, addToRecentChanges]);

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        users,
        isEditMode,
        setIsEditMode,
        isLoading,
        positionDate,
        setPositionDate,
        circuits,
        updateCircuit,
        networkSpeed,
        updateNetworkSpeed,
        dslamStatus,
        updateDSLAMStatus,
        defectiveSets,
        updateDefectiveSets,
        recentChanges,
        reorderCircuits,
        saveData
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};