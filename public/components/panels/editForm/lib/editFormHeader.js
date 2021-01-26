import React from 'react'
import classNames from 'classnames'
import { getService, getStorage, env } from 'vc-cake'
import PropTypes from 'prop-types'
const dataManager = getService('dataManager')
const hubElementsService = getService('hubElements')
const workspaceStorage = getStorage('workspace')
const elementsStorage = getStorage('elements')
const workspaceSettings = workspaceStorage.state('settings')
const documentManager = getService('document')
const hubStorage = getStorage('hubAddons')
const editorPopupStorage = getStorage('editorPopup')

export default class EditFormHeader extends React.Component {
  static propTypes = {
    elementAccessPoint: PropTypes.object.isRequired,
    options: PropTypes.object
  }

  constructor (props) {
    super(props)
    this.state = {
      content: props.elementAccessPoint.cook().getName(),
      editable: false,
      hidden: props.elementAccessPoint.cook().get('hidden'),
      isLocked: props.elementAccessPoint.cook().get('metaIsElementLocked')
    }

    this.handleClickEnableEditable = this.handleClickEnableEditable.bind(this)
    this.handleBlurValidateContent = this.handleBlurValidateContent.bind(this)
    this.editTitle = this.editTitle.bind(this)
    this.handleKeyDownPreventNewLine = this.handleKeyDownPreventNewLine.bind(this)
    this.updateElementOnChange = this.updateElementOnChange.bind(this)
    this.handleClickGoBack = this.handleClickGoBack.bind(this)
    this.handleClickHide = this.handleClickHide.bind(this)
    this.updateHiddenState = this.updateHiddenState.bind(this)
    this.updateLockState = this.updateLockState.bind(this)
    this.handleLockElementToggle = this.handleLockElementToggle.bind(this)
  }

  componentDidMount () {
    const { elementAccessPoint } = this.props
    elementAccessPoint.onChange(this.updateElementOnChange)
    workspaceStorage.on('hide', this.updateHiddenState)
    workspaceStorage.on('lock', this.updateLockState)
  }

  componentWillUnmount () {
    const { elementAccessPoint } = this.props
    elementAccessPoint.ignoreChange(this.updateElementOnChange)
    workspaceStorage.off('hide', this.updateHiddenState)
    workspaceStorage.off('lock', this.updateLockState)
  }

  updateHiddenState (id) {
    const { elementAccessPoint } = this.props
    if (id === elementAccessPoint.id) {
      const newHiddenState = documentManager.get(elementAccessPoint.id).hidden
      this.setState({ hidden: newHiddenState })
    }
  }

  updateLockState (id) {
    const { elementAccessPoint } = this.props
    if (id === elementAccessPoint.id) {
      const newLockState = documentManager.get(elementAccessPoint.id).metaIsElementLocked
      this.setState({ isLocked: newLockState })
    }
  }

  updateElementOnChange () {
    const { elementAccessPoint } = this.props
    const cookElement = elementAccessPoint.cook()
    const content = cookElement.getName()
    // Check element name field
    if (this.state.content !== content) {
      this.setState({
        content
      }, () => {
        this.span.innerText = content
      })
    }

    // Trigger attributes events
    const publicKeys = cookElement.filter((key, value, settings) => {
      return settings.access === 'public'
    })
    publicKeys.forEach((key) => {
      const newValue = cookElement.get(key)
      elementsStorage.trigger(`element:${cookElement.get('id')}:attribute:${key}`, newValue, cookElement)
    })
  }

  handleClickEnableEditable () {
    this.setState({
      editable: true
    }, () => {
      this.span.focus()
    })
  }

  editTitle () {
    this.handleClickEnableEditable()
    const range = document.createRange()
    const selection = window.getSelection()
    range.selectNodeContents(this.span)
    selection.removeAllRanges()
    selection.addRange(range)
  }

  updateContent (value) {
    const { elementAccessPoint } = this.props
    if (!value) {
      this.span.innerText = elementAccessPoint.cook().getName()
    }
    elementAccessPoint.set('customHeaderTitle', value)
    this.setState({
      editable: false
    })
  }

  handleBlurValidateContent () {
    const value = this.span.innerText.trim()
    this.updateContent(value)
  }

  handleKeyDownPreventNewLine (event) {
    if (event.key === 'Enter') {
      event.preventDefault()
      event.nativeEvent.stopImmediatePropagation()
      event.stopPropagation()
      this.span.blur()
      this.handleBlurValidateContent()
    }
  }

  handleClickGoBack () {
    let { parentElementAccessPoint: accessPoint, options } = this.props.options
    // If multiple nesting used we can goBack only to ROOT
    if (this.props.isEditFormSettingsOpened) {
      this.props.handleEditFormSettingsToggle()
    } else if (this.props.isElementReplaceOpened) {
      this.props.handleReplaceElementToggle()
    } else {
      while (accessPoint.inner) {
        if (accessPoint.parentElementAccessPoint) {
          accessPoint = accessPoint.parentElementAccessPoint
        } else {
          break
        }
      }
      workspaceStorage.trigger('edit', accessPoint.id, accessPoint.tag, options)
    }
  }

  handleClickCloseContent (e) {
    e && e.preventDefault()
    workspaceSettings.set(false)
  }

  handleClickHide () {
    workspaceStorage.trigger('hide', this.props.elementAccessPoint.id)
  }

  handleLockElementToggle () {
    const isPremiumActivated = dataManager.get('isPremiumActivated')
    const isAddonAvailable = env('VCV_ADDON_ROLE_MANAGER_ENABLED')
    if (isPremiumActivated && isAddonAvailable) {
      const { elementAccessPoint } = this.props
      const options = {}
      const cookElement = elementAccessPoint.cook()
      if (cookElement.containerFor().length > 0) {
        options.lockInnerElements = true
        options.action = !documentManager.get(elementAccessPoint.id).metaIsElementLocked ? 'lock' : 'unlock'
      }
      workspaceStorage.trigger('lock', elementAccessPoint.id, options)
    } else {
      const localizations = dataManager.get('localizations')
      const goPremiumText = localizations ? localizations.goPremium : 'Go Premium'
      const downloadAddonText = localizations ? localizations.downloadTheAddon : 'Download The Addon'
      const descriptionFree = localizations.elementLockPremiumFeatureText || 'With Visual Composer Premium, you can lock or unlock elements to manage who will be able to edit them.'
      const descriptionPremium = localizations.elementLockFeatureActivateAddonText || 'Lock or unlock all elements on your page. Your user roles with Administrator access will be able to edit elements. <br> You can lock/unlock specific elements under the element Edit window. <br> To get access to this feature, download the Role Manager addon from the Visual Composer Hub.'
      const description = isPremiumActivated ? descriptionPremium : descriptionFree
      const fullScreenPopupData = {
        headingText: localizations.elementLockPremiumFeatureHeading || 'Element Lock is a Premium feature',
        buttonText: isPremiumActivated ? downloadAddonText : goPremiumText,
        description: description,
        addonName: 'roleManager',
        isPremiumActivated: isPremiumActivated
      }
      if (isPremiumActivated) {
        fullScreenPopupData.clickSettings = {
          action: 'addHub',
          options: {
            filterType: 'addon',
            id: '4',
            bundleType: undefined
          }
        }
      } else {
        const utm = dataManager.get('utm')
        fullScreenPopupData.url = utm['editor-gopremium-popup-button']
      }
      editorPopupStorage.state('fullScreenPopupData').set(fullScreenPopupData)
      editorPopupStorage.trigger('showFullPagePopup')
    }
  }

  render () {
    const {
      elementAccessPoint,
      options,
      isEditFormSettingsOpened,
      isElementReplaceOpened,
      handleReplaceElementToggle
    } = this.props

    let { content, editable, hidden, isLocked } = this.state
    const isNested = options && (options.child || options.nestedAttr)
    const headerTitleClasses = classNames({
      'vcv-ui-edit-form-header-title': true,
      active: editable
    })
    const localizations = dataManager.get('localizations')
    const closeTitle = localizations ? localizations.close : 'Close'
    const backToParentTitle = localizations ? localizations.backToParent : 'Back to parent'
    let backButton = null
    if (isNested || isEditFormSettingsOpened || isElementReplaceOpened) {
      backButton = (
        <span className='vcv-ui-edit-form-back-button' onClick={this.handleClickGoBack} title={backToParentTitle}>
          <i className='vcv-ui-icon vcv-ui-icon-chevron-left' />
        </span>
      )
    }

    if (isNested && options.activeParamGroupTitle) {
      content = options.activeParamGroupTitle
    }

    const sectionImageSrc = hubElementsService.getElementIcon(elementAccessPoint.tag)
    let sectionImage = null
    if (sectionImageSrc) {
      sectionImage = <img className='vcv-ui-edit-form-header-image' src={sectionImageSrc} title={content} />
    }

    let headerTitle
    if (isNested && options.activeParamGroup) {
      headerTitle = <span className={headerTitleClasses} ref={span => { this.span = span }}>{content}</span>
    } else {
      headerTitle = (
        <span
          className={headerTitleClasses}
          ref={span => { this.span = span }}
          contentEditable={editable}
          suppressContentEditableWarning
          onClick={this.handleClickEnableEditable}
          onKeyDown={this.handleKeyDownPreventNewLine}
          onBlur={this.handleBlurValidateContent}
        >
          {content}
        </span>
      )
    }

    let hideControl = null
    if (elementAccessPoint.tag !== 'column') {
      const iconClasses = classNames({
        'vcv-ui-icon': true,
        'vcv-ui-icon-eye-on': !hidden,
        'vcv-ui-icon-eye-off': hidden
      })
      let visibilityText = ''
      if (hidden) {
        visibilityText = localizations ? localizations.hideOn : 'Hide Element'
      } else {
        visibilityText = localizations ? localizations.hideOff : 'Show Element'
      }
      hideControl = (
        <span
          className='vcv-ui-edit-form-header-control'
          title={visibilityText}
          onClick={this.handleClickHide}
        >
          <i className={iconClasses} />
        </span>
      )
    }

    const editFormSettingsIconClasses = classNames({
      'vcv-ui-icon': true,
      'vcv-ui-icon-cog': true
    })

    let settingsControl = null
    const cookElement = elementAccessPoint.cook()
    const isGeneral = cookElement.relatedTo('General') || cookElement.relatedTo('RootElements')

    if (isGeneral) {
      const editFormSettingsText = localizations ? localizations.editFormSettingsText : 'Element Settings'
      settingsControl = (
        <span
          className='vcv-ui-edit-form-header-control'
          title={editFormSettingsText}
          onClick={this.props.handleEditFormSettingsToggle}
        >
          <i className={editFormSettingsIconClasses} />
        </span>
      )
    }

    const lockElementClasses = classNames({
      'vcv-ui-icon': true,
      'vcv-ui-icon-lock-fill': isLocked,
      'vcv-ui-icon-unlock-fill': !isLocked
    })

    let lockControl = null
    const vcvIsUserAdmin = dataManager.get('vcvManageOptions')
    if (vcvIsUserAdmin && isGeneral) {
      const isPremiumActivated = dataManager.get('isPremiumActivated')
      const isAddonAvailable = hubStorage.state('addons').get() && hubStorage.state('addons').get().roleManager
      const lockElementText = localizations ? localizations.lockElementText : 'Lock Element'
      const lockClasses = classNames({
        'vcv-ui-edit-form-header-control': true,
        'vcv-ui-edit-form-header-control--disabled': !isPremiumActivated || (isPremiumActivated && !isAddonAvailable)
      })
      lockControl = (
        <span
          className={lockClasses}
          title={lockElementText}
          onClick={this.handleLockElementToggle}
        >
          <i className={lockElementClasses} />
        </span>
      )
    }

    let replaceElementIcon = null
    const isRootElement = cookElement.relatedTo('RootElements') || !cookElement.relatedTo('General')
    if (!isRootElement) {
      const category = hubElementsService.getElementCategoryName(elementAccessPoint.tag) || ''
      const isReplaceShown = this.props.getReplaceShownStatus(category)
      if (isReplaceShown) {
        const substituteElementText = localizations ? localizations.substituteElement : 'Substitute Element'
        replaceElementIcon = (
          <span
            className='vcv-ui-edit-form-header-control'
            title={substituteElementText}
            onClick={handleReplaceElementToggle}
          >
            <i className='vcv-ui-icon vcv-ui-icon-swap' />
          </span>
        )
      }
    }

    return (
      <div className='vcv-ui-edit-form-header'>
        {backButton}
        {sectionImage}
        {headerTitle}
        <span className='vcv-ui-edit-form-header-control-container'>
          {isNested ? null : replaceElementIcon}
          {isNested ? null : lockControl}
          {isNested ? null : hideControl}
          {isNested ? null : settingsControl}
          <span
            className='vcv-ui-edit-form-header-control'
            title={closeTitle}
            onClick={this.handleClickCloseContent}
          >
            <i className='vcv-ui-icon vcv-ui-icon-close-thin' />
          </span>
        </span>
      </div>
    )
  }
}
