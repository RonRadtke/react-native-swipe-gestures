import {GestureResponderEvent, PanResponder, PanResponderGestureState, View} from 'react-native';

type swipeDirections = 'SWIPE_UP' | 'SWIPE_DOWN' | 'SWIPE_LEFT' | 'SWIPE_RIGHT';

interface SwipeConfig {
    velocityThreshold: number;
    directionalOffsetThreshold: number;
    gestureIsClickThreshold: number;
    needVerticalScroll: boolean;
    scrollVerticalThreshold: number;
    swipeEnabled: boolean;
}

interface GestureHandlerProps {
    config: Partial<SwipeConfig>;
    swipeEnabled?: boolean;
    responderTerminationRequest?: boolean;
    onSwipe?: (direction: string, gestureState: PanResponderGestureState) => void;
    onSwipeUp?: (gestureState: PanResponderGestureState) => void;
    onSwipeDown?: (gestureState: PanResponderGestureState) => void;
    onSwipeLeft?: (gestureState: PanResponderGestureState) => void;
    onSwipeRight?: (gestureState: PanResponderGestureState) => void;
}

const defaultSwipeConfig: SwipeConfig = {
    velocityThreshold: 0.3,
    directionalOffsetThreshold: 80,
    gestureIsClickThreshold: 5,
    needVerticalScroll: false,
    scrollVerticalThreshold: 5,
    swipeEnabled: true,
};

export default function GestureHandler(props: GestureHandlerProps): JSX.Element {
    const _swipeConfig = {...defaultSwipeConfig, ...props.config};

    let _panResponder = PanResponder.create({
        onStartShouldSetPanResponder: _handleShouldSetPanResponder,
        onMoveShouldSetPanResponder: _handleShouldSetPanResponder,
        onPanResponderRelease: _handlePanResponderEnd,
        onPanResponderTerminate: _handlePanResponderEnd,
        onPanResponderTerminationRequest: _handleResponderTerminationRequest,
    });

    function _handleShouldSetPanResponder(evt: GestureResponderEvent, gestureState: PanResponderGestureState): boolean {
        // fix the problem that scroll view can't work inside on ios
        if (_swipeConfig.needVerticalScroll && (gestureState.dy > _swipeConfig.scrollVerticalThreshold || gestureState.dy < -_swipeConfig.scrollVerticalThreshold))
            return false;

        return !!props.swipeEnabled && evt.nativeEvent.touches.length === 1 && !_gestureIsClick(gestureState);
    }

    function _handleResponderTerminationRequest(): boolean {
        return props.responderTerminationRequest !== false;
    }

    function _gestureIsClick(gestureState: PanResponderGestureState) {
        return Math.abs(gestureState.dx) < _swipeConfig.gestureIsClickThreshold && Math.abs(gestureState.dy) < _swipeConfig.gestureIsClickThreshold;
    }

    function _handlePanResponderEnd(evt: GestureResponderEvent, gestureState: PanResponderGestureState) {
        let swipedir = _getSwipeDirection(gestureState);
        if (swipedir === null) return;

        _triggerSwipeHandlers(swipedir, gestureState);
    }

    function _triggerSwipeHandlers(swipeDirection: swipeDirections, gestureState: PanResponderGestureState) {
        const {onSwipe, onSwipeUp, onSwipeDown, onSwipeLeft, onSwipeRight} = props;
        onSwipe && onSwipe(swipeDirection, gestureState);
        switch (swipeDirection) {
            case 'SWIPE_LEFT':
                onSwipeLeft && onSwipeLeft(gestureState);
                break;
            case 'SWIPE_RIGHT':
                onSwipeRight && onSwipeRight(gestureState);
                break;
            case 'SWIPE_UP':
                onSwipeUp && onSwipeUp(gestureState);
                break;
            case 'SWIPE_DOWN':
                onSwipeDown && onSwipeDown(gestureState);
                break;
        }
    }

    function _getSwipeDirection(gestureState: PanResponderGestureState): swipeDirections | null {
        const {dx, dy} = gestureState,
            absDx = Math.abs(dx),
            absDy = Math.abs(dy),
            validHorizontal = _isValidHorizontalSwipe(gestureState),
            validVertical = _isValidVerticalSwipe(gestureState),
            horizontalDirection = dx > 0 ? 'SWIPE_RIGHT' : 'SWIPE_LEFT',
            verticalDirection = dy > 0 ? 'SWIPE_DOWN' : 'SWIPE_UP';
        //check which delta is larger and choose that order to evaluate
        if (absDx > absDy) {
            if (validHorizontal) {
                return horizontalDirection;
            } else if (validVertical)
                return verticalDirection;

        } else {
            if (validVertical)
                return verticalDirection;
            else if (validHorizontal)
                return horizontalDirection;

        }

        return null;
    }


    function _isValidSwipe(velocity: number, velocityThreshold: number, directionalOffset: number, directionalOffsetThreshold: number): boolean {
        return Math.abs(velocity) > velocityThreshold && Math.abs(directionalOffset) < directionalOffsetThreshold;
    }

    function _isValidHorizontalSwipe(gestureState: PanResponderGestureState): boolean {
        const {vx, dy} = gestureState;
        const {velocityThreshold, directionalOffsetThreshold} = defaultSwipeConfig;

        return _isValidSwipe(vx, velocityThreshold, dy, directionalOffsetThreshold);
    }

    function _isValidVerticalSwipe(gestureState: PanResponderGestureState): boolean {
        const {vy, dx} = gestureState;
        const {velocityThreshold, directionalOffsetThreshold} = defaultSwipeConfig;

        return _isValidSwipe(vy, velocityThreshold, dx, directionalOffsetThreshold);
    }

    return <View {...props} {..._panResponder.panHandlers} />;

}
