export default class Column {
  constructor({ ref, scrollRef, layout, id, index, data, rows }) {
    this.ref = ref;
    this.scrollRef = scrollRef;
    this.layout = layout;
    this.id = id;
    this.index = index;
    this.data = data;
    this.rows = rows;
  }

  getAttributes = () => {
    return {
      ref: this.ref,
      scrollRef: this.scrollRef,
      layout: this.layout,
      id: this.id,
      index: this.index,
      data: this.data,
      rows: this.rows,
    };
  };

  setRef = ref => {
    this.ref = ref;
  };

  setIndex = index => {
    this.index = index;
  };

  setLayout = layout => {
    this.layout = layout;
  };

  setScrollRef = scrollRef => {
    this.scrollRef = scrollRef;
  };

  scrollOffset = offset => {
    if (this.scrollRef) {
      this.scrollRef.scrollToOffset({ offset: offset });
    }
  };

  addRow = row => {
    row.columnId = this.id;
    row.setIndex(this.rows.length);
    this.rows.push(row);
  };

  measureRowIndex = () => {
    this.rows.forEach((row, index) => {
      row.setIndex(index);
    });
  };

  measureRowLayout = scrollOffsetX => {
    this.rows.forEach(row => {
      if (row.measureLayout) {
        row.measureLayout(scrollOffsetX);
      }
    });
  };

  measureLayout = scrollOffsetX => {
    if (this.ref && this.ref.measure) {
      this.ref.measure((fx, fy, width, height, px, py) => {
        if (scrollOffsetX) {
          px += scrollOffsetX;
        }
        const layout = { x: px, y: py, width, height };
        this.setLayout(layout);

        this.measureRowLayout(scrollOffsetX);
      });
    }
  };
}
