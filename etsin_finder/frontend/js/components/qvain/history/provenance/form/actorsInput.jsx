import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import ReactSelect, { components as selectComponents } from 'react-select'
import Translate from 'react-translate-component'
import { inject, observer } from 'mobx-react'
import translate from 'counterpart'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPen } from '@fortawesome/free-solid-svg-icons'
import { Label } from '../../../general/form'
import ActorsList from './actorsList'
import { Actor } from '../../../../../stores/view/qvain.actors'
import { ROLE } from '../../../../../utils/constants'
import parseActorLabel from '../../../utils/actor'

const ActorsInput = ({ Stores }) => {
  const { Actors, Provenances } = Stores.Qvain
  const selectedOptions = (Provenances.inEdit.associations || {}).actorOptions || []
  const selectedOptionIds = selectedOptions.map(option => option.value)
  const { lang: language } = Stores.Locale

  const CreateOption = { Option: CustomOption }

  const options = [
    {
      value: 'create-actor',
      label: translate('qvain.history.provenance.modal.actorsInput.createButton'),
    },
    ...Actors.actorOptions
      .filter(option => !selectedOptionIds.includes(option.value))
      .map(option => {
        const rolesStr = option.roles.map(
          role => `${translate(`qvain.actors.add.checkbox.${role}`)}`
        )
        const actorName = parseActorLabel(option, language)
        const name = `${actorName} / ${rolesStr.join(' / ')}`

        return {
          value: option.value,
          label: name,
        }
      }),
  ]

  const createActor = () => {
    const { editActor } = Actors
    editActor(Actor({ roles: [ROLE.PROVENANCE] }), freshActor =>
      Provenances.inEdit.associations.addActorWithId(freshActor.uiid)
    )
  }

  const handleSelect = selection => {
    if ((selection || {}).value === 'create-actor') {
      createActor()
      setSelectedActor(null)
      return
    }

    const id = selection.value
    Provenances.inEdit.associations.addActorWithId(id)
    Stores.Qvain.Provenances.inEdit.associations.addRole(id, ROLE.PROVENANCE)
    setSelectedActor('selectedActor', undefined)
  }

  const setSelectedActor = value => {
    Stores.Qvain.Provenances.changeAttribute('selectedActor', value)
  }

  const styles = {
    option: style => ({
      ...style,
      display: 'flex',
      alignItems: 'center',
    }),
  }

  return (
    <>
      <Translate
        component={Label}
        content="qvain.history.provenance.modal.actorsInput.label"
        htmlFor="actors-input"
      />
      <ActorsList
        language={language}
        Stores={Stores}
        actors={Provenances.inEdit.associations}
        items={selectedOptions}
      />
      <Translate
        component={ReactSelect}
        inputId="actors-select"
        attributes={{ placeholder: 'qvain.history.provenance.modal.actorsInput.placeholder' }}
        options={options}
        styles={styles}
        components={CreateOption}
        value={Provenances.inEdit.selectedActor}
        menuPlacement="auto"
        menuPosition="fixed"
        menuShouldScrollIntoView={false}
        isClearable
        onChange={handleSelect}
      />
    </>
  )
}

const CustomOption = ({ children, ...props }) => (
  <selectComponents.Option {...props}>
    {children} {props.value === 'create-actor' && <EditIcon color="primary" />}
  </selectComponents.Option>
)

CustomOption.propTypes = {
  children: PropTypes.node.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
}

const EditIcon = styled(FontAwesomeIcon).attrs({
  icon: faPen,
})`
  color: ${props => props.theme.color[props.color || 'primary']};
  margin: 0 0.5rem;
  margin-left: auto;
`

ActorsInput.propTypes = {
  Stores: PropTypes.object.isRequired,
}

export default inject('Stores')(observer(ActorsInput))
