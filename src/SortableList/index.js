import React, { PropTypes, Component } from 'react';
import shallowCompare from 'react-addons-shallow-compare';
import { List as VirtualScroll, CellMeasurer, AutoSizer } from 'react-virtualized';
import { DragSource, DropTarget } from 'react-dnd';
import { getEmptyImage } from 'react-dnd-html5-backend';

import { ItemCache } from './itemCache';
import SortableItem from '../SortableItem';

import { LIST_TYPE, ROW_TYPE } from '../types';
import * as dragSpec from './dragSpec';
import * as dropSpec from './dropSpec';

class SortableList extends Component {
  static propTypes = {
    rows: PropTypes.array,
    listId: PropTypes.string,
    listIndex: PropTypes.number,
    listStyle: PropTypes.object,
    listComponent: PropTypes.func,
    itemComponent: PropTypes.func,
    moveRow: PropTypes.func,
    moveList: PropTypes.func,
    dropRow: PropTypes.func,
    dropList: PropTypes.func,
    // React DnD
    isDragging: PropTypes.bool,
    connectDropTarget: PropTypes.func,
    connectDragSource: PropTypes.func,
    connectDragPreview: PropTypes.func,
  };

  constructor(props) {
    super(props);

    this.renderRow = this.renderRow.bind(this);
    this.renderItemForMeasure = this.renderItemForMeasure.bind(this);
    this.renderList = this.renderList.bind(this);
  }

  componentDidMount() {
    this.props.connectDragPreview(getEmptyImage(), {
      captureDraggingState: true
    });
  }

  componentDidUpdate(prevProps) {
    if (prevProps.rows !== this.props.rows) {
      this._list.recomputeRowHeights();
    }
  }

  shouldComponentUpdate(nextProps, nextState) {
    return shallowCompare(this, nextProps, nextState);
  }

  renderRow({ index, key, style }) {
    const { id } = this.props.rows[index];

    return (
      <SortableItem
        key={key}
        rowId={id}
        listId={this.props.listId}
        rowIndex={index}
        listIndex={this.props.listIndex}
        rowStyle={style}
        itemComponent={this.props.itemComponent}
        moveRow={this.props.moveRow}
        dropRow={this.props.dropRow}
      />
    );
  }

  renderItemForMeasure({ rowIndex: index }) {
    const { itemComponent: DecoratedItem } = this.props;
    const { id } = this.props.rows[index];

    // TODO: Determine whether scrollbar is visible or not :/

    return (
      <DecoratedItem
        rowId={id}
        isDragging={false}
        connectDragSource={(e) => e}
        connectDropTarget={(e) => e}
      />
    );
  }

  renderList({ width, height }) {
    return (
      <CellMeasurer
        width={width}
        columnCount={1}
        rowCount={this.props.rows.length}
        cellRenderer={this.renderItemForMeasure}
        cellSizeCache={new ItemCache(this.props.rows)}
      >
        {({ getRowHeight }) => (
          <VirtualScroll
            ref={(c) => (this._list = c)}
            className='KanbanList'
            width={width}
            height={height}
            rowHeight={getRowHeight}
            rowCount={this.props.rows.length}
            rowRenderer={this.renderRow}
            overscanRowCount={2}
           />
         )}
      </CellMeasurer>
    );
  }

  render() {
    const {
      listId,
      listComponent: DecoratedList,
      isDragging,
      connectDragSource,
      connectDropTarget,
      listStyle,
      ...listProps,
    } = this.props;

    return (
      <DecoratedList
        {...listProps}
        listId={listId}
        style={listStyle}
        isDragging={isDragging}
        connectDragSource={connectDragSource}
        connectDropTarget={connectDropTarget}
      >
        <AutoSizer>
          {(dimensions) => this.renderList(dimensions)}
        </AutoSizer>
      </DecoratedList>
    );
  }
}

const connectDrop = DropTarget([LIST_TYPE, ROW_TYPE], dropSpec, connect => ({
  connectDropTarget: connect.dropTarget(),
}))

const connectDrag = DragSource(LIST_TYPE, dragSpec, (connect, monitor) => ({
  connectDragSource: connect.dragSource(),
  connectDragPreview: connect.dragPreview(),
  isDragging: monitor.isDragging(),
}))

export default connectDrop(connectDrag(SortableList));