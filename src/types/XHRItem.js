var AbstractItem = require('./AbstractItem')
var energize = require('../energize')

var undef

var IS_SUPPORT_XML_HTTP_REQUEST = !!window.XMLHttpRequest

function XHRItem (url) {
  if (!url) return
  _super.constructor.apply(this, arguments)
  this.responseType = this.responseType || ''
  this.method = this.method || 'GET'
}

module.exports = XHRItem
XHRItem.type = 'xhr'
XHRItem.extensions = []
energize.register(XHRItem)

XHRItem.retrieve = function () {
  return false
}

var _super = AbstractItem.prototype
var _p = XHRItem.prototype = new AbstractItem()
_p.constructor = XHRItem
_p.load = load
_p._onXmlHttpChange = _onXmlHttpChange
_p._onXmlHttpProgress = _onXmlHttpProgress
_p._onLoad = _onLoad

function load () {
  _super.load.apply(this, arguments)
  var self = this
  var xmlhttp

  if (IS_SUPPORT_XML_HTTP_REQUEST) {
    xmlhttp = this.xmlhttp = new XMLHttpRequest()
  } else {
    xmlhttp = this.xmlttp = new ActiveXObject('Microsoft.XMLHTTP')
  }
  if (this.hasLoading) {
    xmlhttp.onprogress = function (evt) {
      self._onXmlHttpProgress(evt)
    }
  }
  xmlhttp.onreadystatechange = function () {
    self._onXmlHttpChange
  }
  xmlhttp.open(this.method, this.url, true)
  this.xmlttp.responseType = this.responseType

  if (IS_SUPPORT_XML_HTTP_REQUEST) {
    xmlhttp.send(null)
  } else {
    xmlhttp.send()
  }

}

function _onXmlHttpProgress (evt) {
  this.loadingSignal.dispatch(evt.loaded / evt.total)
}

function _onXmlHttpChange () {
  if (this.xmlttp.readyState === 4) {
    if (this.xmlttp.status === 200) {
      this._onLoad(this.xmlttp)
    }
  }
}

function _onLoad () {
  if (!this.content) {
    this.content = this.xmlhttp.response
  }
  this.xmlhttp = undef
  _super._onLoad.call(this)
}