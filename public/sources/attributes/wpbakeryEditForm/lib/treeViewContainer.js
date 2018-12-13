import React from 'react'
import TreeViewItem from './treeViewItem'
import PropTypes from 'prop-types'
import lodash from 'lodash'
import WpbakeryModal from 'public/sources/attributes/wpbakeryEditForm/lib/wpbakeryModal'
import WpbakeryIframe from 'public/sources/attributes/wpbakeryEditForm/lib/wpbakeryIframe'

const TreeViewContainerContext = React.createContext()

export default class TreeViewContainerProvider extends React.Component {
  static propTypes = {
    value: PropTypes.string.isRequired
  }

  constructor (props) {
    super(props)
    this.state = {
      value: this.parseShortcode(props.value, ''),
      showEditor: false,
      editorValue: null,
      editorIndex: null
    }
    this.getContent = this.getContent.bind(this)
    this.deleteItem = this.deleteItem.bind(this)
    this.editItem = this.editItem.bind(this)
    this.close = this.close.bind(this)
    this.save = this.save.bind(this)
  }

  parseShortcode (shortcode, level) {
    if (!shortcode) {
      return ''
    }
    const multipleShortcodesRegex = window.wp.shortcode.regexp(window.VCV_API_WPBAKERY_WPB_MAP().join('|'))
    const localShortcodesRegex = new RegExp(multipleShortcodesRegex.source)
    const shortcodes = shortcode.match(multipleShortcodesRegex)
    if (shortcodes) {
      let returnValue = []
      shortcodes.forEach((item, innerIndex) => {
        const parseItem = item.match(localShortcodesRegex)
        let shortcodeData = {
          tag: parseItem[ 2 ],
          params: (parseItem[ 3 ] || '').trim(),
          shortcode: item,
          content: this.parseShortcode((parseItem[ 5 ] || ''), (level ? (`${level}[${innerIndex}].content`) : 'content')),
          index: level ? `${level}[${innerIndex}]` : 'root'
        }
        if (!level) {
          returnValue = shortcodeData
        } else {
          returnValue.push(shortcodeData)
        }
      })
      return returnValue
    }
    return shortcode
  }

  getContent (content, level) {
    let childComponents = []
    if (content instanceof Array && content && content.length) {
      content.forEach((child, index) => {
        if (child.tag && child.index) {
          let childProps = {
            tag: child.tag,
            content: child.content,
            index: child.index,
            level: level,
            shortcode: child.shortcode,
            key: `wpbakery-edit-form-childs-${level}-${index}`
          }
          childComponents.push(<TreeViewItem {...childProps} />)
        }
      })
      return (<ul className='vcv-ui-tree-layout'>{childComponents}</ul>)
    }

    return null
  }

  deleteItem (index) {
    const newValue = index === 'root' ? {} : lodash.omit(this.state.value, index)
    this.setState({ value: newValue })
  }

  editItem (index, shortcode) {
    this.setState({ showEditor: true, editorValue: shortcode, editorIndex: index })
  }

  close () {
    this.setState({
      showEditor: false
    })
  }

  save (shortcode) {
    const childObj = this.parseShortcode(shortcode, this.state.editorIndex)
    console.log('save', childObj)
  }

  getContentForSaveMain = (obj) => {
    return obj && obj.tag ? (obj.content ? `[${obj.tag}]${obj.content.map((i) => {
      return this.getContentForSaveMain(i)
    }).join('')}[/${obj.tag}]` : `[${obj.tag}]`) : obj
  }

  render () {
    return (
      <TreeViewContainerContext.Provider
        value={{
          getContent: this.getContent,
          deleteItem: this.deleteItem,
          editItem: this.editItem
        }}
      >
        {this.state.showEditor ? <WpbakeryModal>
          <WpbakeryIframe close={this.close} save={this.save} value={this.state.editorValue} />
        </WpbakeryModal> : null}
        <div className='vcv-ui-form-dependency'>
          <div className='vcv-ui-form-group'>
            <span className='vcv-ui-form-group-heading'>
              WPB inner elements
            </span>
            <div className='vcv-ui-form-tree-view--attribute'>
              <div className='vcv-ui-tree-layout-container'>
                {this.getContent([ this.state.value ], 0)}
              </div>
            </div>
          </div>
        </div>
      </TreeViewContainerContext.Provider>
    )
  }
}

export const TreeViewContainerConsumer = TreeViewContainerContext.Consumer
