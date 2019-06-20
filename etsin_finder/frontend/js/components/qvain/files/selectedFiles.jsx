import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';
import { inject, observer } from 'mobx-react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCopy, faFolder } from '@fortawesome/free-solid-svg-icons'
import Translate from 'react-translate-component'
import { ButtonLabel, EditButton, DeleteButton, FileItem } from '../general/buttons'
import { SelectedFilesTitle } from '../general/form'
import FileForm from './fileForm'
import DirectoryForm from './directoryForm'

export class SelectedFilesBase extends Component {
  static propTypes = {
    Stores: PropTypes.object.isRequired
  }

  handleEdit = (selected) => (event) => {
    const { inEdit } = this.props.Stores.Qvain
    event.preventDefault()
    if (isInEdit(inEdit, selected.identifier)) {
      this.props.Stores.Qvain.setInEdit(undefined)
    } else {
      this.props.Stores.Qvain.setInEdit(selected)
    }
  }

  render() {
    const {
      toggleSelectedFile,
      toggleSelectedDirectory,
      selectedFiles,
      selectedDirectories,
      inEdit
    } = this.props.Stores.Qvain
    const selected = [...selectedDirectories, ...selectedFiles]
    return (
      <Fragment>
        <Translate component={SelectedFilesTitle} content="qvain.files.selected.title" />
        {selected.length === 0 && <Translate component="p" content="qvain.files.selected.none" />}
        {selected.map(s => (
          <Fragment key={`${s.id}-${s.identifier}`}>
            <FileItem active={isInEdit(inEdit, s.identifier)}>
              <ButtonLabel>
                <FontAwesomeIcon icon={(s.directoryName ? faFolder : faCopy)} style={{ marginRight: '8px' }} />
                {s.projectIdentifier} / {s.directoryName || s.title}
              </ButtonLabel>
              <EditButton onClick={this.handleEdit(s)} />
              <DeleteButton
                onClick={(event) => {
                  event.preventDefault()
                  if (s.directoryName !== undefined) {
                    toggleSelectedDirectory(s, false)
                  } else {
                    toggleSelectedFile(s, false)
                  }
                }}
              />
            </FileItem>
            {isInEdit(inEdit, s.identifier) && (
              <Fragment>
                {isDirectory(inEdit) && (<DirectoryForm />)}
                {!isDirectory(inEdit) && (<FileForm />)}
              </Fragment>
            )}
          </Fragment>
        ))}
      </Fragment>
    )
  }
}

const isInEdit = (inEdit, identifier) => (inEdit !== undefined) && inEdit.identifier === identifier

const isDirectory = (inEdit) => inEdit.directoryName !== undefined

export default inject('Stores')(observer(SelectedFilesBase))