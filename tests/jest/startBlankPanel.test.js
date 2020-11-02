/* global describe, test, expect */
import vcCake from 'vc-cake'
import '../../public/variables'
// Services & Storages
import '../../public/editor/services/utils/service.js'
import '../../public/editor/services/dataManager/service.js'
import '../../public/editor/services/document/service.js'
import '../../public/editor/services/hubElements/service.js'
import '../../public/editor/services/cook/service.js'
import '../../public/editor/services/modernAssetsStorage/service.js'
import '../../public/editor/services/api/service.js'
import '../../public/config/wp-attributes'
import '../../public/editor/stores/elements/elementsStorage'
import '../../public/editor/stores/elements/elementSettings'
import '../../public/editor/modules/elementLimit/module'
import React from 'react'
import renderer from 'react-test-renderer'
// import {cleanup, fireEvent, render} from '@testing-library/react'
import { setupCake } from '../../public/components/editorInit/setupCake'
import NavbarContainer from '../../public/components/navbar/navbarContainer'
import StartBlank from '../../public/components/startBlank/StartBlankPanel'
describe('Tests editor navbar', () => {
  // const navbarContainer = render(
  //   <NavbarContainer wrapperRef={(navbar) => { this.navbar = navbar }} getNavbarPosition={() => { return true}} />
  // )
  test('Navbar render', () => {
    document.body.innerHTML =`
    <div class="vcv-layout-container vcv-is-disabled-outline">
    <div class="vcv-layout" id="vcv-layout">
        <div class="vcv-layout-header" id="vcv-layout-header">
        </div>
        <div class="vcv-layout-content">
            <div class="vcv-layout-iframe-container">
                <div class="vcv-layout-iframe-wrapper">
                    <iframe class="vcv-layout-iframe src="" id="vcv-editor-iframe" frameborder="0" scrolling="auto"></iframe>
                </div>
                <div class="vcv-layout-iframe-overlay" id="vcv-editor-iframe-overlay"></div>
                <div class="vcv-layout-iframe-content" id="vcv-layout-iframe-content">
                    <div class="vcv-loading-overlay">
                        <div class="vcv-loading-overlay-inner">
                            <div class="vcv-loading-dots-container">
                                <div class="vcv-loading-dot vcv-loading-dot-1"></div>
                                <div class="vcv-loading-dot vcv-loading-dot-2"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <div class="vcv-layout-overlay"></div>
</div>
    `
    // setupCake()
    vcCake.add('contentLayout', (api) => {
      const startBlankRender = renderer.create(
        <div className='vcv-layout-iframe-content'>
          <StartBlank unmountStartBlank={() => {}} />
        </div>
      )
      let tree = startBlankRender.toJSON()
      expect(tree).toMatchSnapshot()
    })
    vcCake.env('platform', 'wordpress').start()

  })
})
