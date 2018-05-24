import React, { Component } from 'react'
import styled from 'styled-components'

import DatasetQuery from '../../../../stores/view/datasetquery'
import createTree from '../../../../utils/createTree'
import checkDataLang from '../../../../utils/checkDataLang'
import checkNested from '../../../../utils/checkNested'
import { accessRightsBool } from '../../accessRights'
import TableHeader from '../tableHeader'
import Table from '../table'
import Breadcrumbs from '../breadcrumbs'

export default class IdaResources extends Component {
  constructor(props) {
    super(props)
    const results = DatasetQuery.results
    const files = results.research_dataset.files
    const folders = results.research_dataset.directories
    if (files || folders) {
      const combined = this.createDirTree(files, folders)
      // createTree converts combined to object with nested hierarchy
      const fileDirTree = createTree(combined)
      const totalCount = this.countFiles(fileDirTree)
      this.state = {
        results,
        access: accessRightsBool(results.research_dataset.access_rights),
        fileDirTree,
        currentFolder: fileDirTree,
        currentPath: [],
        currentIDs: [],
        totalCount,
      }
    }

    this.updatePath = this.updatePath.bind(this)
    this.changeFolder = this.changeFolder.bind(this)
    this.query = this.query.bind(this)
  }

  // combines folders and files into single array of objects
  // {
  //   path:
  //   type:
  //   details:
  //   description:
  //   use_category:
  //   title:
  //   identifier:
  // }
  createDirTree(files, folders, fileApi = false) {
    let filePaths = []
    let folderPaths = []
    if (files) {
      filePaths = files.map(file => {
        let fileType
        let fileDetails = file.details
        if (file.type || file.file_type) {
          fileType = file.type
            ? checkDataLang(file.type.pref_label)
            : checkDataLang(file.file_type.pref_label)
        }
        if (fileApi) {
          fileDetails = file
        }
        return {
          path: fileDetails.file_path.substring(1),
          type: fileType,
          download_url: file.access_url,
          details: fileDetails,
          description: file.description,
          use_category: file.use_category,
          title: file.title,
          identifier: file.identifier,
        }
      })
    }
    if (folders) {
      folderPaths = folders.map(folder => {
        let folderDetails = folder.details
        if (fileApi) {
          folderDetails = folder
        }
        return {
          path: folderDetails.directory_path.substring(1),
          type: 'dir',
          download_url: folder.access_url,
          details: folderDetails,
          description: folder.description,
          use_category: folder.use_category,
          title: folder.title,
          identifier: folder.identifier,
        }
      })
    }
    if (files && folders) {
      return filePaths.concat(folderPaths)
    }
    if (files || folders) {
      return files ? filePaths : folderPaths
    }
    return null
  }

  // counts total number of files in dataset (files + folders)
  // file = 1
  // folder = file_count
  countFiles(dirTree) {
    const fileCount = dirTree.map(single => {
      if (single.details.file_count) {
        return single.details.file_count
      }
      return 1
    })
    return fileCount.reduce((prev, curr) => prev + curr)
  }

  query(id, newPath, newIDs) {
    DatasetQuery.getFolderData(id, this.state.results.identifier)
      .then(res => {
        const currFolder = createTree(
          this.createDirTree(res.files, res.directories, true)
        ).reverse()
        this.setState({
          currentPath: newPath,
          currentIDs: newIDs,
          currentFolder: currFolder,
        })
      })
      .catch(err => {
        console.log(err)
      })
  }

  changeFolder(folderName, id) {
    const path = this.state.currentPath.slice()
    path.push(folderName)
    const identifiers = this.state.currentIDs.slice()
    identifiers.push(id)
    const clickedFolder = this.state.currentFolder.find(single => single.identifier === id)
    this.query(clickedFolder.identifier, path, identifiers)
  }

  updatePath(path, id) {
    if (!path) {
      this.setState({
        currentPath: [],
        currentIDs: [],
        currentFolder: this.state.fileDirTree,
      })
    } else {
      const currentIDs = this.state.currentIDs.slice()
      const newIDs = currentIDs.slice(0, currentIDs.indexOf(id) + 1)
      const currentPaths = this.state.currentPath.slice()
      const newPaths = currentPaths.slice(0, currentPaths.indexOf(path) + 1)

      this.query(id, newPaths, newIDs)
    }
  }

  parseIda = ida => {
    // TODO: add download_url to parsed object
    const parsed = {}
    if (ida.type === 'dir') {
      parsed.file_count = ida.details.file_count
    }
    parsed.type = ida.type
    parsed.name = ida.name
    parsed.byte_size = ida.details.byte_size
    parsed.identifier = ida.identifier
    if (checkNested(ida, 'use_category', 'pref_label')) {
      parsed.category = ida.use_category.pref_label
    }
    parsed.download_url = ida.download_url
    parsed.description = ida.description
    return parsed
  }

  render() {
    if (!this.state.results) {
      return 'Loading'
    }

    return (
      <DataTable>
        <TableHeader
          objectCount={this.state.totalCount}
          totalSize={this.state.results.research_dataset.total_ida_byte_size}
          title={'files'}
          access={this.state.access}
          crId={this.state.results.identifier}
          downloadAll
        />
        <Breadcrumbs
          path={this.state.currentPath}
          folderIds={this.state.currentIDs}
          changeFolder={this.updatePath}
        />
        <Table
          data={this.state.currentFolder.map(single => this.parseIda(single))}
          access={this.state.access}
          changeFolder={this.changeFolder}
          fields={{ size: true, category: true, name: true, downloadBtn: true, infoBtn: true }}
        />
      </DataTable>
    )
  }
}

const DataTable = styled.div`
  margin-top: 1em;
`