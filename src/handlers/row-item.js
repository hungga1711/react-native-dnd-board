export default class Row {
  constructor({ ref, layout, id, index, columnId, data }) {
    this.ref = ref;
    this.layout = layout;
    this.id = id;
    this.index = index;
    this.columnId = columnId;
    this.data = data;
    this.hidden = false;
  }

  getAttributes = () => {
    return {
      ref: this.ref,
      layout: this.layout,
      id: this.id,
      index: this.index,
      columnId: this.columnId,
      data: this.data,
      hidden: this.hidden,
    };
  };

  setId = id => {
    this.id = id;
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

  setData = data => {
    this.data = data;
  };

  setColumnId = columnId => {
    this.columnId = columnId;
  };

  setHidden = hidden => {
    this.hidden = hidden;
  };

  measureLayout = async (scrollOffsetX, scrollOffsetY) => {
    return new Promise((resolve, reject) => {
      if (this.ref && this.ref.measure) {
        this.ref.measure((fx, fy, width, height, px, py) => {
          if (scrollOffsetX) {
            px += scrollOffsetX;
          }
          if (scrollOffsetY) {
            py += scrollOffsetY;
          }

          const layout = { x: px, y: py, width, height };
          this.setLayout(layout);

          resolve(true);
        });
      }

      setTimeout(() => {
        resolve(false);
      }, 300);
    });
  };
}
