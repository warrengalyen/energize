var TextItem = require('./TextItem')
var energize = require('../energize')

function JSONItem (url) {
  if (!url) return
  _super.constructor.apply(this, arguments)
}

module.exports = JSONItem
JSONItem.type = 'json'
JSONItem.extensions = ['json']
energize.register(JSONItem)

JSONItem.retrieve = function () {
  return false
}

var _super = TextItem.prototype
var _p = JSONItem.prototype = new TextItem()
_p.constructor = JSONItem
_p.onLoad = _onLoad

function _onLoad () {
  if (this.content) {
    this.content = window.JSON && window.JSON.parse ? JSON.parse(this.content.toString()) : eval(this.content.toString())
  }
  _super._onLoad.call(this)
}