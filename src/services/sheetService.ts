import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { DailySheetData } from "@/types";
import {
    initialCircuits,
    initialNetworkSpeed,
    initialDSLAMStatus,
    initialDefectiveSets
} from "@/data/initialData";

// Helper: Convert Date -> "2025-12-07"
const getDateId = (date: Date) => date.toISOString().split('T')[0];

export const fetchDailySheet = async (date: Date): Promise<DailySheetData> => {
    const dateId = getDateId(date);
    const docRef = doc(db, "daily_sheets", dateId);
    const snapshot = await getDoc(docRef);

    if (snapshot.exists()) {
        // Found data!
        return snapshot.data() as DailySheetData;
    } else {
        // New Day? Load the Default Template
        console.log("New day detected. Loading template.");
        return {
            positionDate: date,
            circuits: initialCircuits,
            networkSpeed: initialNetworkSpeed,
            dslamStatus: initialDSLAMStatus,
            defectiveSets: initialDefectiveSets
        };
    }
};

export const saveDailySheet = async (data: DailySheetData) => {
    const dateObj = new Date(data.positionDate);
    const dateId = getDateId(dateObj);
    await setDoc(doc(db, "daily_sheets", dateId), data);
    console.log("Saved to cloud:", dateId);
};