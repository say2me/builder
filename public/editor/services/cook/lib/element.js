/* eslint jsx-quotes: [2, "prefer-double"] */
import React from 'react'
import vcCake from 'vc-cake'
import lodash from 'lodash'

import elementSettings from './element-settings'
import elementComponent from './element-component'
import DynamicElement from 'public/components/dynamicFields/dynamicElement'
import { getAttributeType } from './tools'

const { createKey, getBlockRegexp } = vcCake.getService('utils')
const blockRegexp = getBlockRegexp()
const hubElementService = vcCake.getService('hubElements')
const assetsStorage = vcCake.getStorage('assets')
const elData = Symbol('element data')
const elComponent = Symbol('element component')
let cookApi = null
export default class Element {
  constructor (data, dataSettings = null, cssSettings = null, API) {
    this.init(data, dataSettings, cssSettings, API)
  }

  init (data, dataSettings = null, cssSettings = null, API) {
    let { id = createKey(), parent = false, tag, order, customHeaderTitle, hidden, metaElementAssets, ...attr } = data
    attr.tag = tag
    attr.id = id
    cookApi = API

    let elements = hubElementService.all()
    let element = elements ? elements[ tag ] : null

    if (!element) {
      // vcCake.env('VCV_DEBUG') === true && console.warn(`Element ${tag} is not registered in system`, data)
      element = {
        settings: {
          metaDescription: '',
          metaPreviewUrl: '',
          metaThumbnailUrl: '',
          name: '--'
        }
      }
    }

    let metaSettings = element.settings

    let settings = {}
    let elSettings = elementSettings && elementSettings.get ? elementSettings.get(tag) : null

    if (dataSettings) {
      for (let k in dataSettings) {
        if (dataSettings.hasOwnProperty(k)) {
          const attrSettings = getAttributeType(k, dataSettings)
          if (attrSettings.hasOwnProperty('settings')) {
            settings[ k ] = attrSettings.settings
            settings[ k ].attrSettings = attrSettings
          }
        }
      }
    } else {
      settings = elSettings ? elSettings.settings : {}
    }
    if (!cssSettings) {
      cssSettings = elSettings ? elSettings.cssSettings : {}
    }

    if (settings && settings.modifierOnCreate) {
      attr = settings.modifierOnCreate(lodash.defaultsDeep({}, attr))
    }

    Object.defineProperty(this, elData, {
      writable: true,
      value: {
        id: id,
        tag: tag,
        parent: parent,
        data: attr,
        name: metaSettings.name,
        metaThumbnailUrl: metaSettings.metaThumbnailUrl,
        metaPreviewUrl: metaSettings.metaPreviewUrl,
        metaDescription: metaSettings.metaDescription,
        metaAssetsPath: element.assetsPath,
        metaElementPath: element.elementPath,
        metaBundlePath: element.bundlePath,
        customHeaderTitle: customHeaderTitle || '',
        order: order,
        hidden: hidden,
        settings: settings || {},
        cssSettings: cssSettings || {},
        metaElementAssets: metaElementAssets || {},
        getAttributeType: function (k) {
          return getAttributeType(k, this.settings)
        }
      }
    })
    Object.defineProperty(this, elComponent, {
      value: {
        add (Component) {
          elementComponent.add(tag, Component)
        },
        get () {
          return elementComponent.get(tag)
        },
        has () {
          return elementComponent.has(tag)
        }
      }
    })
  }

  get (k, raw = false) {
    if (Object.keys(this[ elData ]).indexOf(k) > -1) {
      return this[ elData ][ k ]
    }
    let { type, settings } = this[ elData ].getAttributeType(k)

    return type && settings ? type.getValue(settings, this[ elData ].data, k, raw) : undefined
  }

  settings (k, settings = false) {
    if (settings !== false) {
      return getAttributeType(k, settings)
    }
    return this[ elData ].getAttributeType(k)
  }

  get data () {
    return this[ elData ].data
  }

  set (k, v) {
    if ([ 'customHeaderTitle', 'parent', 'metaElementAssets' ].indexOf(k) > -1) {
      this[ elData ][ k ] = v
      return this[ elData ][ k ]
    }
    let { type, settings } = this[ elData ].getAttributeType(k)
    if (type && settings) {
      this[ elData ].data = type.setValue(settings, this[ elData ].data, k, v)
    }
    return this[ elData ].data[ k ]
  }

  toJS (raw = true, publicOnly = true) {
    let data = {}
    for (let k of Object.keys(this[ elData ].settings)) {
      let value = this.get(k, raw)
      if (value !== undefined) {
        data[ k ] = value
      }
    }
    data.id = this[ elData ].id
    data.tag = this[ elData ].tag
    data.name = this[ elData ].name
    data.metaThumbnailUrl = this[ elData ].metaThumbnailUrl
    data.metaPreviewUrl = this[ elData ].metaPreviewUrl
    data.metaDescription = this[ elData ].metaDescription
    data.metaAssetsPath = this[ elData ].metaAssetsPath
    data.metaElementPath = this[ elData ].metaElementPath
    data.metaBundlePath = this[ elData ].metaBundlePath
    data.metaElementAssets = this[ elData ].metaElementAssets
    if (this[ elData ].customHeaderTitle !== undefined) {
      data.customHeaderTitle = this[ elData ].customHeaderTitle
    }
    if (this[ elData ].hidden !== undefined) {
      data.hidden = this[ elData ].hidden
    } else {
      data.hidden = false
    }
    // JSON.parse can return '' for false entries
    if (this[ elData ].parent !== undefined && this[ elData ].parent !== '') {
      data.parent = this[ elData ].parent
    } else {
      data.parent = false
    }
    if (this[ elData ].order !== undefined) {
      data.order = this[ elData ].order
    } else {
      data.order = 0
    }
    if (publicOnly) {
      const publicKeys = this.getPublicKeys() // TODO: merge all data with public keys
      return lodash.pick(data, publicKeys)
    }
    return data
  }

  /**
   * Get all fields as groups: if group in group
   * Lazy list
   *
   * @param keys
   */
  relatedTo (keys) {
    const group = this.get('relatedTo')
    return group && group.has && group.has(keys)
  }

  /**
   * Get container for value from group
   * @returns [] - list of
   */
  containerFor () {
    const group = this.get('containerFor')
    if (group && group.each) {
      return group.each()
    }

    return []
  }

  /**
   * Get all attributes using getter of attributes types
   */
  getAll (onlyPublic = true) {
    return this.toJS(false, onlyPublic)
  }

  filter (callback) {
    return Object.keys(this[ elData ].settings).filter((key) => {
      let settings = this[ elData ].settings[ key ]
      let value = this.get(key)
      return callback(key, value, settings)
    })
  }

  getPublicKeys () {
    return [ 'id', 'order', 'parent', 'tag', 'customHeaderTitle', 'metaAssetsPath', 'hidden', 'metaElementAssets' ].concat(this.filter((key, value, settings) => {
      return settings.access === 'public'
    }))
  }

  getName () {
    return this.get('customHeaderTitle') || this.get('name')
  }

  getContentComponent () {
    if (!this[ elComponent ].has()) {
      let elSettings = elementSettings.get(this[ elData ].tag)
      if (vcCake.env('VCV_DEBUG') === true && (!elSettings || !elSettings.component)) {
        console.error('Component settings doesnt exists! Failed to get component', this[ elData ].tag, this[ elData ], elSettings, this[ elComponent ])
      }
      elSettings && elSettings.component && elSettings.component(this[ elComponent ])
    }
    return this[ elComponent ].get()
  }

  static create (tag) {
    return new Element({ tag: tag })
  }

  visualizeAttributes (atts) {
    let layoutAtts = {}
    Object.keys(atts).forEach((fieldKey) => {
      const attrSettings = this.settings(fieldKey)
      const type = attrSettings.type && attrSettings.type.name ? attrSettings.type.name : ''
      const options = attrSettings.settings.options ? attrSettings.settings.options : {}
      let value = null
      if (typeof atts[ fieldKey ] === 'object' && atts[ fieldKey ] !== null && !(atts[ fieldKey ] instanceof Array)) {
        value = Object.assign({}, atts[ fieldKey ])
      } else {
        value = atts[ fieldKey ]
      }
      let dynamicValue = value

      // Check isDynamic for string/htmleditor/attachimage
      let isDynamic = false
      if (vcCake.env('VCV_JS_FT_DYNAMIC_FIELDS') && typeof options.dynamicField !== 'undefined') {
        if ([ 'string', 'htmleditor' ].indexOf(type) !== -1 && value.match(blockRegexp)) {
          isDynamic = true
        } else if ([ 'attachimage' ].indexOf(type) !== -1) {
          let testValue = value
          if (typeof testValue !== 'string') {
            testValue = value.full ? value.full : (value.urls && value.urls[ 0 ] ? value.urls[ 0 ].full : '')
          }
          isDynamic = testValue.match(blockRegexp)
          if (isDynamic) {
            dynamicValue = testValue
          }
        }
      }

      if (isDynamic) {
        const blockInfo = dynamicValue.split(blockRegexp)

        let dynamicFieldsData = cookApi.dynamicFields.getDynamicFieldsData(
          {
            fieldKey: fieldKey,
            value: dynamicValue,
            blockName: blockInfo[ 3 ],
            blockAtts: JSON.parse(blockInfo[ 4 ].trim()),
            blockContent: blockInfo[ 7 ]
          },
          {
            fieldKey: fieldKey,
            fieldType: attrSettings.type.name,
            fieldOptions: attrSettings.settings.options
          }
        )

        if ([ 'attachimage' ].indexOf(type) !== -1) {
          if (value && value.full) {
            value.full = dynamicFieldsData
            layoutAtts[ fieldKey ] = value
          } else if (value.urls && value.urls[ 0 ]) {
            let newValue = { ids: [], urls: [ { full: dynamicFieldsData } ] }
            if (value.urls[ 0 ] && value.urls[ 0 ].filter) {
              newValue.urls[ 0 ].filter = value.urls[ 0 ].filter
            }
            if (value.urls[ 0 ] && value.urls[ 0 ].link) {
              newValue.urls[ 0 ].link = value.urls[ 0 ].link
            }
            layoutAtts[ fieldKey ] = newValue
          } else {
            layoutAtts[ fieldKey ] = dynamicFieldsData
          }
        } else {
          layoutAtts[ fieldKey ] = dynamicFieldsData
        }
      } else {
        layoutAtts[ fieldKey ] = value
      }
    })
    return layoutAtts
  }

  render (content, editor, inner = true) {
    if (!this[ elComponent ].has()) {
      elementSettings.get(this[ elData ].tag).component(this[ elComponent ])
    }
    let ElementToRender = this[ elComponent ].get()
    let props = {}
    let editorProps = {}
    let atts = this.toJS(true, false)
    props.key = this[ elData ].id + '-' + Date.now()
    props.id = this[ elData ].atts && typeof this[ elData ].atts.metaCustomId !== 'undefined' ? this[ elData ].atts.metaCustomId : this[ elData ].id
    editorProps[ 'data-vc-element' ] = this[ elData ].id
    if (typeof editor === 'undefined' || editor) {
      props.editor = editorProps
    }
    props.atts = this.visualizeAttributes(atts) // TODO: VisualizeAttributes from htmlLayout/Element.js
    props.rawAtts = atts
    props.content = content
    if (inner) {
      assetsStorage.trigger('updateInnerElementByData', atts)
    }

    return <DynamicElement
      key={this[ elData ].id + '-' + Date.now()} // key must be unique to call unmount on each update & replace
      cookApi={cookApi}
      cookElement={this}
      element={this.getAll()}
      elementToRender={ElementToRender}
      elementProps={{ ...props }}
      inner={inner}
    />
  }
}
