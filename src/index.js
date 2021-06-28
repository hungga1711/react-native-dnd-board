import React, {
  useRef,
  useState,
  useCallback,
  useMemo,
  useEffect,
} from 'react';
import {
  PanGestureHandler,
  State,
  ScrollView,
} from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';

import style from './style';
import Column from './components/column';
import Repository from './handlers/repository';
import Utils from './commons/utils';

const { block, call, cond } = Animated;

const SCROLL_THRESHOLD = 50;
const SCROLL_STEP = 8;

const DraggableBoard = ({
  repository,
  renderColumnWrapper,
  renderRow,
  columnWidth,
  accessoryRight,
  activeRowStyle,
  activeRowRotation = 8,
  xScrollThreshold = SCROLL_THRESHOLD,
  yScrollThreshold = SCROLL_THRESHOLD,
  dragSpeedFactor = 1,
  onRowPress = () => { },
  onDragStart = () => { },
  onDragEnd = () => { },
  style: boardStyle,
  horizontal = true,
}) => {
  const [forceUpdate, setForceUpdate] = useState(false);
  const [hoverComponent, setHoverComponent] = useState(null);
  const [movingMode, setMovingMode] = useState(false);

  let translateX = useRef(new Animated.Value(0)).current;
  let translateY = useRef(new Animated.Value(0)).current;

  let absoluteX = useRef(new Animated.Value(0)).current;
  let absoluteY = useRef(new Animated.Value(0)).current;

  const scrollViewRef = useRef();
  const scrollOffset = useRef(0);
  const hoverRowItem = useRef();

  useEffect(() => {
    repository.setReload(() => setForceUpdate(prevState => !prevState));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onPanGestureEvent = useMemo(
    () =>
      Animated.event(
        [
          {
            nativeEvent: {
              translationX: translateX,
              translationY: translateY,
              absoluteX,
              absoluteY,
            },
          },
        ],
        { useNativeDriver: true },
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const onHandlerStateChange = event => {
    switch (event.nativeEvent.state) {
      case State.CANCELLED:
      case State.END:
      case State.FAILED:
      case State.UNDETERMINED:
        if (movingMode) {
          translateX.setValue(0);
          translateY.setValue(0);

          absoluteX.setValue(0);
          absoluteY.setValue(0);

          setHoverComponent(null);
          setMovingMode(false);

          if (onDragEnd) {
            onDragEnd(
              hoverRowItem.current.oldColumnId,
              hoverRowItem.current.columnId,
              hoverRowItem.current,
            );

            repository.updateOriginalData();
          }

          repository.showRow(hoverRowItem.current);
          hoverRowItem.current = null;
        }

        break;
    }
  };

  const listenRowChangeColumn = (fromColumnId, toColumnId) => {
    hoverRowItem.current.columnId = toColumnId;
    hoverRowItem.current.oldColumnId = fromColumnId;
  };

  const handleRowPosition = ([x, y]) => {
    if (hoverRowItem.current && (x || y)) {
      const columnAtPosition = repository.moveRow(
        hoverRowItem.current,
        x,
        y,
        listenRowChangeColumn,
      );

      if (columnAtPosition && scrollViewRef.current) {
        // handle scroll horizontal
        if (x + xScrollThreshold > Utils.deviceWidth) {
          scrollOffset.current += SCROLL_STEP;
          scrollViewRef.current.scrollTo({
            x: scrollOffset.current * dragSpeedFactor,
            y: 0,
            animated: true
          });
          repository.measureColumnsLayout();
        } else if (x < xScrollThreshold) {
          scrollOffset.current -= SCROLL_STEP;
          scrollViewRef.current.scrollTo({
            x: scrollOffset.current / dragSpeedFactor,
            y: 0,
            animated: true
          });
          repository.measureColumnsLayout();
        }

        // handle scroll inside item
        // if (y + SCROLL_THRESHOLD > columnAtPosition.layout.y) {
        //   repository.columns[columnAtPosition.id].scrollOffset(y + SCROLL_STEP);
        // } else if (y < SCROLL_THRESHOLD) {
        //   repository.columns[columnAtPosition.id].scrollOffset(y - SCROLL_STEP);
        // }
      }
    }
  };

  const handleColumnPosition = ([x, y]) => {
    //
  };

  const onScroll = event => {
    scrollOffset.current = event.nativeEvent.contentOffset.x;
  };

  const onScrollEnd = event => {
    scrollOffset.current = event.nativeEvent.contentOffset.x;
    repository.measureColumnsLayout();
  };

  const keyExtractor = useCallback(
    (item, index) => `${item.id}${item.name}${index}`,
    [],
  );

  const renderHoverComponent = () => {
    if (hoverComponent && hoverRowItem.current) {
      
      const row = repository.findRow(hoverRowItem.current);
      
      if (row && row.layout) {
        const { x, y, width, height } = row.layout;
        const hoverStyle = [
          style.hoverComponent,
          activeRowStyle,
          {
            transform: [{ translateX }, { translateY }, { rotate: `${activeRowRotation}deg` }],
          },
          {
            top: y - yScrollThreshold,
            left: x,
            width,
            height,
          },
        ];

        return (
          <Animated.View style={hoverStyle}>{hoverComponent}</Animated.View>
        );
      }
    }
  };

  const moveItem = async (hoverItem, rowItem, isColumn = false) => {
    rowItem.setHidden(true);
    repository.hideRow(rowItem);
    await rowItem.measureLayout();
    hoverRowItem.current = { ...rowItem };

    setMovingMode(true);
    setHoverComponent(hoverItem);
  };

  const drag = column => {
    const hoverColumn = renderColumnWrapper({
      move: moveItem,
      item: column.data,
      index: column.index,
    });
    moveItem(hoverColumn, column, true);
  };

  const renderColumns = () => {
    const columns = repository.getColumns();
    return columns.map((column, index) => {
      const key = keyExtractor(column, index);

      const columnComponent = (
        <Column
          repository={repository}
          column={column}
          move={moveItem}
          renderColumnWrapper={renderColumnWrapper}
          keyExtractor={keyExtractor}
          renderRow={renderRow}
          scrollEnabled={!movingMode}
          columnWidth={columnWidth}
          onRowPress={onRowPress}
          onDragStartCallback={onDragStart}
        />
      );

      return renderColumnWrapper({
        item: column.data,
        index: column.index,
        columnComponent,
        drag: () => drag(column),
        layoutProps: {
          key,
          ref: ref => repository.updateColumnRef(column.id, ref),
          onLayout: layout => repository.updateColumnLayout(column.id),
        },
      });
    });
  };

  return (
    <PanGestureHandler
      onGestureEvent={onPanGestureEvent}
      onHandlerStateChange={onHandlerStateChange}>
      <Animated.View style={[style.container, boardStyle]}>
        <ScrollView
          ref={scrollViewRef}
          scrollEnabled={!movingMode}
          horizontal={horizontal}
          nestedScrollEnabled
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={onScroll}
          onScrollEndDrag={onScrollEnd}
          onMomentumScrollEnd={onScrollEnd}>
          {renderColumns()}

          <Animated.Code>
            {() =>
              block([
                cond(
                  movingMode,
                  call([absoluteX, absoluteY], handleRowPosition),
                ),
                cond(
                  movingMode,
                  call([translateX, translateY], handleColumnPosition),
                ),
              ])
            }
          </Animated.Code>

          {Utils.isFunction(accessoryRight) ? accessoryRight() : accessoryRight}
        </ScrollView>
        {renderHoverComponent()}
      </Animated.View>
    </PanGestureHandler>
  );
};

export default DraggableBoard;
export { Repository };
