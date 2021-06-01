import ColumnItem from './column-item';
import RowItem from './row-item';
import Mover from './mover';
import Utils from '../commons/utils';

export default class Repository {
  constructor(data) {
    this.columns = {};
    this.originalData = {};

    this.initialData(data);
    this.mover = new Mover();
    this.listeners = {};
    this.reload = null;
  }

  setReload = callback => {
    this.reload = callback;
  };

  addListener = (columnId, event, callback) => {
    this.listeners[columnId] = {
      ...this.listeners[columnId],
      [event]: callback,
    };
  };

  notify(columnId, event) {
    if (this.listeners[columnId]) {
      this.listeners[columnId][event]();
    }
  }

  initialData = data => {
    data.forEach((column, columnIndex) => {
      const rows = column.rows.map((item, index) => {
        return new RowItem({
          id: item.id,
          index,
          columnId: column.id,
          data: item,
        });
      });

      this.columns[column.id] = new ColumnItem({
        id: column.id,
        index: columnIndex,
        data: column,
        rows,
      });

      this.originalData[column.id] = {
        id: column.id,
        index: columnIndex,
        rows: rows.map(row => ({
          id: row.id,
          index: row.index,
        })),
      };
    });
  };

  updateData = data => {
    data.forEach((column, columnIndex) => {
      const rows = column.rows.map((item, index) => {
        let existingAttributes = {};

        if (this.columns[column.id]) {
          const existingIndex = this.columns[column.id].rows.findIndex(
            row => row.id === item.id,
          );
          if (existingIndex > -1) {
            existingAttributes =
              this.columns[column.id].rows[existingIndex].getAttributes();
          }
        }

        return new RowItem({
          ...existingAttributes,
          id: item.id,
          index,
          columnId: column.id,
          data: item,
        });
      });

      let existingColumnAttributes = {};
      if (this.columns[column.id]) {
        existingColumnAttributes = this.columns[column.id].getAttributes();
      }
      this.columns[column.id] = new ColumnItem({
        ...existingColumnAttributes,
        id: column.id,
        index: columnIndex,
        data: column,
        rows,
      });

      this.originalData[column.id] = {
        id: column.id,
        index: columnIndex,
        rows: rows.map(row => ({
          id: row.id,
          index: row.index,
        })),
      };
    });
  };

  addColumn = (column, index) => {
    const newColumn = new ColumnItem({
      id: column.id,
      index: index || Object.keys(this.columns).length,
      data: column,
      rows: column.rows || [],
    });

    this.columns[column.id] = newColumn;
    this.originalData[column.id] = newColumn;

    if (Utils.isFunction(this.reload)) {
      this.reload();
    }
  };

  updateColumn = (columnId, data) => {
    this.columns[columnId] = {
      ...this.columns[columnId],
      ...data,
      data,
    };
    this.originalData[columnId] = this.columns[columnId];

    if (Utils.isFunction(this.reload)) {
      this.reload();
    }
  };

  deleteColumn = columnId => {
    delete this.columns[columnId];
    delete this.originalData[columnId];

    // Update column index
    Object.keys(this.columns).forEach((id, index) => {
      this.columns[id].index = index;
      this.originalData[id].index = index;
    });

    if (Utils.isFunction(this.reload)) {
      this.reload();
    }
  };

  addRow = (columnId, data) => {
    const rowItem = new RowItem({
      id: data.id,
      columnId,
      data,
      index: this.columns[columnId].rows.length,
    });

    this.columns[columnId].rows.push(rowItem);
    this.notify(columnId, 'reload');
  };

  updateRow = (rowId, data) => {
    // Manual find index to optimize loop time
    let rowIndex = -1;
    let columnId = '';

    const columnIndex = Object.values(this.columns).findIndex(column => {
      const i = column.rows.findIndex(row => row.id === rowId);
      if (i > -1) {
        columnId = column.id;
        rowIndex = i;
        return true;
      } else {
        return false;
      }
    });

    if (columnIndex > -1 && columnId) {
      this.columns[columnId].rows[rowIndex].data = data;
      this.originalData[columnId].rows[rowIndex].data = data;

      if (Utils.isFunction(this.reload)) {
        this.reload();
      }
    }
  };

  deleteRow = rowId => {
    // Manual find index to optimize loop time
    let rowIndex = -1;
    let columnId = '';

    const columnIndex = Object.values(this.columns).findIndex(column => {
      const i = column.rows.findIndex(row => row.id === rowId);
      if (i > -1) {
        columnId = column.id;
        rowIndex = i;
        return true;
      } else {
        return false;
      }
    });

    if (columnIndex > -1 && columnId) {
      this.columns[columnId].rows.splice(rowIndex, 1);
      this.originalData[columnId].rows.splice(rowIndex, 1);

      if (Utils.isFunction(this.reload)) {
        this.reload();
      }
    }
  };

  updateOriginalData = () => {
    Object.keys(this.columns).forEach(columnId => {
      this.originalData[columnId] = {
        id: this.columns[columnId].id,
        index: this.columns[columnId].index,
        rows: this.columns[columnId].rows.map(row => ({
          id: row.id,
          index: row.index,
        })),
      };
    });
  };

  getItemsChanged = () => {
    const columns = [];
    const rows = [];

    Object.keys(this.originalData).forEach(columnId => {
      if (this.originalData[columnId].index !== this.columns[columnId].index) {
        columns.push({ id: columnId, index: this.columns[columnId].index });
      }

      this.columns[columnId].rows.forEach(row => {
        const rowIndex = this.originalData[columnId].rows.findIndex(
          item => item.id === row.id,
        );
        if (rowIndex > -1 && row.index !== rowIndex) {
          rows.push({ id: row.id, index: row.index });
        }
      });
    });

    return { columns, rows };
  };

  getColumns = () => {
    return Object.values(this.columns).sort((a, b) =>
      a.index < b.index ? -1 : 1,
    );
  };

  getColumnById = columnId => {
    return this.columns[columnId];
  };

  getRowsByColumnId = columnId => {
    return this.columns[columnId].rows;
  };

  updateColumnRef = (columnId, ref) => {
    if (this.columns[columnId]) {
      this.columns[columnId].setRef(ref);
    }
  };

  updateColumnLayout = (columnId, offset) => {
    if (this.columns[columnId]) {
      this.columns[columnId].measureLayout(offset);
    }
  };

  measureColumnsLayout = scrollOffset => {
    Object.keys(this.columns).forEach(columnId => {
      this.columns[columnId].measureLayout(scrollOffset);
    });
  };

  updateRowRef = (columnId, rowId, ref) => {
    if (this.columns[columnId]) {
      const rowIndex = this.columns[columnId].rows.findIndex(
        row => row.id === rowId,
      );
      if (rowIndex > -1 && this.columns[columnId].rows[rowIndex].setRef) {
        this.columns[columnId].rows[rowIndex].setRef(ref);
      }
    }
  };

  updateRowLayout = (columnId, rowId) => {
    const rowIndex = this.columns[columnId].rows.findIndex(
      row => row.id === rowId,
    );
    if (rowIndex > -1 && this.columns[columnId].rows[rowIndex].measureLayout) {
      this.columns[columnId].rows[rowIndex].measureLayout();
    }
  };

  hideRow = row => {
    const rowIndex = this.columns[row.columnId].rows.findIndex(
      item => item.id === row.id,
    );
    if (rowIndex > -1) {
      this.columns[row.columnId].rows[rowIndex].setHidden(true);
    }
  };

  showRow = row => {
    const rowIndex = this.columns[row.columnId].rows.findIndex(
      item => item.id === row.id,
    );
    if (rowIndex > -1) {
      this.columns[row.columnId].rows[rowIndex].setHidden(false);
    }
  };

  findRow = row => {
    return this.columns[row.columnId].rows.find(item => item.id === row.id);
  };

  moveRow = (draggedRow, x, y, changeColumnCallback) => {
    const rowIndex = this.columns[draggedRow.columnId].rows.findIndex(
      item => item.id === draggedRow.id,
    );

    if (rowIndex > -1) {
      const row = this.columns[draggedRow.columnId].rows[rowIndex];

      const fromColumnId = row.columnId;
      const columnAtPosition = this.mover.findColumnAtPosition(
        this.getColumns(),
        x,
        y,
      );

      if (!columnAtPosition) {
        return;
      }
      const toColumnId = columnAtPosition.id;
      if (toColumnId !== fromColumnId) {
        this.mover.moveToOtherColumn(this, row, fromColumnId, toColumnId);
        if (changeColumnCallback) {
          changeColumnCallback(fromColumnId, toColumnId);
        }
      }

      const rowAtPosition = this.mover.findRowAtPosition(
        this.columns[toColumnId].rows,
        x,
        y,
        row,
      );

      if (
        !rowAtPosition ||
        row.id === rowAtPosition.id ||
        draggedRow.id === rowAtPosition.id
      ) {
        return columnAtPosition;
      }

      if (row.hidden && !rowAtPosition.hidden) {
        this.mover.switchItemsBetween(
          this,
          row.index,
          rowAtPosition.index,
          toColumnId,
        );
      }

      return columnAtPosition;
    }
  };

  setColumnScrollRef = (columnId, ref) => {
    if (this.columns[columnId]) {
      this.columns[columnId].setScrollRef(ref);
    }
  };
}
