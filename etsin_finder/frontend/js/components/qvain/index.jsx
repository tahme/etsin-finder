import React, { Component } from 'react'
import PropTypes from 'prop-types'
import Translate from 'react-translate-component'
import translate from 'counterpart'
import { inject, observer } from 'mobx-react'
import axios from 'axios'
import { withRouter } from 'react-router-dom'
import { faChevronLeft } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import {
  STSD,
  SubHeaderTextContainer,
  LinkBackContainer,
  LinkBack,
  ButtonContainer,
  SubmitButton,
  Form,
  SubmitContainer,
  ErrorContainer,
  ErrorLabel,
  ErrorContent,
  ErrorButtons,
  LinkText,
  CustomSubHeader,
  customStyles,
} from './styledComponents'

import RightsAndLicenses from './licenses'
import Description from './description'
import Actors from './actors'
import { qvainFormSchema } from './utils/formValidation'
import Files from './files'
import History from './history'
import {
  QvainContainer,
  SubHeader,
  StickySubHeaderWrapper,
  StickySubHeader,
  StickySubHeaderResponse,
  SubHeaderText,
} from './general/card'
import handleSubmitToBackend from './utils/handleSubmit'
import { getResponseError } from './utils/responseError'
import Title from './general/title'
import SubmitResponse from './general/submitResponse'
import { Button } from '../general/button'
import Modal from '../general/modal'
import DeprecatedState from './deprecatedState'
import PasState from './pasState'

const EDIT_DATASET_URL = '/api/datasets/edit'

class Qvain extends Component {
  promises = []

  static propTypes = {
    Stores: PropTypes.object.isRequired,
    match: PropTypes.object.isRequired,
    history: PropTypes.object.isRequired,
  }

  constructor(props) {
    super(props)
    this.setFocusOnSubmitOrUpdateButton = this.setFocusOnSubmitOrUpdateButton.bind(this)
    this.submitDatasetButton = React.createRef()
    this.updateDatasetButton = React.createRef()
    this.showUseDoiInformation = this.showUseDoiInformation.bind(this)
    this.closeUseDoiInformation = this.closeUseDoiInformation.bind(this)
    this.acceptDoi = this.acceptDoi.bind(this)
  }

  state = {
    response: null,
    submitted: false,
    haveDataset: false,
    datasetLoading: false,
    datasetError: false,
    datasetErrorTitle: null,
    datasetErrorDetails: null,
    useDoiModalIsOpen: false,
  }

  componentDidMount() {
    this.handleIdentifierChanged()
  }

  componentDidUpdate(prevProps) {
    if (this.props.match.params.identifier !== prevProps.match.params.identifier) {
      this.handleIdentifierChanged()
    }
  }

  componentWillUnmount() {
    this.props.Stores.Qvain.resetQvainStore()
    this.props.Stores.Qvain.original = undefined
    this.promises.forEach((promise) => promise.cancel())
  }

  getDataset(identifier) {
    this.setState({ datasetLoading: true, datasetError: false, response: null, submitted: false })
    const { resetQvainStore, editDataset } = this.props.Stores.Qvain
    const url = `${EDIT_DATASET_URL}/${identifier}`
    const promise = axios
      .get(url)
      .then((result) => {
        resetQvainStore()
        editDataset(result.data)
        this.setState({ datasetLoading: false, datasetError: false, haveDataset: true })
      })
      .catch((e) => {
        const status = e.response.status

        let errorTitle, errorDetails
        if (status === 401 || status === 403) {
          errorTitle = translate('qvain.error.permission')
        } else if (status === 404) {
          errorTitle = translate('qvain.error.missing')
        } else {
          errorTitle = translate('qvain.error.default')
        }

        if (typeof e.response.data === 'object') {
          const values = Object.values(e.response.data)
          if (values.length === 1) {
            errorDetails = values[0]
          } else {
            errorDetails = JSON.stringify(e.response.data, null, 2)
          }
        } else {
          errorDetails = e.response.data
        }
        if (!errorDetails) {
          errorDetails = e.message
        }

        this.setState({
          datasetLoading: false,
          datasetError: true,
          datasetErrorTitle: errorTitle,
          datasetErrorDetails: errorDetails,
          haveDataset: false,
        })
      })
    this.promises.push(promise)
    return promise
  }

  setFocusOnSubmitOrUpdateButton(event) {
    if (this.props.Stores.Qvain.original) {
      this.updateDatasetButton.current.focus()
    } else {
      this.submitDatasetButton.current.focus()
    }
    // preventDefault, since the page wants to refresh at this point
    event.preventDefault()
  }

  handlePublishError = (err) => {
    if (!err.response) {
      console.error(err)
    }
    this.setState({
      response: getResponseError(err),
      datasetLoading: false,
    })
  }

  handleCreate = (e) => {
    if (this.state.useDoiModalIsOpen) {
      this.setState({
        useDoiModalIsOpen: false,
      })
    } else {
      e.preventDefault()
    }
    this.setState({
      response: null,
      submitted: true,
      datasetError: false,
      datasetLoading: true,
    })
    const obj = handleSubmitToBackend(this.props.Stores.Qvain)
    qvainFormSchema
      .validate(obj, { abortEarly: false })
      .then(() => {
        axios
          .post('/api/dataset', obj)
          .then((res) => {
            const data = res.data
            this.setState({
              response: { ...data, is_new: true },
              datasetLoading: false,
            })
            // Open the created dataset without reloading the editor
            if (data && data.identifier) {
              this.props.Stores.Qvain.resetQvainStore()
              this.props.Stores.Qvain.editDataset(data)
              this.props.history.replace(`/qvain/dataset/${data.identifier}`)
            }
          })
          .catch(this.handlePublishError)
      })
      .catch((err) => {
        console.log('Error for event: ', e)
        console.log(err.errors)

        // Loading done, so set error header
        this.setState({
          response: err.errors,
          datasetLoading: false,
        })
      })
  }

  handleRetry = () => {
    this.setState({ datasetLoading: false, haveDataset: true })
    this.handleIdentifierChanged()
  }

  handleUpdate = (e) => {
    e.preventDefault()
    this.setState({
      response: null,
      submitted: true,
      datasetError: false,
      datasetLoading: true,
    })
    const obj = handleSubmitToBackend(this.props.Stores.Qvain)
    obj.original = this.props.Stores.Qvain.original
    qvainFormSchema
      .validate(obj, { abortEarly: false })
      .then(() => {
        axios
          .patch('/api/dataset', obj)
          .then((res) => {
            this.props.Stores.Qvain.moveSelectedToExisting()
            this.props.Stores.Qvain.setChanged(false)
            this.props.Stores.Qvain.editDataset(res.data)
            this.setState({
              response: res.data,
              datasetLoading: false,
            })
          })
          .catch(this.handlePublishError)
      })
      .catch((err) => {
        console.log('Error for event: ', e)
        console.log(err.errors)

        // Loading done, so set error header
        this.setState({
          response: err.errors,
          datasetLoading: false,
        })
      })
  }

  handleIdentifierChanged() {
    if (this.datasetLoading) {
      return
    }
    const identifier = this.props.match.params.identifier
    const { original } = this.props.Stores.Qvain

    // Test if we need to load a dataset or do we use the one currently in store
    if (identifier && !(original && original.identifier === identifier)) {
      this.getDataset(identifier)
    } else {
      this.setState({ datasetLoading: false, haveDataset: true })
    }
  }

  showUseDoiInformation() {
    this.setState({
      useDoiModalIsOpen: true,
    })
  }

  // DOI usage accepted and will thus be used instead of URN ("yes")
  acceptDoi() {
    this.handleCreate()
  }

  // User closes the dialogue without accepting DOI usage ("no" or "exit")
  closeUseDoiInformation() {
    this.setState({
      useDoiModalIsOpen: false,
    })
  }

  render() {
    const { original, readonly } = this.props.Stores.Qvain
    // Title text
    let titleKey
    if (this.state.datasetLoading) {
      titleKey = 'qvain.titleLoading'
    } else if (this.state.datasetError) {
      titleKey = 'qvain.titleLoadingFailed'
    } else {
      titleKey = original ? 'qvain.titleEdit' : 'qvain.titleCreate'
    }

    const createLinkBack = (position) => (
      <LinkBackContainer position={position}>
        <LinkBack to="/qvain">
          <FontAwesomeIcon size="lg" icon={faChevronLeft} />
          <Translate component={LinkText} display="block" content="qvain.backLink" />
        </LinkBack>
      </LinkBackContainer>
    )

    // Sticky header content
    let stickyheader
    if (this.state.datasetError) {
      stickyheader = null
    } else if (this.state.datasetLoading) {
      stickyheader = (
        <StickySubHeaderWrapper>
          <StickySubHeader>
            <ButtonContainer>
              <SubmitButton disabled>
                <Translate content="qvain.titleLoading" />
              </SubmitButton>
            </ButtonContainer>
          </StickySubHeader>
          <StickySubHeaderResponse>
            <SubmitResponse response={null} />
          </StickySubHeaderResponse>
        </StickySubHeaderWrapper>
      )
    } else {
      stickyheader = (
        <StickySubHeaderWrapper>
          <CustomSubHeader>
            {createLinkBack('left')}
            <ButtonContainer>
              {original ? (
                <SubmitButton
                  ref={this.updateDatasetButton}
                  disabled={readonly}
                  type="button"
                  onClick={this.handleUpdate}
                >
                  <Translate content="qvain.edit" />
                </SubmitButton>
              ) : (
                <SubmitButton
                  ref={this.submitDatasetButton}
                  type="button"
                  onClick={
                    this.props.Stores.Qvain.useDoi === true
                      ? this.showUseDoiInformation
                      : this.handleCreate
                  }
                >
                  <Translate content="qvain.submit" />
                </SubmitButton>
              )}
            </ButtonContainer>
          </CustomSubHeader>
          <PasState />
          <DeprecatedState />
          {this.state.submitted ? (
            <StickySubHeaderResponse>
              <SubmitResponse response={this.state.response} />
            </StickySubHeaderResponse>
          ) : null}
        </StickySubHeaderWrapper>
      )
    }

    // Dataset form
    let dataset
    if (this.state.datasetError) {
      dataset = (
        <div className="container">
          <ErrorContainer>
            <ErrorLabel>{this.state.datasetErrorTitle}</ErrorLabel>
            <ErrorContent>{this.state.datasetErrorDetails}</ErrorContent>
            <ErrorButtons>
              <Button onClick={this.handleRetry}>Retry</Button>
            </ErrorButtons>
          </ErrorContainer>
        </div>
      )
    } else if (!this.state.haveDataset) {
      dataset = null
    } else {
      dataset = (
        <Form className="container">
          <Modal
            isOpen={this.state.useDoiModalIsOpen}
            onRequestClose={this.closeUseDoiInformation}
            customStyles={customStyles}
            contentLabel="UseDoiModalInformation"
          >
            <Translate content="qvain.useDoiHeader" component="h2" />
            <Translate content="qvain.useDoiContent" component="p" />
            <Button onClick={this.acceptDoi}>
              <Translate content="qvain.useDoiAffirmative" component="span" />
            </Button>
            <Button onClick={this.closeUseDoiInformation}>
              <Translate content="qvain.useDoiNegative" component="span" />
            </Button>
          </Modal>
          <Description />
          <Actors />
          <RightsAndLicenses />
          <Files />
          <History />
          <SubmitContainer>
            <Translate component="p" content="qvain.consent" unsafe />
          </SubmitContainer>
          <STSD onClick={this.setFocusOnSubmitOrUpdateButton}>
            <Translate content="stsd" />
          </STSD>
        </Form>
      )
    }

    return (
      <QvainContainer>
        <SubHeader>
          <SubHeaderTextContainer>
            <SubHeaderText>
              <Translate component={Title} content={titleKey} />
            </SubHeaderText>
          </SubHeaderTextContainer>
        </SubHeader>
        {stickyheader}
        {dataset}
      </QvainContainer>
    )
  }
}

export default withRouter(inject('Stores')(observer(Qvain)))
