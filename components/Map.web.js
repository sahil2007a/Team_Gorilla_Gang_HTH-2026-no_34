import React from 'react';
import { View } from 'react-native';

const MapView = React.forwardRef((props, ref) => <View ref={ref} {...props} />);
export const Marker = (props) => <View {...props} />;
export const Polygon = (props) => <View {...props} />;
export default MapView;
