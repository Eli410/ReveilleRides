import { create } from "zustand";
import { MapRoute, MapServiceInterruption, NextDepartureTimesResponse, Vehicle } from "aggie-spirit-api";
import { CachedStopEstimate as CachedStopDepartureTimes } from "types/app";

interface AppState {
    authToken: string | null
    setAuthToken: (authToken: string) => void;

    mapServiceInterruption: MapServiceInterruption[]
    setMapServiceInterruption: (mapServiceInterruption: MapServiceInterruption[]) => void

    routes: MapRoute[],
    setRoutes: (routes: MapRoute[]) => void

    drawnRoutes: MapRoute[],
    setDrawnRoutes: (routes: MapRoute[]) => void
    resetDrawnRoutes: () => void,

    stopEstimates: CachedStopDepartureTimes[],
    updateStopEstimate: (stopEstimate: NextDepartureTimesResponse, stopCode: string) => void,
    clearStopEstimates: () => void,

    selectedRoute: MapRoute | null,
    setSelectedRoute: (selectedRoute: MapRoute) => void,
    clearSelectedRoute: () => void,

    drawnBuses: Vehicle[],
    setDrawnBuses: (buses: Vehicle[]) => void,
     
    isGameday: boolean
    setIsGameday: (isGameday: boolean) => void

    presentSheet: (sheet: "routeDetails" | "alerts") => void
    setPresentSheet: (presentSheet: (sheet: "routeDetails" | "alerts") => void) => void
}

const useAppStore = create<AppState>()((set) => ({
    authToken: null,
    setAuthToken: (authToken) => set(() => ({ authToken })),

    mapServiceInterruption: [],
    setMapServiceInterruption: (mapServiceInterruption) => set(() => ({ mapServiceInterruption })),

    routes: [],
    setRoutes: (routes) => set(() => ({ routes })),

    drawnRoutes: [],
    setDrawnRoutes: (routes) => set(() => ({ drawnRoutes: routes })),
    resetDrawnRoutes: () => set(state => ({ drawnRoutes: state.routes })),

    stopEstimates: [],
    updateStopEstimate: (departureTimes, stopCode) => set(state => {
        const newStopDepartureTime: CachedStopDepartureTimes = {
            stopCode,
            departureTimes
        };

        const newStopDepartureTimes = state.stopEstimates.filter(stopEstimate => stopEstimate.stopCode !== stopCode);
        newStopDepartureTimes.push(newStopDepartureTime);
        console.log(newStopDepartureTimes.length)

        return { stopEstimates: newStopDepartureTimes };
    }),
    clearStopEstimates: () => set(() => ({ stopEstimates: [] })),
    
    selectedRoute: null,
    setSelectedRoute: (selectedRoute) => set(() => ({ selectedRoute })),
    clearSelectedRoute: () => set(state => {
        state.resetDrawnRoutes();

        return { selectedRoute: null };
    }),

    drawnBuses: [],
    setDrawnBuses: (buses) => set(() => ({ drawnBuses: buses })),

    isGameday: false,
    setIsGameday: (isGameday) => set(() => ({ isGameday })),

    presentSheet: (sheet) => {console.log(sheet)},
    setPresentSheet: (presentSheet) => set(() => ({ presentSheet }))
}));

export default useAppStore;