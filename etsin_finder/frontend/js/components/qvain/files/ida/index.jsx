import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { inject, observer } from 'mobx-react'
import Translate from 'react-translate-component'
import styled from 'styled-components'
import { darken } from 'polished'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus } from '@fortawesome/free-solid-svg-icons'

import etsinTheme from '../../../../styles/theme'
import SelectedItems from './selectedItems'
import AddItemsModal from './addItems'
import FixDeprecatedModal from '../fixDeprecatedModal'

export class IDAFilePickerBase extends Component {
  state = {
    addFilesModalOpen: false
  }

  static propTypes = {
    Stores: PropTypes.object.isRequired
  }

  open = () => {
    this.setState({
      addFilesModalOpen: true,
    })
  }


  close = () => {
    this.setState({
      addFilesModalOpen: false,
    })
  }

  render() {
    const { selectedProject, root } = this.props.Stores.Qvain.Files
    const haveItems = root && (root.addedChildCount > 0 || root.selectedChildCount > 0)

    return (
      <>
        <Translate component={Title} content="qvain.files.selected.title" />
        <AddItems>
          <Translate
            component={PlusButton}
            onClick={this.open}
            attributes={{ 'aria-label': 'qvain.files.addItemsModal.title' }}
          />
          <ProjectInfo>{haveItems ? selectedProject : <Translate content="qvain.files.selected.none" />}</ProjectInfo>
        </AddItems>
        <AddItemsModal isOpen={this.state.addFilesModalOpen} onRequestClose={this.close} />
        <SelectedItems />
        <FixDeprecatedModal />
      </>
    )
  }
}

const Title = styled.h3`{
  margin-right: 0.5em;
  margin-bottom: 0;
}`


const ProjectInfo = styled.div`{
  margin: 0;
  margin-left: 1em;
  padding: 0;
}`

const AddItems = styled.div`{
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
}`

const PlusButtonWrapper = ({ onClick, ...props }) => (
  <button type="button" onClick={onClick} {...props}>
    <FontAwesomeIcon icon={faPlus} />
  </button>
)

const PlusButton = styled(PlusButtonWrapper)`{
  border: 1px solid ${darken(0.1, etsinTheme.color.lightgray)};
  color: ${etsinTheme.color.darkgray};
  background: ${etsinTheme.color.lightgray};
  border-radius: 50%;
  width: 2em;
  height: 2em;
  font-size: 16pt;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  :hover {
    border: 1px solid ${darken(0.15, etsinTheme.color.lightgray)};
    color: ${darken(0.1, etsinTheme.color.darkgray)};
    background: ${darken(0.1, etsinTheme.color.lightgray)};
  }
}`

PlusButtonWrapper.propTypes = {
  onClick: PropTypes.func.isRequired
}


export default inject('Stores')(observer(IDAFilePickerBase))
