import React from 'react'
import styled from 'styled-components'
import Select from 'react-select'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faInfoCircle } from '@fortawesome/free-solid-svg-icons'

export const FormField = styled.div`
  display: inline-flex;
  align-items: center;
  vertical-align: middle;
`

export const Input = styled.input`
  width: 100%;
  border-radius: 3px;
  border: solid 1px #cccccc;
  padding: 8px;
  color: #000;
  margin-bottom: 20px;
`

export const Textarea = styled.textarea`
  width: 100%;
  border-radius: 3px;
  border: solid 1px #cccccc;
  padding: 8px;
  color: #000;
  margin-bottom: 20px;
`

export const CustomSelect = styled(Select)`
  margin-bottom: 20px;
`

export const Label = styled.label`
  margin-right: auto;
  padding-left: 4px;
  display: block;
`

export const NestedLabel = styled.label`
  margin-right: auto;
  display: flex;
  align-items: center;
  > span {
    padding-left: 4px;
    padding-right: 4px;
  }
`

export const LabelLarge = styled.label`
  font-size: 1.2em;
  line-height: calc(1.5 * 1.2em);
  font-weight: 700
`

export const CheckboxStyles = styled.input`
  width: 18px;
  height: 18px;
  margin: 4px;
  padding: 0;
  :not(:disabled) {
    cursor: pointer;
  }
`

export const RadioInput = styled.input`
  width: 16px;
  height: 16px;
  margin: 5px;
  padding: 0;
`


export const Checkbox = props => <CheckboxStyles {...props} type="checkbox" />

export const HelpField = styled.span`
  font-weight: 200;
  font-family: 'Lato', sans-serif;
`

export const HelpIconStyles = styled(FontAwesomeIcon)`
  :hover {
    color: ${props => props.theme.color.primary};
  }
`

export const NoStyleButton = styled.button`
  border: none;
  background-color: unset;
`

export const HelpIcon = props => (
  <NoStyleButton {...props} type="button">
    <HelpIconStyles icon={faInfoCircle} />
  </NoStyleButton>
)

export const SelectedFilesTitle = styled.label`
  display: block;
  font-weight: 600;
  color: #4f4f4f;
  margin-bottom: 8px;
  text-transform: uppercase;
`
