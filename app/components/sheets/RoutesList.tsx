import React, { memo, useEffect, useState } from "react";
import { ActivityIndicator, View, TouchableOpacity, Text, NativeSyntheticEvent } from "react-native";
import SegmentedControl, { NativeSegmentedControlIOSChangeEvent } from "@react-native-segmented-control/segmented-control";
import { BottomSheetModal, BottomSheetView, BottomSheetFlatList } from "@gorhom/bottom-sheet";
import { FontAwesome, MaterialIcons } from '@expo/vector-icons';

import { IDirectionList, IMapRoute } from "../../../utils/interfaces";
import useAppStore from "../../data/app_state";
import BusIcon from "../ui/BusIcon";
import SheetHeader from "../ui/SheetHeader";
import AlertPill from "../ui/AlertPill";
import IconPill from "../ui/IconPill";
import { useRoutes } from "app/data/api_query";
import { useDefaultRouteGroup, useFavorites } from "app/data/storage_query";

interface SheetProps {
    sheetRef: React.RefObject<BottomSheetModal>
}

// Display routes list for all routes and favorite routes
const RoutesList: React.FC<SheetProps> = ({ sheetRef }) => {
    const setSelectedRoute = useAppStore((state) => state.setSelectedRoute);
    const selectedRouteCategory = useAppStore(state => state.selectedRouteCategory);
    const setSelectedRouteCategory = useAppStore(state => state.setSelectedRouteCategory);
    const setDrawnRoutes = useAppStore((state) => state.setDrawnRoutes);
    const presentSheet = useAppStore((state) => state.presentSheet);
    const theme = useAppStore((state) => state.theme);

    const [shouldUpdateData, setShouldUpdateData] = useState(false);

    const { data: routes, isLoading: isRoutesLoading } = useRoutes();
    const { data: favorites, isLoading: isFavoritesLoading } = useFavorites(shouldUpdateData);
    const { data: defaultGroup, refetch: refetchDefaultGroup } = useDefaultRouteGroup(shouldUpdateData);

    const handleRouteSelected = (selectedRoute: IMapRoute) => {        
        // prevent the sheet from updating the data when it is closed, causes sheet to open :/
        setShouldUpdateData(false);

        setSelectedRoute(selectedRoute);
        setDrawnRoutes([selectedRoute]);
        presentSheet("routeDetails");
    }

    useEffect(() => {
        setSelectedRouteCategory(defaultGroup === 0 ? "all" : "favorites");
    }, [defaultGroup]);

    // Update the shown routes when the selectedRouteCategory changes
    useEffect(() => {
        if (!routes) return;

        if (selectedRouteCategory === "all") {
            setDrawnRoutes(routes);
        } else {
            setDrawnRoutes(favorites ?? []);
        }
    }, [selectedRouteCategory, routes, favorites]);



    // Update the favorites when the view is focused
    function onAnimate(from: number, _: number) {
        if (from === -1) {
            // update the favorites when the view is focused
            setShouldUpdateData(true);
            refetchDefaultGroup()

            // match the selectedRouteCategory on the map
            if (selectedRouteCategory === "all") {
                setDrawnRoutes(routes ?? []);
            } else {
                setDrawnRoutes(favorites ?? []);
            }
        }
    }

    const handleSetSelectedRouteCategory = (evt: NativeSyntheticEvent<NativeSegmentedControlIOSChangeEvent>) => {
        setSelectedRouteCategory(evt.nativeEvent.selectedSegmentIndex === 0 ? "all" : "favorites");
    }

    const snapPoints = ['25%', '45%', '85%'];

    return (
        <BottomSheetModal 
            ref={sheetRef} 
            snapPoints={snapPoints} 
            index={1} 
            enableDismissOnClose={false}
            enablePanDownToClose={false}
            onAnimate={onAnimate}
            backgroundStyle={{ backgroundColor: theme.background }}
            handleIndicatorStyle={{ backgroundColor: theme.divider }}
        >
            <BottomSheetView>
                <SheetHeader 
                    title="Routes" 
                    icon={
                    <View style={{flexDirection: "row", alignContent: "center"}}>
                        <AlertPill />
                        <TouchableOpacity style={{ marginLeft: 10 }} onPress={ () => {
                            setShouldUpdateData(false);
                            presentSheet("settings")
                        }}>
                            <IconPill 
                                icon={<MaterialIcons name="settings" size={16} color={theme.text} />}
                            />
                        </TouchableOpacity>
                    </View>}
                />

                <SegmentedControl
                    values={['All Routes', 'Favorites']}
                    selectedIndex={selectedRouteCategory === 'all' ? 0 : 1}
                    style={{ marginHorizontal: 16 }}
                    onChange={handleSetSelectedRouteCategory}
                />
                <View style={{height: 1, backgroundColor: theme.divider, marginTop: 8}} />

                { (!isFavoritesLoading) && selectedRouteCategory === "favorites" && favorites?.length === 0 && routes?.length != 0 && (
                    <View style={{ alignItems: 'center', marginTop: 16 }}>
                        <Text style={{color: theme.text}}>You have no favorited routes.</Text>
                    </View>
                )}

                {/* Loading indicatior */}
                { (isRoutesLoading || !routes) && <ActivityIndicator style={{ marginTop: 12 }} /> }
            </BottomSheetView>

            <BottomSheetFlatList
                contentContainerStyle={{ paddingBottom: 35 }}
                data={routes?.filter(route => selectedRouteCategory === "all" || favorites?.includes(route)) ?? []}
                keyExtractor={(route: IMapRoute) => route.key}
                style={{ marginLeft: 16 }}
                renderItem={({item: route}) => {
                    return (
                        <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 8 }} onPress={() => handleRouteSelected(route)}>
                            <BusIcon name={route.shortName} color={route.directionList[0]?.lineColor ?? "#000"} style={{ marginRight: 12 }} />
                            <View>                                
                                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                                    <Text style={{ fontWeight: 'bold', fontSize: 20, lineHeight: 28, color: theme.text }}>{route.name}</Text>
                                    {favorites?.includes(route) && 
                                        <FontAwesome name="star" size={16} color={theme.starColor} style={{marginLeft: 4}} />
                                    }
                                </View>
                                { route.directionList.length > 1 ?
                                    <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                                        {route.directionList.map((elm: IDirectionList, index: number) => (
                                            <React.Fragment key={index}>
                                                <Text style={{ color: theme.text }}>{elm.destination}</Text>
                                                {index !== route.directionList.length - 1 && <Text style={{ marginHorizontal: 2, color: theme.text }}>|</Text>}
                                            </React.Fragment>
                                        ))}
                                    </View>
                                    :
                                    <Text style={{ color: theme.text }}>Campus Circulator</Text>
                                } 
                            </View>
                        </TouchableOpacity>
                    )
                }}
            />
            
        </BottomSheetModal>
    )
}

export default memo(RoutesList)