import ColumnItem from "./column-item";
import RowItem from "./row-item";
import Mover from "./mover";

export default class Repository {
  constructor(data) {
    this.columns = {};
    this.originalData = {};

    this.initialData(data);
    this.mover = new Mover();
    this.listeners = {};
  }

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

  initialData = (data) => {
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
        rows: rows.map((row) => ({
          id: row.id,
          index: row.index,
        })),
      };
    });
  };

  updateData = (data) => {
    data.forEach((column, columnIndex) => {
      const rows = column.rows.map((item, index) => {
        let existingAttributes = {};

        if (this.columns[column.id]) {
          const existingIndex = this.columns[column.id].rows.findIndex(
            (row) => row.id === item.id
          );
          if (existingIndex > -1) {
            existingAttributes = this.columns[column.id].rows[
              existingIndex
            ].getAttributes();
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
        rows: rows.map((row) => ({
          id: row.id,
          index: row.index,
        })),
      };
    });
  };

  addRow = (columnId, row) => {
    const rowItem = new RowItem({
      id: row.id,
      columnId: columnId,
      data: row,
    });

    this.columns[columnId].addRow(rowItem);
    this.notify(columnId, "reload");
  };

  updateOriginalData = () => {
    Object.keys(this.columns).forEach((columnId) => {
      this.originalData[columnId] = {
        id: this.columns[columnId].id,
        index: this.columns[columnId].index,
        rows: this.columns[columnId].rows.map((row) => ({
          id: row.id,
          index: row.index,
        })),
      };
    });
  };

  getItemsChanged = () => {
    const columns = [];
    const rows = [];

    Object.keys(this.originalData).forEach((columnId) => {
      if (this.originalData[columnId].index !== this.columns[columnId].index) {
        columns.push({ id: columnId, index: this.columns[columnId].index });
      }

      this.columns[columnId].rows.forEach((row) => {
        const rowIndex = this.originalData[columnId].rows.findIndex(
          (item) => item.id === row.id
        );
        if (rowIndex > -1 && row.index !== rowIndex) {
          rows.push({ id: row.id, index: row.index });
        }
      });
    });

    return { columns, rows };
  };

  getColumns = () => {
    return Object.values(this.columns).sort((a, b) => a.index > b.index);
  };

  getColumnById = (columnId) => {
    return this.columns[columnId];
  };

  getRowsByColumnId = (columnId) => {
    return this.columns[columnId].rows;
  };

  updateColumnRef = (columnId, ref) => {
    this.columns[columnId].setRef(ref);
  };

  updateColumnLayout = (columnId, offset) => {
    this.columns[columnId].measureLayout(offset);
  };

  measureColumnsLayout = (scrollOffset) => {
    Object.keys(this.columns).forEach((columnId) => {
      this.columns[columnId].measureLayout(scrollOffset);
    });
  };

  updateRowRef = (columnId, rowId, ref) => {
    const rowIndex = this.columns[columnId].rows.findIndex(
      (row) => row.id === rowId
    );
    if (rowIndex > -1) {
      this.columns[columnId].rows[rowIndex].setRef(ref);
    }
  };

  updateRowLayout = (columnId, rowId) => {
    const rowIndex = this.columns[columnId].rows.findIndex(
      (row) => row.id === rowId
    );
    if (rowIndex > -1) {
      this.columns[columnId].rows[rowIndex].measureLayout();
    }
  };

  hideRow = (row) => {
    const rowIndex = this.columns[row.columnId].rows.findIndex(
      (item) => item.id === row.id
    );
    if (rowIndex > -1) {
      this.columns[row.columnId].rows[rowIndex].setHidden(true);
    }
  };

  showRow = (row) => {
    const rowIndex = this.columns[row.columnId].rows.findIndex(
      (item) => item.id === row.id
    );
    if (rowIndex > -1) {
      this.columns[row.columnId].rows[rowIndex].setHidden(false);
    }
  };

  findRow = (row) => {
    return this.columns[row.columnId].rows.find((item) => item.id === row.id);
  };

  moveRow = (draggedRow, x, y, changeColumnCallback) => {
    const rowIndex = this.columns[draggedRow.columnId].rows.findIndex(
      (item) => item.id === draggedRow.id
    );

    if (rowIndex > -1) {
      const row = this.columns[draggedRow.columnId].rows[rowIndex];

      const fromColumnId = row.columnId;
      const columnAtPosition = this.mover.findColumnAtPosition(
        this.getColumns(),
        x,
        y
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
        row
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
          toColumnId
        );
      }

      return columnAtPosition;
    }
  };

  setColumnScrollRef = (columnId, ref) => {
    this.columns[columnId].setScrollRef(ref);
  };
}
