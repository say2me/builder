import React from 'react'
import EditFormHeader from './editFormHeader'
import classNames from 'classnames'
import PropTypes from 'prop-types'
import EditFormSection from './editFormSection'
import EditFormReplaceElement from './editFormReplaceElement'
import PremiumTeaser from 'public/components/premiumTeasers/component'
import Scrollbar from 'public/components/scrollbar/scrollbar.js'
import { getService, getStorage, env } from 'vc-cake'

const dataManager = getService('dataManager')
const hubElementsService = getService('hubElements')
const hubElementsStorage = getStorage('hubElements')

export default class EditForm extends React.Component {
  static propTypes = {
    elementAccessPoint: PropTypes.object.isRequired,
    activeTabId: PropTypes.string,
    options: PropTypes.object
  }

  scrollbar = false

  constructor (props) {
    super(props)
    this.allTabs = this.updateTabs(this.props)
    this.state = {
      activeTabIndex: this.getActiveTabIndex(this.props.activeTabId),
      isEditFormSettingsOpened: false,
      isElementReplaceOpened: props.options && props.options.isReplaceOpened ? props.options.isReplaceOpened : false
    }
    this.scrollBarMounted = this.scrollBarMounted.bind(this)
    this.toggleEditFormSettings = this.toggleEditFormSettings.bind(this)
    this.toggleShowReplace = this.toggleShowReplace.bind(this)
    this.getPremiumTeaser = this.getPremiumTeaser.bind(this)
  }

  scrollBarMounted (scrollbar) {
    this.scrollbar = scrollbar
  }

  getActiveTabIndex (activeTabKey) {
    const activeTab = this.allTabs && this.allTabs.findIndex((tab) => {
      return tab.fieldKey === activeTabKey
    })
    return activeTab > -1 ? activeTab : 0
  }

  /* eslint-disable */
  UNSAFE_componentWillReceiveProps (nextProps) {
    this.allTabs = this.updateTabs(nextProps)
    this.setState({
      activeTabIndex: this.getActiveTabIndex(nextProps.activeTabId)
    })
  }

  /* eslint-enable */

  updateTabs (props) {
    return this.editFormTabs(props).map((tab, index) => {
      return {
        fieldKey: tab.key,
        index: index,
        data: tab.data,
        isVisible: true,
        pinned: tab.data.settings && tab.data.settings.options && tab.data.settings.options.pinned ? tab.data.settings.options.pinned : false,
        params: this.editFormTabParams(props, tab),
        key: `edit-form-tab-${props.elementAccessPoint.id}-${index}-${tab.key}`,
        changeTab: this.onChangeActiveTab.bind(this, index),
        ref: (ref) => {
          if (this.allTabs[index]) {
            this.allTabs[index].realRef = ref
          }
        }
      }
    })
  }

  editFormTabs (props) {
    const cookElement = props.elementAccessPoint.cook()
    const group = cookElement.get('metaEditFormTabs')
    if (props.options.nestedAttr) {
      const groups = []
      const attributes = cookElement.settings(props.options.fieldKey)
      const metaEditFormTabs = attributes.settings.options.settings.metaEditFormTabs.value
      metaEditFormTabs.forEach((tab) => {
        const iterator = {
          key: tab,
          value: attributes.settings.options.settings[tab].value,
          data: attributes.settings.options.settings[tab]
        }
        groups.push(iterator)
      })
      return groups
    }
    if (group && group.each) {
      return group.each(item => (this.editFormTabsIterator(props, item)))
    }
    return []
  }

  editFormTabsIterator (props, item) {
    const cookElement = props.elementAccessPoint.cook()
    return {
      key: item,
      value: cookElement.get(item),
      data: cookElement.settings(item)
    }
  }

  editFormTabParams (props, tab) {
    const cookElement = props.elementAccessPoint.cook()
    if (props.options.nestedAttr) {
      const paramGroupValues = cookElement.get(props.options.fieldKey).value
      const currentParamGroupValue = paramGroupValues[props.options.activeParamGroupIndex]

      if (tab.data.type === 'group') {
        return tab.value.map((item) => {
          return {
            key: item,
            value: currentParamGroupValue[item],
            data: cookElement.settings(props.options.fieldKey).settings.options.settings[item]
          }
        })
      } else {
        return [tab]
      }
    }
    if (tab.data.settings.type === 'group' && tab.value) {
      return tab.value.each(item => (this.editFormTabsIterator(props, item)))
    }
    // In case if tab is single param holder
    return [tab]
  }

  onChangeActiveTab (tabIndex) {
    this.setState({
      activeTabIndex: tabIndex
    })
  }

  getAccordionSections () {
    const { activeTabIndex } = this.state
    return this.allTabs.map((tab, index) => {
      return (
        <EditFormSection
          {...this.props}
          sectionIndex={index}
          activeTabIndex={activeTabIndex}
          getSectionContentScrollbar={() => { return this.scrollbar }}
          key={tab.key}
          tab={tab}
          getReplaceShownStatus={this.getReplaceShownStatus}
        />
      )
    })
  }

  getPremiumTeaser () {
    const localizations = dataManager.get('localizations')
    const isPremiumActivated = dataManager.get('isPremiumActivated')
    const goPremiumText = localizations.goPremium || 'Go Premium'
    const downloadAddonText = localizations.downloadTheAddon || 'Download The Addon'
    const headingText = localizations.elementSettingsPremiumFeatureHeading || 'Element Settings is a Premium Feature'
    const buttonText = isPremiumActivated ? downloadAddonText : goPremiumText
    const descriptionFree = localizations.elementSettingsPremiumFeatureText || 'With Visual Composer Premium, you can change the default parameters to create a unique element and save it to your Content Library.'
    const descriptionPremium = localizations.elementPresetsActivateAddonText || 'With the Element Presets addon, you can change the default parameters to create a unique element and save it to your Content Library.'
    const description = isPremiumActivated ? descriptionPremium : descriptionFree
    const utm = dataManager.get('utm')
    const utmUrl = utm['editor-element-settings-go-premium']

    return (
      <PremiumTeaser
        headingText={headingText}
        buttonText={buttonText}
        description={description}
        url={utmUrl}
        isPremiumActivated={isPremiumActivated}
        addonName='elementPresets'
      />
    )
  }

  getEditFormSettingsSections () {
    const isRootElement = this.props.elementAccessPoint.cook().relatedTo('RootElements')
    const localizations = dataManager.get('localizations')
    const tabLabel = localizations ? localizations.editFormSettingsText : 'Element Presets'

    return (
      <EditFormSection
        isEditFormSettings
        isRootElement={isRootElement}
        sectionIndex={0}
        activeTabIndex={0}
        getSectionContentScrollbar={() => { return this.scrollbar }}
        elementId={this.props.elementAccessPoint.id}
        tab={{
          fieldKey: 0,
          data: {
            settings: {
              options: {
                label: tabLabel
              }
            }
          }
        }}
        onAttributeChange={() => false}
      />
    )
  }

  toggleEditFormSettings () {
    this.setState({
      isEditFormSettingsOpened: !this.state.isEditFormSettingsOpened,
      isElementReplaceOpened: false
    })
  }

  toggleShowReplace () {
    this.setState({
      isElementReplaceOpened: !this.state.isElementReplaceOpened,
      isEditFormSettingsOpened: false
    })
  }

  getReplaceElementBlock () {
    return <EditFormReplaceElement {...this.props} />
  }

  getReplaceShownStatus (category) {
    const categorySettings = hubElementsService.get(category)
    let showElementReplaceIcon = false
    const presetsByCategory = hubElementsStorage.action('getPresetsByCategory', category)

    if (presetsByCategory.length) {
      showElementReplaceIcon = true
    }

    if (!showElementReplaceIcon && categorySettings && categorySettings.elements && categorySettings.elements.length > 1) {
      const replaceElements = categorySettings.elements.filter(categoryTag => Object.keys(hubElementsStorage.state('elements').get()).includes(categoryTag))
      showElementReplaceIcon = replaceElements.length > 1
    }

    return showElementReplaceIcon
  }

  render () {
    const { activeTabIndex, isEditFormSettingsOpened, showElementReplaceIcon, isElementReplaceOpened } = this.state
    const activeTab = this.allTabs[activeTabIndex]
    const isAddonEnabled = env('VCV_ADDON_ELEMENT_PRESETS_ENABLED')

    let content = null
    if (isEditFormSettingsOpened) {
      if (isAddonEnabled) {
        content = this.getEditFormSettingsSections()
      } else {
        content = this.getPremiumTeaser()
      }
    } else if (isElementReplaceOpened) {
      content = this.getReplaceElementBlock()
    } else {
      content = this.getAccordionSections()
    }

    const plateClass = classNames({
      'vcv-ui-editor-plate': true,
      'vcv-ui-state--centered': !isAddonEnabled,
      'vcv-ui-state--active': true
    }, `vcv-ui-editor-plate-${activeTab.key}`)

    const editFormClasses = classNames({
      'vcv-ui-tree-view-content': true,
      'vcv-ui-tree-view-content-accordion': true,
      'vcv-ui-state--hidden': !this.props.visible
    })

    return (
      <div className={editFormClasses}>
        <EditFormHeader
          isEditFormSettingsOpened={isEditFormSettingsOpened}
          handleEditFormSettingsToggle={this.toggleEditFormSettings}
          elementAccessPoint={this.props.elementAccessPoint}
          options={this.props.options}
          showElementReplaceIcon={showElementReplaceIcon}
          isElementReplaceOpened={isElementReplaceOpened}
          handleReplaceElementToggle={this.toggleShowReplace}
          getReplaceShownStatus={this.getReplaceShownStatus}
        />
        <div className='vcv-ui-tree-content'>
          <div className='vcv-ui-tree-content-section'>
            <Scrollbar ref={this.scrollBarMounted} initialScrollTop={this.props.options && this.props.options.replaceElementScrollTop}>
              <div className='vcv-ui-tree-content-section-inner'>
                <div className='vcv-ui-editor-plates-container'>
                  <div className='vcv-ui-editor-plates'>
                    <div className={plateClass}>
                      {content}
                    </div>
                  </div>
                </div>
              </div>
            </Scrollbar>
          </div>
        </div>
      </div>
    )
  }
}
