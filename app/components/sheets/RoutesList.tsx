import React, { useEffect, useState } from "react";
import { ActivityIndicator, View, TouchableOpacity, Text } from "react-native";
import { MaterialCommunityIcons, FontAwesome } from '@expo/vector-icons';
import BusIcon from "../ui/BusIcon";
import useAppStore from "../../stores/useAppStore";
import { IMapRoute } from "utils/updatedInterfaces";
import SegmentedControl from "@react-native-segmented-control/segmented-control";
import SheetHeader from "../ui/SheetHeader";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BottomSheetModal, BottomSheetView, BottomSheetFlatList } from "@gorhom/bottom-sheet";

interface SheetProps {
    sheetRef: React.RefObject<BottomSheetModal>
}

const RoutesList: React.FC<SheetProps> = ({ sheetRef }) => {
    const routes = useAppStore((state) => state.routes);
    const alerts = useAppStore((state) => state.mapServiceInterruption);
    const drawnRoutes = useAppStore((state) => state.drawnRoutes);

    const setDrawnRoutes = useAppStore((state) => state.setDrawnRoutes);
    const setSelectedRoute = useAppStore((state) => state.setSelectedRoute);
    const presentSheet = useAppStore((state) => state.presentSheet);

    const [selectedRouteCategory, setSelectedRouteCategory] = useState<"favorites" | "all">("all");
    const [favorites, setFavorites] = useState<string[]>([]);
    const [alertIcon, setAlertIcon] = useState<"bell-outline" | "bell-badge">("bell-outline");

    const handleRouteSelected = (selectedRoute: IMapRoute) => {
        setSelectedRoute(selectedRoute);
        setDrawnRoutes([selectedRoute]);
        presentSheet("routeDetails");
    }

    function loadFavorites() {
        AsyncStorage.getItem('favorites').then((favorites: string | null) => {
            if (!favorites) return;

            const favoritesArray = JSON.parse(favorites);
            setFavorites(favoritesArray);
        })
    }

    // Load favorites on first render
    useEffect(() => loadFavorites(), []);

    // Update the shown routes when the selectedRouteCategory changes
    useEffect(() => {
        if (selectedRouteCategory === "all") {
            setDrawnRoutes(routes);
        } else {
            const filtered = routes.filter(route => favorites.includes(route.key));
            setDrawnRoutes(filtered);
        }
    }, [selectedRouteCategory, routes, favorites]);

    // Update the alert icon when the alerts change
    useEffect(() => {
        if (alerts.length > 0) {
            setAlertIcon("bell-badge");
        } else {
            setAlertIcon("bell-outline");
        }
    }, [alerts]);

    // Update the favorites when the view is focused
    function onAnimate(from: number, to: number) {
        if (from === -1 && to === 1) {
            loadFavorites();

            // match the selectedRouteCategory on the map
            if (selectedRouteCategory === "all") {
                setDrawnRoutes(routes);
            } else {
                const filtered = routes.filter(route => favorites.includes(route.key));
                setDrawnRoutes(filtered);
            }

            //TODO: write global fucntion to recenter map on drawn routes, right now it just goes back to default
        }
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
        >
            <BottomSheetView>
                <SheetHeader 
                    title="Routes" 
                    icon={
                        <TouchableOpacity style={{ marginLeft: 10 }} onPress={() => presentSheet("alerts")}>
                            <MaterialCommunityIcons name={alertIcon} size={28} color="black" />
                        </TouchableOpacity>
                    }
                />

                <SegmentedControl
                    values={['All Routes', 'Favorites']}
                    selectedIndex={0}
                    style={{ marginHorizontal: 16 }}
                    onChange={(event) => {
                        setSelectedRouteCategory(event.nativeEvent.selectedSegmentIndex === 0 ? "all" : "favorites");
                    }}
                />

                { selectedRouteCategory === "favorites" && drawnRoutes.length === 0 && (
                    <View style={{ alignItems: 'center', marginTop: 16 }}>
                        <Text>You have no favorited routes.</Text>
                    </View>
                )}

                {/* Loading indicatior */}
                { routes.length == 0 && <ActivityIndicator style={{ marginTop: 8 }} /> }
            </BottomSheetView>

            <BottomSheetFlatList
                contentContainerStyle={{ paddingBottom: 30 }}
                data={drawnRoutes}
                keyExtractor={route => route.key}
                style={{ marginLeft: 16 }}
                renderItem={({ item: route }) => {
                    return (
                        <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 8 }} onPress={() => handleRouteSelected(route)}>
                            <BusIcon name={route.shortName} color={route.directionList[0]?.lineColor ?? "#000"} style={{ marginRight: 12 }} />
                            <View>                                
                                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                                    <Text style={{ fontWeight: 'bold', fontSize: 20, lineHeight: 28 }}>{route.name}</Text>
                                    {favorites.includes(route.key) && 
                                        <FontAwesome name="star" size={16} color="#ffcc01" style={{marginLeft: 4}} />
                                    }
                                </View>
                                <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                                    {route.directionList.map((elm, index) => (
                                        <React.Fragment key={index}>
                                            <Text>{elm.destination}</Text>
                                            {index !== route.directionList.length - 1 && <Text style={{ marginHorizontal: 2 }}>|</Text>}
                                        </React.Fragment>
                                    ))}
                                </View>
                            </View>
                        </TouchableOpacity>
                    )
                }}
            />
            
        </BottomSheetModal>
    )
}

export default RoutesList