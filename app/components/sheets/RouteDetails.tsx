import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, NativeSyntheticEvent } from "react-native";
import { BottomSheetModal, BottomSheetView, BottomSheetFlatList } from "@gorhom/bottom-sheet";
import SegmentedControl, { NativeSegmentedControlIOSChangeEvent } from "@react-native-segmented-control/segmented-control";
import { Ionicons } from '@expo/vector-icons';
import { IMapRoute, IPatternPath, IStop } from "../../../utils/interfaces";
import useAppStore from "../../data/app_state";
import StopCell from "../ui/StopCell";
import BusIcon from "../ui/BusIcon";
import FavoritePill from "../ui/FavoritePill";
import AlertPill from "../ui/AlertPill";
import { useQueryClient } from "@tanstack/react-query";
import { useStopEstimate } from "app/data/api_query";

interface SheetProps {
    sheetRef: React.RefObject<BottomSheetModal>
}

// Display details when a route is selected
const RouteDetails: React.FC<SheetProps> = ({ sheetRef }) => {
    const currentSelectedRoute = useAppStore((state) => state.selectedRoute);
    const clearSelectedRoute = useAppStore((state) => state.clearSelectedRoute);

    const setSelectedRouteDirection = useAppStore(state => state.setSelectedRouteDirection);
    const setSelectedStop = useAppStore(state => state.setSelectedStop);
    const setPoppedUpStopCallout = useAppStore(state => state.setPoppedUpStopCallout);
    const theme = useAppStore(state => state.theme);

    const { data: stopEstimates } = useStopEstimate(
        currentSelectedRoute?.key ?? "", 
        currentSelectedRoute?.directionList[0]?.direction.key ?? "", 
        currentSelectedRoute?.patternPaths[0]?.patternPoints[0]?.stop?.stopCode ?? ""
    )


    // Controls SegmentedControl
    const [selectedDirectionIndex, setSelectedDirectionIndex] = useState(0);

    const [processedStops, setProcessedStops] = useState<IStop[]>([]);
    const [selectedRoute, setSelectedRoute] = useState<IMapRoute | null>(null);

    const client = useQueryClient();

    // cleanup this view when the sheet is closed
    const closeModal = () => {
        sheetRef.current?.dismiss();
        clearSelectedRoute();
        setSelectedRouteDirection(null);

        setSelectedStop(null);
        setPoppedUpStopCallout(null);

        // reset direction selector
        setSelectedDirectionIndex(0);
    }

    // Filters patternPaths for only the selected route from all patternPaths
    function getPatternPathForSelectedRoute(): IPatternPath | undefined {
        if (!selectedRoute) return undefined;
        return selectedRoute.patternPaths.find(direction => direction.patternKey === selectedRoute.directionList[selectedDirectionIndex]?.patternList[0]?.key)
    }

    // When a new route is selected or the direction of the route is changed, update the stops
    useEffect(() => {
        if (!selectedRoute) return;

        const processedStops: IStop[] = [];
        const directionPath = getPatternPathForSelectedRoute()?.patternPoints ?? [];

        for (const point of directionPath) {
            if (!point.stop) continue;
            processedStops.push(point.stop);
        }

        setProcessedStops(processedStops);
    }, [selectedRoute, selectedDirectionIndex])

    // Update the selected route when the currentSelectedRoute changes but only if it is not null
    // Prevents visual glitch when the sheet is closed and the selected route is null
    useEffect(() => {
        if (!currentSelectedRoute) return;
        setSelectedRoute(currentSelectedRoute);

        // reset direction selector
        setSelectedRouteDirection(currentSelectedRoute.directionList[0]?.direction.key ?? null);
        setSelectedDirectionIndex(0);

    }, [currentSelectedRoute])

    useEffect(() => {
        return () => setSelectedRouteDirection(null);
    }, []);

    const handleSetSelectedDirection = (evt: NativeSyntheticEvent<NativeSegmentedControlIOSChangeEvent>) => {
        setSelectedDirectionIndex(evt.nativeEvent.selectedSegmentIndex);
        
        setSelectedRouteDirection(selectedRoute?.directionList[evt.nativeEvent.selectedSegmentIndex]?.direction.key ?? null);
    }

    const snapPoints = ['25%', '45%', '85%'];

    
    return (
        <BottomSheetModal
            ref={sheetRef}
            snapPoints={snapPoints}
            index={1}
            enablePanDownToClose={false}
            backgroundStyle={{ backgroundColor:  theme.background }}
            handleIndicatorStyle={{backgroundColor: theme.divider}}
        >
            {selectedRoute &&
                <BottomSheetView>
                    <View style={{ flexDirection: "row", alignItems: 'center', marginBottom: 8, marginHorizontal: 16 }}>
                        <BusIcon 
                            name={selectedRoute?.shortName ?? "Something went wrong"} 
                            color={selectedRoute?.directionList[0]?.lineColor ?? "#500000"} 
                            style={{ marginRight: 16 }} 
                        />
                        <Text style={{ fontWeight: 'bold', fontSize: 28, flex: 1, color: theme.text }}>{selectedRoute?.name ?? "Something went wrong"}</Text>

                        <TouchableOpacity style={{ alignContent: 'center', justifyContent: 'flex-end' }} onPress={closeModal}>
                            <Ionicons name="close-circle" size={32} color="grey" />
                        </TouchableOpacity>
                    </View>

                    <View style={{ flexDirection: "row", alignItems: 'center', marginBottom: 8, marginLeft: 16, gap: 4 }}>
                        <FavoritePill routeShortName={selectedRoute!.shortName} />
                        <AlertPill routeId={selectedRoute!.key} />
                    </View>

                    { selectedRoute?.directionList.length > 1 && 
                        <SegmentedControl
                            style={{ marginHorizontal: 16 }}
                            values={selectedRoute?.directionList.map(direction => "to " + direction.destination) ?? []}
                            selectedIndex={selectedDirectionIndex}
                            onChange={handleSetSelectedDirection}
                        />
                    }
                    
                    <View style={{ height: 1, backgroundColor: theme.divider, marginTop: 8 }} />
                </BottomSheetView>
            }
            

            { selectedRoute &&
                <BottomSheetFlatList
                    data={processedStops}
                    extraData={stopEstimates?.routeDirectionTimes[0]}
                    style={{ height: "100%" }}
                    contentContainerStyle={{ paddingBottom: 35, paddingLeft: 16 }}
                    onRefresh={() => client.invalidateQueries({ queryKey: ["stopEstimate"] })}
                    refreshing={false}
                    ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: theme.divider, marginVertical: 4 }} />}
                    renderItem={({ item: stop, index }) => {
                        return (
                            <StopCell
                                stop={stop}
                                route={selectedRoute}
                                direction={selectedRoute?.directionList[selectedDirectionIndex]?.direction!}
                                color={selectedRoute?.directionList[0]?.lineColor ?? "#909090"}
                                disabled={index === processedStops.length - 1}
                                setSheetPos={(pos) => sheetRef.current?.snapToIndex(pos)}
                            />
                        );
                    }}
                />
            }

            {!selectedRoute && (
                <View style={{ alignItems: 'center', marginTop: 16 }}>
                    <Text style={{ color: theme.text }}>Something went wrong.</Text>
                </View>
            )}
        </BottomSheetModal>
    )
}


export default RouteDetails;
