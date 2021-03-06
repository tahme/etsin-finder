import React from 'react'
import PropTypes from 'prop-types'
import { inject, observer } from 'mobx-react'
import Select from 'react-select'
import Translate from 'react-translate-component'
import styled from 'styled-components'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTimes } from '@fortawesome/free-solid-svg-icons'
import Label from '../general/label'
import Button from '../../general/button'
import getReferenceData from '../utils/getReferenceData'
import Card from '../general/card'
import { FieldOfScience, FieldsOfScience } from '../../../stores/view/qvain'
import { onChange, getCurrentValue } from '../utils/select'
import { LabelLarge } from '../general/form'

class FieldOfScienceField extends React.Component {
  promises = []

  static propTypes = {
    Stores: PropTypes.object.isRequired,
  }

  state = {
    options: {},
  }

  componentDidMount = () => {
    this.promises.push(
      getReferenceData('field_of_science')
        .then((res) => {
          const list = res.data.hits.hits
          const refsEn = list.map((ref) => ({
            value: ref._source.uri,
            label: ref._source.label.en,
          }))
          const refsFi = list.map((ref) => ({
            value: ref._source.uri,
            label: ref._source.label.fi,
          }))
          this.setState({
            options: {
              en: refsEn,
              fi: refsFi,
            },
          })
        })
        .catch((error) => {
          if (error.response) {
            // Error response from Metax
            console.log(error.response.data)
            console.log(error.response.status)
            console.log(error.response.headers)
          } else if (error.request) {
            // No response from Metax
            console.log(error.request)
          } else {
            // Something happened in setting up the request that triggered an Error
            console.log('Error', error.message)
          }
        })
    )
  }

  componentWillUnmount() {
    this.promises.forEach((promise) => promise && promise.cancel && promise.cancel())
  }

  addFieldOfScience = () => {
    const { setFieldsOfScience, fieldsOfScience } = this.props.Stores.Qvain
    const fieldOfScience = { ...this.props.Stores.Qvain.fieldOfScience }
    if (
      Object.keys(fieldOfScience).length !== 0 &&
      !fieldsOfScience.some((field) => field.url === fieldOfScience.url)
    ) {
      setFieldsOfScience([
        ...fieldsOfScience,
        FieldsOfScience(fieldOfScience.name, fieldOfScience.url),
      ])
    }
  }

  removeFieldOfScience = (fieldOfScienceToRemove) => {
    this.props.Stores.Qvain.removeFieldOfScience(fieldOfScienceToRemove)
  }

  render() {
    const { readonly, fieldOfScience, setFieldOfScience } = this.props.Stores.Qvain
    const { lang } = this.props.Stores.Locale
    const { options } = this.state

    const fieldOfScienceFaculty = this.props.Stores.Qvain.fieldsOfScience.map(
      (fieldOfScienceEntry) => (
        <Label color="#007fad" margin="0 0.5em 0.5em 0" key={fieldOfScienceEntry.url}>
          <PaddedWord>{fieldOfScienceEntry.name[lang]}</PaddedWord>
          <FontAwesomeIcon
            onClick={() => this.removeFieldOfScience(fieldOfScienceEntry)}
            icon={faTimes}
            size="xs"
          />
        </Label>
      )
    )
    return (
      <Card>
        <LabelLarge htmlFor="fieldOfScienceSelect">
          <Translate content="qvain.description.fieldOfScience.title" />
        </LabelLarge>
        <Translate component="p" content="qvain.description.fieldOfScience.help" />
        {fieldOfScienceFaculty}
        <Translate
          name="field-of-science"
          inputId="fieldOfScienceSelect"
          component={Select}
          attributes={{ placeholder: 'qvain.description.fieldOfScience.placeholder' }}
          isDisabled={readonly}
          value={getCurrentValue(fieldOfScience, options, lang)}
          className="basic-single"
          classNamePrefix="select"
          options={options[lang]}
          onChange={onChange(options, lang, setFieldOfScience, FieldOfScience)}
        />
        <ButtonContainer>
          <AddNewButton type="button" onClick={this.addFieldOfScience} disabled={readonly}>
            <Translate content="qvain.description.fieldOfScience.addButton" />
          </AddNewButton>
        </ButtonContainer>
      </Card>
    )
  }
}

const PaddedWord = styled.span`
  padding-right: 10px;
`
const ButtonContainer = styled.div`
  text-align: right;
`
const AddNewButton = styled(Button)`
  margin: 0;
  margin-top: 11px;
`
export default inject('Stores')(observer(FieldOfScienceField))
