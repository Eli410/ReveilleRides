import AsyncStorage from "@react-native-async-storage/async-storage";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { Alert } from "react-native";
import { IMapRoute } from "utils/interfaces";
import { useRoutes } from "./api_query";

export const useFavorites = (allowUpdate: boolean = true) => {
    const client = useQueryClient();

    const query = useQuery({
        queryKey: ["favorites"],
        queryFn: async () => {
            const routes = client.getQueryData(["routes"]) as IMapRoute[];

            const favorites = await AsyncStorage.getItem('favorites')
            if (!favorites) return;

            var favoritesArray = JSON.parse(favorites);

            // uuid regex
            const uuidRegex = new RegExp("^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$");

            if (favoritesArray.some((fav: string) => uuidRegex.test(fav))) {
                console.log("Found a uuid in favorited, running migration steps...")

                // convert any uuids (based on regex) to the new route shortName
                favoritesArray = favoritesArray.map((fav: string) => {
                    // check if the favorite is a uuid
                    if (uuidRegex.test(fav)) {
                        const match = routes.find(route => route.key === fav);
                        
                        return match ? match.shortName : null; // return null if the route is not found
                    } else { 
                        // otherwise return the favorite
                        return fav;
                    }
                })

                // remove any undefined values
                favoritesArray = favoritesArray.filter((el: string | undefined) => el !== null);

                // deduplicate the array
                favoritesArray = [...new Set(favoritesArray)];

                // save the converted favorites to AsyncStorage
                AsyncStorage.setItem('favorites', JSON.stringify(favoritesArray));
            }

            // set the favorite routes
            return routes.filter(route => favoritesArray.includes(route.shortName));
        },
        staleTime: Infinity,
        enabled: useRoutes().isSuccess && allowUpdate
    });

    useEffect(() => {
        if (query.error) {
          Alert.alert("Error", "Something went wrong. Please try again later.");
        }
      }, [query.error])

    return query;
}

export const useFavorite = (routeShortName: string) => {
    const query = useQuery({
        queryKey: ["favorite", routeShortName],
        queryFn: async () => {
            const favorites = await AsyncStorage.getItem('favorites')
            if (!favorites) return;

            var favoritesArray = JSON.parse(favorites);

            return favoritesArray.includes(routeShortName);
        },
        staleTime: Infinity
    });

    useEffect(() => {
        if (query.error) {
          Alert.alert("Error", "Something went wrong. Please try again later.");
        }
      }, [query.error])

    return query;
}

export const addFavoriteMutation = () => {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationKey: ["addFavorite"],
        mutationFn: async (routeShortName: string) => {
            const favorites = await AsyncStorage.getItem('favorites')
            if (!favorites) return;

            var favoritesArray = JSON.parse(favorites);

            favoritesArray.push(routeShortName);

            await AsyncStorage.setItem('favorites', JSON.stringify(favoritesArray));
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["favorites"] });
            queryClient.invalidateQueries({ queryKey: ["favorite"] });
        }
    });

    return mutation;
}

export const removeFavoriteMutation = () => {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationKey: ["removeFavorite"],
        mutationFn: async (routeShortName: string) => {
            const favorites = await AsyncStorage.getItem('favorites')
            if (!favorites) return;

            var favoritesArray = JSON.parse(favorites);

            const newFavorites = favoritesArray.filter((fav: string) => fav !== routeShortName);

            await AsyncStorage.setItem('favorites', JSON.stringify(newFavorites));
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["favorites"] });
            queryClient.invalidateQueries({ queryKey: ["favorite"] });
        }
    });

    return mutation;
}

export const useDefaultRouteGroup = (allowUpdate: boolean = true) => {
    const query = useQuery({
        queryKey: ["defaultRouteGroup"],
        queryFn: async () => {
            const defaultGroup = await AsyncStorage.getItem('default-group');
            if (!defaultGroup) return 0;

            return Number(defaultGroup);
        },
        staleTime: Infinity,
        enabled: allowUpdate
    });

    useEffect(() => {
        if (query.error) {
          Alert.alert("Error", "Something went wrong. Please try again later.");
        }
      }, [query.error])

    return query;
}

export const defaultGroupMutation = () => {
    const mutation = useMutation({
        mutationKey: ["defaultGroup"],
        mutationFn: async (group: number) => {
            await AsyncStorage.setItem('default-group', group.toString());
        }
    });

    return mutation;
}