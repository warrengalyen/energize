var ShortSignal = require('short-signal');
var energize = require('../energize');

var undef;

function AbstractItem(url, cfg) {
    if (!url) return;
    this.url = url;
    this.loadedWeight = 0;
    this.weight = 1;
    for (var id in cfg) {
        this[id] = cfg[id];
    }

    if (!this.type) {
        this.type = this.constructor.type;
    }

    if (this.hasLoading) {
        this.loadingSignal = new ShortSignal();
        this.loadingSignal.add(_onLoading, this);
        if (this.onLoading) {
            this.loadSignal.add(this.onLoading);
        }
    }

    var self = this;
    this.boundOnLoad = function() { self._onLoad(); };
    this.onLoaded = new ShortSignal();

    energize.addedItems[url] = this;

}

module.exports = AbstractItem;
var _p = AbstractItem.prototype;
_p.loaded = load;
_p._onLoad = _onLoad;
_p._onLoading = _onLoading;
_p.dispatch = dispatch;

AbstractItem.extensions = [];

AbstractItem.retrieve = function() {
    return false;
};


function load() {
    this.isStartLoaded = true;
}

function _onLoad() {

    this.isLoaded = true;
    this.loadedWeight = this.weight;
    energize.loadedItems[this.url] = this;
    this.onLoaded.dispatch(this.content);
}

function _onLoading(percent) {
    this.loadedWeight = this.weight * percent;
}

function dispatch() {
    if (this.hasLoading) {
        this.loadingSignal.remove();
    }
    this.onLoaded.dispatch(this.content);
}