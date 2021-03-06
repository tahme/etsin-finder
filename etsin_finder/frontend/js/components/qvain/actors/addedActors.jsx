import React, { Component } from 'react'
import PropTypes from 'prop-types';
import { inject, observer } from 'mobx-react'
import translate from 'counterpart'
import Translate from 'react-translate-component'
import styled from 'styled-components'

import {
  ButtonGroup,
  ButtonLabel,
  EditButton,
  DeleteButton,
  ButtonContainer
} from '../general/buttons'
import { getActorName, ActorIcon } from './common'

export class AddedActorsBase extends Component {
  static propTypes = {
    Stores: PropTypes.object.isRequired
  }

  handleEditActor = (actor) => (event) => {
    event.preventDefault()
    this.props.Stores.Qvain.Actors.editActor(actor)
  }

  handleRemoveActor = (actor) => (event) => {
    event.preventDefault()
    this.props.Stores.Qvain.Actors.removeActor(actor)
  }

  render() {
    const { lang } = this.props.Stores.Locale
    const { readonly } = this.props.Stores.Qvain
    const { actors } = this.props.Stores.Qvain.Actors
    return (
      <>
        <Translate
          tabIndex="0"
          component="h3"
          content="qvain.actors.added.title"
        />
        <Translate component="p" content="qvain.actors.add.help" />
        {actors.length === 0 &&
          (<Translate tabIndex="0" component="p" content="qvain.actors.added.noneAddedNotice" />)
        }
        {actors.map((addedActor) => (
          <ButtonGroup tabIndex="0" key={addedActor.uiid}>
            <ActorLabel>
              <ActorIcon actor={addedActor} style={{ marginRight: '8px' }} />
              {getActorName(addedActor, lang)}{addedActor.roles.map(role => (` / ${translate(`qvain.actors.add.checkbox.${role}`)}`))}
            </ActorLabel>
            <ButtonContainer>
              <EditButton aria-label="Edit" onClick={this.handleEditActor(addedActor)} />
              {!readonly && <DeleteButton aria-label="Remove" onClick={this.handleRemoveActor(addedActor)} />}
            </ButtonContainer>
          </ButtonGroup>
        ))}
      </>

    );
  }
}

const ActorLabel = styled(ButtonLabel)`
  white-space: normal;
  overflow: hidden;
  height: auto;
  word-break: break-word;
`

export default inject('Stores')(observer(AddedActorsBase));
