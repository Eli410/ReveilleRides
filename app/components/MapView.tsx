import React, { useState, useEffect } from "react";
import MapView, { AnimatedRegion } from 'react-native-maps';
import * as Location from 'expo-location';
import Ionicons from '@expo/vector-icons/Ionicons';
import { styled } from 'nativewind';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaInsetsContext } from "react-native-safe-area-context";

const StyledMapView = styled(MapView);

const Index: React.FC = () => {
    var mapViewRef: any;

    async function recenterView() {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            return;
        }

        let location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 2
        });

        if (!mapViewRef) {
            return;
        }

        mapViewRef.animateToRegion({
            latitude: location.coords.latitude, 
            longitude: location.coords.longitude, 
            latitudeDelta: 0.019075511625736397, 
            longitudeDelta: 0.011273115836317515 
        }, 250);
    }


    useEffect(() => {
        (async () => {
            recenterView()
        })();
    }, []);
    

    return (
        <StyledMapView 
            showsUserLocation={true}
            className='w-full h-full'
            ref = {(mapView) => { mapViewRef = mapView; }}
        >
            <SafeAreaInsetsContext.Consumer>
                {(insets) => ( 
                    <TouchableOpacity style={[styles.recenter, {top: 16 + insets.top}]}>
                        <Ionicons 
                            name="navigate" 
                            size={24} 
                            color="gray" 
                            onPress={() => recenterView()} />
                    </TouchableOpacity>
                )}
            </SafeAreaInsetsContext.Consumer>
        </StyledMapView>
    )
}

const styles =  StyleSheet.create({
    recenter: {
        position: "absolute", 
        right: 16,
        width: 50,
        height: 50,
        backgroundColor: "white",
        borderRadius: 8,
        overflow: "hidden",
        justifyContent: 'center',
        alignItems: 'center'
    }
})

export default Index;