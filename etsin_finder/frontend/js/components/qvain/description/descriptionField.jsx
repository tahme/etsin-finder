import React, { Component } from 'react'
import styled from 'styled-components'
import Translate from 'react-translate-component'
import '../../../../locale/translations'

class DescriptionField extends Component {
  state = {
    active: 'ENGLISH'
  }

  handleLanguageButtonClisck = () => {
    /* eslint-disable no-unused-expressions */
    this.state.active === 'ENGLISH'
      ? this.setState({ active: 'FINNISH' })
      : this.setState({ active: 'ENGLISH' })
  }

  getLangButton = (activeLang, buttonLang) => (
    <LangButton active={activeLang === buttonLang} onClick={this.handleLanguageButtonClisck}>
      <Translate content={buttonLang === 'ENGLISH' ? 'qvain.description.description.langEn' : 'qvain.description.description.langFi'} />
    </LangButton>
  )

  getPlaceholder = (field, activeLang) => {
    const stub = `qvain.description.description.${field}.`
    return activeLang === 'ENGLISH' ? `${stub}placeholderEn` : `${stub}placeholderFi`
  }

  render() {
    return (
      <div>
        <LangButtonContainer>
          {this.getLangButton(this.state.active, 'ENGLISH')}
          <EmptyBlock width="2%" />
          {this.getLangButton(this.state.active, 'FINNISH')}
          <EmptyBlock width="48%" />
        </LangButtonContainer>
        <DescriptionCard>
          <h3><Translate content="qvain.description.description.title.label" /></h3>
          <Translate
            component={Input}
            type="text"
            attributes={{ placeholder: this.getPlaceholder('title', this.state.active) }}
          />
          <h3><Translate content="qvain.description.description.description.label" /></h3>
          <Translate
            component={Textarea}
            rows="8"
            attributes={{ placeholder: this.getPlaceholder('title', this.state.active) }}
          />
          <Translate component="div" content="qvain.description.description.instructions" />
        </DescriptionCard>
      </div>
    )
  }
}

const DescriptionCard = styled.div`
  margin-bottom: 15px;
  padding: 25px 44px;
  border: 1px solid #007fad;
  border-top: none;
  min-height: 150px;
  background-color: #fff;
  overflow: auto;
`

const LangButtonContainer = styled.div`
  width: 100%;
  display: flex;
  flex-direction: row;
`
const LangButton = styled.div`
  width: 25%;
  padding: 5px 20px;
  background-color: #fff;
  border: 1px solid ${props => (props.active ? '#007fad' : '#eceeef')};
  border-bottom: ${props => (props.active ? 'none' : '1px solid #007fad')};
  border-radius: 4px 4px 0 0;
`
const EmptyBlock = styled.div`
  width: ${props => props.width};
  border-bottom: 1px solid #007fad;
`
const Input = styled.input`
  width: 100%;
  border-radius: 3px;
  border: 1px solid #eceeef;
  padding: 8px;
  color: #808080;
  margin-bottom: 20px;
`

const Textarea = styled.textarea`
  -webkit-box-sizing: border-box;
  -moz-box-sizing: border-box;
  box-sizing: border-box;
  width: 100%;
  border-radius: 4px;
  border: solid 1px #cccccc;
`


export default DescriptionField;
