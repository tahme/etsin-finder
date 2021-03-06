import React from 'react';
import PropTypes from 'prop-types';
import { observer } from 'mobx-react'
import Translate from 'react-translate-component'
import { faFolder, faFolderOpen, faFile } from '@fortawesome/free-solid-svg-icons'

import {
  isDirectory, ItemRow, ItemSpacer, ToggleOpenButton,
  ItemTitle, Checkbox, Icon, NoIcon, SmallLoader
} from './common/items'

const AddItemsTreeItemBase = ({ treeProps, item, level, parentArgs }) => {
  const { directoryView } = treeProps
  const { parentChecked } = parentArgs
  const isOpen = directoryView.isOpen(item)
  const isChecked = directoryView.isChecked(item)
  const disabled = parentChecked || item.selected
  const checkMark = isChecked || parentChecked || item.selected

  const toggle = disabled ? null : () => directoryView.toggleChecked(item)
  const toggleDirectoryOpen = (dir) => directoryView.toggleOpen(dir)

  let content = null

  if (isDirectory(item)) {
    const checkAction = directoryView.isChecked ? 'select' : 'deselect'
    content = (
      <>
        <ToggleOpenButton item={item} directoryView={directoryView} />
        <Translate
          component={Checkbox}
          checked={checkMark}
          disabled={disabled}
          onChange={toggle}
          attributes={{ 'aria-label': `qvain.files.selected.buttons.${checkAction}` }}
          with={{ name: item.directoryName }}
        />
        <Icon icon={isOpen ? faFolderOpen : faFolder} />
        <ItemTitle onDoubleClick={() => toggleDirectoryOpen(item)}>
          {item.directoryName}
          {item.loading && <SmallLoader />}
        </ItemTitle>
      </>
    )
  } else {
    content = (
      <>
        <NoIcon />
        <Checkbox aria-label="select" checked={checkMark} disabled={disabled} onChange={toggle} />
        <Icon icon={faFile} />
        <ItemTitle>{item.fileName}</ItemTitle>
      </>
    )
  }

  return (
    <ItemRow>
      <ItemSpacer level={level} />
      {content}
    </ItemRow>
  )
}

AddItemsTreeItemBase.propTypes = {
  treeProps: PropTypes.object.isRequired,
  item: PropTypes.object.isRequired,
  level: PropTypes.number.isRequired,
  parentArgs: PropTypes.object.isRequired,
}

export default observer(AddItemsTreeItemBase)
