import React, { memo, useEffect } from 'react';
import { MapMarker, Marker } from 'react-native-maps';
import { IDirection, IMapRoute, IPatternPoint } from 'utils/interfaces';
import StopCallout from '../StopCallout';
import { View } from 'react-native';

interface Props {
    point: IPatternPoint
    tintColor: string
    fillColor: string
    borderColor: string
    route: IMapRoute
    direction: IDirection
    isCalloutShown?: boolean
}

// Stop marker with callout
const StopMarker: React.FC<Props> = ({ point, tintColor, fillColor, borderColor, route, direction, isCalloutShown=false }) => {
    const markerRef = React.useRef<MapMarker>(null);

    // If the global poppedUpStopCallout is the same as the current stop, show the callout on screen
    useEffect(() => {
        if (isCalloutShown) {
            markerRef.current?.showCallout();
        }
    }, [isCalloutShown])

    return (
        <Marker
            ref={markerRef}
            coordinate={{
                latitude: point.latitude,
                longitude: point.longitude
            }}
            tracksViewChanges={false}
            anchor={{x: 1, y: 1}}
            pointerEvents="auto"
        >
            <View
                style={{
                    width: 16,
                    height: 16,
                    borderWidth: 2,
                    borderRadius: 9999,
                    backgroundColor: fillColor,
                    borderColor: borderColor,
                }}
            />
            <StopCallout
                stop={point.stop!}
                tintColor={tintColor}
                route={route}
                direction={direction}
            />
        </Marker>
    );
};

export default memo(StopMarker);
