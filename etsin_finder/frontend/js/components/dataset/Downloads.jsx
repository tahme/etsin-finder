import React, { Component } from 'react'
import DatasetQuery from '../../stores/view/datasetquery'
import Breadcrumbs from './data/breadcrumbs'
import checkDataLang from '../../utils/checkDataLang'
import sizeParse from '../../utils/sizeParse'
import createTree from '../../utils/createTree'

export default class Downloads extends Component {
  constructor(props) {
    super(props)

    const files = DatasetQuery.results.research_dataset.files
    const folders = DatasetQuery.results.research_dataset.directories
    const fileDirTree = this.createDirTree(files, folders)
    this.state = {
      results: DatasetQuery.results,
      fileDirTree,
    }
  }

  createDirTree(files, folders) {
    let filePaths = []
    let folderPaths = []
    if (filePaths) {
      filePaths = files.map(file => ({
        path: file.details.file_path.substring(1),
        type: 'file',
        details: file.details,
        use_category: file.use_category,
        title: file.title,
      }))
    }
    if (folders) {
      folderPaths = folders.map(folder => ({
        path: folder.details.directory_path.substring(1),
        type: 'directory',
        details: folder.details,
        use_category: folder.use_category,
        title: folder.title,
      }))
    }
    const combined = filePaths.concat(folderPaths)
    return createTree(combined)
  }

  tableItem(item, index) {
    return (
      <tr key={`filelist-${index}`}>
        <td className="fileIcon">
          <i className="far fa-file-alt" data-fa-transform="grow-6" />
        </td>
        <td className="fileName">
          <p>
            {item.details.file_name
              ? item.details.file_name
              : item.details.directory_name}
          </p>
          {item.title}
        </td>
        <td className="fileSize">{sizeParse(item.details.byte_size, 1)}</td>
        <td className="fileCategory">
          {checkDataLang(item.use_category.pref_label)}
        </td>
        <td className="fileButtons">
          <button>Tietoja</button>
          <button>Lataa</button>
        </td>
      </tr>
    )
  }

  render() {
    console.log(this.state.results)
    if (!this.state.results) {
      return 'Loading'
    }
    console.log(this.state.fileDirTree)
    return (
      <div className="dataset-downloads">
        <div className="downloads-header d-flex justify-content-between">
          <div className="heading-right">
            <div className="title">Tiedostot</div>
            <div className="files-size-all">
              {`${
                this.state.results.research_dataset.files.length
              } aineistoa (${sizeParse(
                this.state.results.research_dataset.total_ida_byte_size,
                1
              )})`}
            </div>
          </div>
          <div className="heading-left d-flex align-items-center">
            <div className="files-filter">Suodata</div>
            <div className="files-search">Search</div>
          </div>
        </div>
        <Breadcrumbs />
        <table className="table downloads-table">
          <thead className="thead-dark">
            <tr>
              <th className="rowIcon" scope="col" />
              <th className="rowName" scope="col">
                Nimi
              </th>
              <th className="rowSize" scope="col">
                Koko
              </th>
              <th className="rowCategory" scope="col">
                Kategoria
              </th>
              <th className="rowButtons" scope="col" />
            </tr>
          </thead>
          <tbody>
            {this.state.fileDirTree.map((single, i) =>
              this.tableItem(single, i)
            )}
          </tbody>
        </table>
      </div>
    )
  }
}
