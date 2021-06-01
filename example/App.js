import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  SafeAreaView,
  View,
  Text,
  StatusBar,
  TouchableOpacity,
  Dimensions,
} from 'react-native';

import Board, { Repository } from 'react-native-dnd-board';

const mockData = [
  {
    id: '1',
    name: 'Column 1',
    rows: [
      {
        id: '11',
        name: 'Row 1 (Column 1)',
      },
      {
        id: '12',
        name: 'Row 2 (Column 1)',
      },
      {
        id: '13',
        name: 'Row 3 (Column 1)',
      },
      {
        id: '14',
        name: 'Row 4 (Column 1)',
      },
    ],
  },
  {
    id: '2',
    name: 'Column 2',
    rows: [
      {
        id: '21',
        name: 'Row 1 (Column 2)',
      },
      {
        id: '22',
        name: 'Row 2 (Column 2)',
      },
      {
        id: '23',
        name: 'Row 3 (Column 2)',
      },
    ],
  },
  {
    id: '3',
    name: 'Column 3',
    rows: [
      {
        id: '31',
        name: 'Row 1 (Column 3)',
      },
      {
        id: '32',
        name: 'Row 2 (Column 3)',
      },
    ],
  },
];

let mockDataLength = mockData.length;
let mockDataRowLength = {};
mockData.forEach(column => {
  mockDataRowLength[column.id] = column.rows.length;
});

const COLUMN_WIDTH = Dimensions.get('window').width * 0.6;

const App = () => {
  const [repository] = useState(new Repository(mockData));

  const addCard = columnId => {
    const data = {
      id: `${columnId}${++mockDataRowLength[columnId]}`,
      name: `Row ${mockDataRowLength[columnId]} (Column ${columnId})`,
    };

    // Call api add row here
    // Add row to the board
    repository.addRow(columnId, data);
  };

  const updateCard = (cardId, data) => {
    const dummy = data || { name: 'Row updated' };

    // Call api update row here
    // Update row on the board
    repository.updateRow(cardId, dummy);
  };

  const deleteCard = cardId => {
    // Call api delete row here
    // Delete row on the board
    repository.deleteRow(cardId);
  };

  const renderCard = ({ item }) => {
    return (
      <View style={styles.card}>
        <Text>{item.name}</Text>
        <TouchableOpacity
          hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          onPress={() => deleteCard(item.id)}>
          <Text>✕</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const addColumn = () => {
    mockDataRowLength[++mockDataLength] = 0;
    const column = {
      id: mockDataLength,
      name: `Column ${mockDataLength}`,
      rows: [],
    };

    // Call api add column here
    mockData.push(column);

    // Add column to the board
    repository.addColumn(column);
  };

  const updateColumn = (columnId, data) => {
    const dummy = data || { name: 'Column name updated' };

    // Call api update column here
    const columnIndex = mockData.findIndex(column => column.id === columnId);
    if (columnIndex > -1) {
      mockData[columnIndex].name = dummy.name;
    }

    // Update column on the board
    repository.updateColumn(columnId, dummy);
  };

  const deleteColumn = columnId => {
    // Call api delete column here
    const columnIndex = mockData.findIndex(column => column.id === columnId);
    if (columnIndex > -1) {
      mockData.splice(columnIndex, 1);
    }

    // Delete column on the board
    repository.deleteColumn(columnId);
  };

  const renderColumn = ({ item, columnComponent, layoutProps, index }) => {
    return (
      <View style={styles.column} {...layoutProps}>
        <View style={styles.columnHeader}>
          <Text style={styles.columnName}>{item.name}</Text>
          <TouchableOpacity
            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
            onPress={() => deleteColumn(item.id)}>
            <Text>✕</Text>
          </TouchableOpacity>
        </View>
        {columnComponent}
        <TouchableOpacity
          style={styles.addCard}
          onPress={() => addCard(item.id)}>
          <Text>+ Add Card</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const onCardPress = card => {
    console.log('Card ID: ', card.id);
  };

  const onDragEnd = (fromColumnId, toColumnId, card) => {
    //
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#014A81" />
      <View style={styles.header}>
        <Text style={styles.hederName}>React Native DnD Board</Text>
      </View>

      <Board
        style={styles.board}
        repository={repository}
        renderRow={renderCard}
        renderColumnWrapper={renderColumn}
        onRowPress={onCardPress}
        onDragEnd={onDragEnd}
        columnWidth={COLUMN_WIDTH}
        accessoryRight={
          <View style={[styles.column, styles.addColumn]}>
            <TouchableOpacity onPress={addColumn}>
              <Text>+ Add Column</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  hederName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  board: {
    paddingVertical: 16,
    backgroundColor: '#E0E8EF',
  },
  column: {
    backgroundColor: '#F8FAFB',
    marginLeft: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 4,
  },
  columnHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  columnName: {
    fontWeight: 'bold',
  },
  addColumn: {
    marginRight: 12,
    padding: 12,
    minWidth: COLUMN_WIDTH,
  },
  card: {
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#F6F7FB',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingVertical: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  addCard: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgb(233, 233, 233)',
    borderRadius: 4,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#F5F6F8',
  },
});

export default App;
