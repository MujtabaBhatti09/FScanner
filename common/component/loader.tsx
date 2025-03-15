import * as React from 'react';
import { ActivityIndicator, MD2Colors } from 'react-native-paper';

export default function Loader() {
    return (
        <ActivityIndicator animating={true} color={MD2Colors.red800} />
    );
}