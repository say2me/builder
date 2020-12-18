import React from 'react'
import { getStorage, getService } from 'vc-cake'

const historyStorage = getStorage('history')
const utils = getService('utils')
/* Working prototype */
export default class YoastComponent extends React.Component {
  constructor (props) {
    super(props)
    this.handleIframeLoad = this.handleIframeLoad.bind(this)
    this.setContent = this.setContent.bind(this)
    this.updateValueFromIframe = this.updateValueFromIframe.bind(this)

    this.state = {
      showEditor: false,
      loadingEditor: true,
      value: props.value
    }
  }

  setContent () {
    const iframeContent = document.getElementById('vcv-editor-iframe')
    const contentLayout = iframeContent ? iframeContent.contentWindow.document.querySelector('[data-vcv-module="content-layout"]') : false
    const content = contentLayout ? utils.normalizeHtml(contentLayout.innerHTML) : ''

    var contentTinyMce = this.iframe.contentWindow.tinyMCE && this.iframe.contentWindow.tinyMCE.get && this.iframe.contentWindow.tinyMCE.get( 'content' );
    this.iframe.contentWindow.jQuery( '#content' ).val( content );
    if ( contentTinyMce && contentTinyMce.setContent ) {
      contentTinyMce.setContent( content );
      contentTinyMce.fire( 'change' );
    }
  }
  handleIframeLoad () {
    const window = this.iframe.contentWindow
    window.document.querySelector('#post-body-content').classList.add('hidden')
    window.document.querySelector('#screen-options-link-wrap').classList.add('hidden')
    window.document.querySelector('#postbox-container-1').classList.add('hidden')
    window.document.querySelector('.wp-heading-inline').remove()
    window.jQuery('.notice').remove()
    // Set current content
    // Editor settings
    const postIdInput = this.iframe.contentWindow.document.getElementById('post_ID')
    const id = postIdInput ? postIdInput.value : ''
    this.setContent()

    const postTitle = window.document.querySelector('.editor-post-title')
    const notice = window.document.querySelector('.components-notice-list')
    if (postTitle) {
      postTitle.value
      postTitle.classList.add('hidden')
    }
    if (notice) {
      notice.classList.add('hidden')
    }
    // this.renderGutenbergControls(window)
    historyStorage.state('canUndo').onChange(this.setContent)
    this.setState({ loadingEditor: false })
  }
  componentWillUnmount() {
    historyStorage.state('canUndo').ignoreChange(this.setContent)
  }
  getControlsHTML () {
    // const localizations = window.VCV_I18N && window.VCV_I18N()
    // const gutenbergEditorUpdateButton = localizations.gutenbergEditorUpdateButton ? localizations.gutenbergEditorUpdateButton : 'Update'
    // return `
    //   <div class="vcv-gutenberg-controls-container">
    //       ${iframeControlStyles()}
    //       <button class="vcv-gutenberg-modal-update-button">${gutenbergEditorUpdateButton}</button>
    //       <button class="vcv-gutenberg-modal-close-button">
    //         <i class="vcv-ui-icon-close-thin"></i>
    //       </button>
    //   </div>
    // `
    return <div />
  }

  renderGutenbergControls (iframe) {
    const postToolbar = iframe.document.querySelector('.edit-post-header-toolbar')
    const controlHTML = this.getControlsHTML()
    postToolbar.insertAdjacentHTML('afterend', controlHTML)
    const updateButton = iframe.document.querySelector('.vcv-gutenberg-modal-update-button')
    const closeButton = iframe.document.querySelector('.vcv-gutenberg-modal-close-button')
    updateButton.addEventListener('click', this.updateEditor)
  }

  updateValueFromIframe () {
    if (!this.iframe || !this.iframe.contentWindow || !this.iframe.contentWindow.wp) {
      return
    }
    const wpData = this.iframe.contentWindow.wp.data
    if (wpData) {
      const value = wpData.select('core/editor').getEditedPostContent()
      this.setFieldValue(value)
    }
  }

  render () {
    const { loadingEditor } = this.state
    let loadingOverlay = null
    if (loadingEditor) {
      loadingOverlay = (
        <div className='vcv-loading-overlay'>
        </div>
      )
    }
    const iframeURL = '/wp-admin/post-new.php?post_type=vcv_yoast_panel' // change with vcv action
    return (
      <>
        {loadingOverlay}
        <div className='vcv-yoast-panel-inner'>
          <iframe id='vcv-yoast-panel-iframe' ref={(iframe) => { this.iframe = iframe }} src={iframeURL} onLoad={this.handleIframeLoad} />
        </div>
      </>
    )
  }
}
