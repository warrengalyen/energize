var AbstractItem = require('./AbstractItem');
var energize = require('../energize');

var undef;

var IS_SUPPORT_XML_HTTP_REQUEST = !!window.XMLHttpRequest;

function TextItem(url) {
    if (!url) return;
    _super.constructor.apply(this, arguments);
}

module.exports = TextItem;
TextItem.type = 'text';
TextItem.extensions = ['html', 'txt', 'svg'];
energize.register(TextItem);

TextItem.retrieve = function() {
    return false;
};

var _super = AbstractItem.prototype;
var _p = TextItem.prototype = new AbstractItem();
_p.constructor = TextItem;
_p.load = load;
_p._onXmlHttpChange = _onXmlHttpChange;
_p._onXmlHttpProgress = _onXmlHttpProgress;
_p._onLoad = _onLoad;

function load() {
    _super.load.apply(this, arguments);
    var self = this;
    var xmlhttp;

    if (IS_SUPPORT_XML_HTTP_REQUEST) {
        xmlhttp = this.xmlttp = new XMLHttpRequest();
    } else {
        xmlhttp = this.xmlttp = new ActiveXObject('Microsoft.XMLHTTP');
    }
    if (this.hasLoading) {
        xmlhttp.onprogress = function(evt) { self._onXmlHttpProgress(evt); };
    }
    xmlhttp.onreadystatechange = function() { self._onXmlHttpChange(); };
    xmlhttp.open('GET', this.url, true);

    if (IS_SUPPORT_XML_HTTP_REQUEST) {
        xmlhttp.send(null);
    } else {
        xmlhttp.send();
    }
}

function _onXmlHttpProgress(evt) {
    this.loadingSignal.dispatch(evt.loaded / evt.total);
}

function _onXmlHttpChange() {
    if (this.xmlhttp.readyState === 4) {
        if (this.xmlttp.status === 200) {
            this.content = this.xmlttp.responseText;
            this._onLoad();
        }
    }
}

function _onLoad() {
    if (this.content) {
        this.xmlhttp = undef;
    }
    _super._onLoad.call(this);
}