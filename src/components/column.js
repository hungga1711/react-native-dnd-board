import React, { useState, useEffect, useRef, useCallback } from "react";
import { View, TouchableWithoutFeedback } from "react-native";
import Animated from "react-native-reanimated";
import { FlatList } from "react-native-gesture-handler";

import style from "../style";
import Row from "./row";

const Column = ({
  repository,
  move,
  column,
  keyExtractor,
  renderRow,
  scrollEnabled,
  columnWidth,
  onRowPress = () => {},
}) => {
  const [rows, setRows] = useState(column.rows);
  const [forceRenderWidth, setForceRenderWidth] = useState(0);

  const verticalOffset = useRef(0);
  const listRef = useRef();

  const onScroll = useCallback((event) => {
    verticalOffset.current = event.nativeEvent.contentOffset.x;
  }, []);

  const onScrollEnd = useCallback(
    (event) => {
      verticalOffset.current = event.nativeEvent.contentOffset.x;
      column.measureRowLayout();
    },
    [column]
  );

  const renderRowItem = ({ item, index }) => {
    return (
      <View
        ref={(ref) => repository.updateRowRef(column.id, item.id, ref)}
        onLayout={(layout) => repository.updateRowLayout(column.id, item.id)}
      >
        <Row
          row={item}
          move={move}
          renderItem={renderRow}
          hidden={item.hidden}
          onPress={() => onRowPress(item)}
        />
      </View>
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  };

  const reload = () => {
    const items = repository.getRowsByColumnId(column.id);
    setRows([...items]);
  };

  useEffect(() => {
    repository.addListener(column.id, "reload", reload);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setRows(column.rows);
  }, [column.id, column.rows, repository]);

  const setRef = (ref) => {
    listRef.current = ref;
    repository.setColumnScrollRef(column.id, listRef.current);
  };

  return (
    <View style={[style.container, { minWidth: columnWidth }]}>
      <FlatList
        ref={setRef}
        data={rows}
        extraData={[rows, rows.length, column.rows]}
        renderItem={renderRowItem}
        keyExtractor={keyExtractor}
        nestedScrollEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={scrollEnabled}
        onScroll={onScroll}
        onScrollEndDrag={onScrollEnd}
        onMomentumScrollEnd={onScrollEnd}
      />
    </View>
  );
};

export default Column;
