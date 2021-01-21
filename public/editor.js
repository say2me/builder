/* eslint-disable import/no-webpack-loader-syntax */
import vcCake from 'vc-cake'

import 'public/tools/jqueryCaret' // used in tokenizationList.js
import publicAPI from './components/api/publicAPI'

import { start } from './components/editorInit/start'
import heartbeat from './components/heartbeat/index'
import { rebuildPosts } from './components/editorInit/rebuildPosts'

(() => {
  if (window.vcvPostUpdateAction && window.vcvPostUpdateAction === 'updatePosts') {
    rebuildPosts()
    return
  }
  let started = false
  const setStarted = () => {
    started = true
  }

  // Need to wait while ALL Elements will be initialized otherwise can break layout
  window.onload = () => {
    heartbeat(window.jQuery)
    start(setStarted)
  }
  // In case if jQuery.ready fails try to load manually
  window.setTimeout(() => {
    if (!started) {
      start(setStarted)
    }
  }, 10000)
})()

if (vcCake.env('VCV_DEBUG') === true) {
  window.app = vcCake
}
window.vc = publicAPI