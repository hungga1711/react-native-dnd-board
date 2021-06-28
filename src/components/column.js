import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View } from 'react-native';
import { FlatList } from 'react-native-gesture-handler';

import style from '../style';
import Row from './row';

const Column = ({
  repository,
  move,
  column,
  keyExtractor,
  renderRow,
  scrollEnabled,
  columnWidth,
  onDragStartCallback,
  onRowPress = () => {},
}) => {
  const [rows, setRows] = useState(column.rows);

  const verticalOffset = useRef(0);
  const columnRef = useRef();

  const onScroll = useCallback(event => {
    verticalOffset.current = event.nativeEvent.contentOffset.x;
  }, []);

  const onScrollEnd = useCallback(
    event => {
      verticalOffset.current = event.nativeEvent.contentOffset.x;
      column.measureRowLayout();
    },
    [column],
  );

  const renderRowItem = ({ item, index }) => {
    return (
      <View
        ref={ref => repository.updateRowRef(column.id, item.id, ref)}
        onLayout={layout => repository.updateRowLayout(column.id, item.id)}>
        <Row
          row={item}
          move={move}
          renderItem={renderRow}
          hidden={item.hidden}
          onPress={() => onRowPress(item)}
          onDragStartCallback={onDragStartCallback}
        />
      </View>
    );
  };

  const reload = () => {
    const items = repository.getRowsByColumnId(column.id);
    setRows([...items]);
  };

  useEffect(() => {
    repository.addListener(column.id, 'reload', reload);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setRows(column.rows);
  }, [column.id, column.rows, column.rows.length, repository]);

  const setRef = ref => {
    columnRef.current = ref;
    repository.setColumnScrollRef(column.id, columnRef.current);
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
