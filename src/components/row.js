import React, { memo } from 'react';
import { TouchableWithoutFeedback } from 'react-native';
import Animated from 'react-native-reanimated';

import style from '../style';

const Row = memo(({ row, move, renderItem, hidden, onPress, onDragStartCallback }) => {
  const onDragBegin = () => {
    if (onDragStartCallback) {
      onDragStartCallback();
    }
    const hoverComponent = renderItem({
      move,
      item: row.data,
      index: row.index,
    });
    move(hoverComponent, row);
  };

  const component = renderItem({
    move,
    item: row.data,
    index: row.index,
  });

  return (
    <TouchableWithoutFeedback
      onLongPress={onDragBegin}
      delayLongPress={300}
      onPress={onPress}>
      <Animated.View style={hidden ? style.invisible : style.visible}>
        {component}
      </Animated.View>
    </TouchableWithoutFeedback>
  );
});

export default Row;
