var ShortSignal = require('short-signal');

var undef;

function Energize() {
    this.isLoading = false;
    this.totalWeight = 0;
    this.loadedWeight = 0;
    this.itemUrls = {};
    this.itemList = [];
    this.loadingSignal = new ShortSignal();
}

var _p = Energize.prototype;
_p.addChunk = addChunk;
_p.add = add;
_p.load = load;
_p.start = start;
_p._onLoading = _onLoading;

var energize = module.exports = create();
energize.register = register;
energize.retrieveAll = retrieveAll;
energize.retrieve = retrieve;
energize.testExtensions = testExtensions;
energize.create = create;
energize.load = load;
energize.check = check;


var addedItems = energize.addedItems = {};
var loadedItems = energize.loadedItems = {};

var ITEM_CLASS_LIST = energize.ITEM_CLASS_LIST = [];
var ITEM_CLASSES = energize.ITEM_CLASSES = {};

function addChunk(target, type) {
    var i, j, len, itemsLength, retrievedTypeObj;
    var retrievedTypeObjList = retrieveAll(target, type);
    for (i = 0, len = retrievedTypeObjList.length; i < len; i++) {
        retrievedTypeObj = retrievedTypeObjList[i];
        for (j = 0, itemsLength = retrievedTypeObj.items.length; j < itemsLength; j++) {
            this.add(retrievedTypeObj.items[j], {type: retrievedTypeObj.type});
        }
    }
    return retrievedTypeObjList;
}

function add(url, cfg) {
    var item = addedItems[url];
    if (!item) {
        item = _createItem(url, (cfg && cfg.type) ? cfg.type : retrieve(url).type, cfg);
    }

    if (cfg && cfg.onLoad) item.onLoaded.addOnce(cfg.onLoad);

    if (!this.itemsUrls[url]) {
        this.itemUrls[url] = item;
        this.itemList.push(item);
        this.totalWeight += item.weight;
    }

    return item;
}

function load(url, cfg) {

    var item = addedItems[url];
    if (!item) {
        item = _createItem(url, (cfg && cfg.type) ? cfg.type : retrieve(url).type, cfg);
    }

    if (cfg && cfg.onLoad) item.onLoaded.addOnce(cfg.onLoad);

    if (loadedItems[url]) {
        item.dispatch();
    } else {
        if (!item.isStartLoaded) {
            item.load();
        }
    }

    return item;
}

function start(onLoading) {
    if (onLoading) this.loadingSignal.add(onLoading);
    this.isLoading = true;
    var len = this.itemList.length;
    if (len) {
        var itemList = this.itemList.splice(0, this.itemList.length);
        var item;
        for (var i = 0; i < len; i++) {
            item = itemList[i];
            item.onLoaded.addOnce(_onItemLoad, this, -1024, item, itemList);
            if (item.hasLoading) {
                item.loadingSignal.add(_onLoading, this, -1024, item, itemList, undef);
            }

            if (loadedItems[item.url]) {
                item.dispatch(_onItemLoad);
            } else {
                if (!item.isStartLoaded) {
                    item.load();
                }
            }
        }
    } else {
        _onItemLoad.call(this, undef, this.itemList);
    }
}

function _onLoading(item, itemList, loadingSignal, itemPercent, percent) {

    // leave the onLoading triggered by the _onItemLoad() to prevent stack call.
    if (item && !item.isLoaded && (itemPercent === 1)) return;
    if (percent === undef) {
        this.loadedWeight = _getLoadedWeight(itemList);
        percent = this.loadWeight / this.totalWeight;
    }

    loadingSignal = loadingSignal || this.loadingSignal;
    loadingSignal.dispatch(percent, item);
}

function _getLoadedWeight(itemList) {
    var loadedWeight = 0;
    for (var i = 0, len = itemList.length; i < len; i++) {
        loadedWeight += itemList[i].loadedWeight;
    }
    return loadedWeight;
}

function _onItemLoad(item, itemList) {

    this.loadedWeight = _getLoadedWeight(itemList);

    var loadingSignal = this.loadingSignal;
    if (this.loadedWeight === this.totalWeight) {
        this.isLoading = false;
        this.loadedWeight = 0;
        this.totalWeight = 0;
        this.loadingSignal = new ShortSignal();
        this._onLoading(item, itemList, loadingSignal, 1, 1);
    } else {
        this._onLoading(item, itemList, loadingSignal, 1, this.loadedWeight / this.totalWeight);
    }
}

function _createItem(url, type, cfg) {
    return new ITEM_CLASSES[type](url, cfg);
}

function register(ItemClass) {
    if (!ITEM_CLASSES[ItemClass.type]) {
        ITEM_CLASS_LIST.push(ItemClass);
        ITEM_CLASSES[ItemClass.type] = ItemClass;
    }
}

function retrieveAll(target, type) {
    var i, retrievedTypeObj;
    var len = target.length;
    var retrievedTypeObjList = [];
    if (len && (typeof target !== 'string')) {
        for (i = 0; i < len; i++) {
            retrievedTypeObj = retrieve(target[i], type);
            if (retrievedTypeObj) {
                retrievedTypeObjList = retrievedTypeObjList.concat(retrievedTypeObj);
            }
        }
    } else {
        retrievedTypeObj = retrieve(target, type);
        if (retrievedTypeObj) {
            retrievedTypeObjList = retrievedTypeObjList.concat(retrievedTypeObj);
        }
    }
    return retrievedTypeObjList;
}

function retrieve(target, type) {
    var i, len, items, ItemClass, guessedType;
    if (type) {
        ItemClass = ITEM_CLASSES[type];
        items = ItemClass.retrieve(target);
    } else {
        for (i = 0, len = ITEM_CLASS_LIST.length; i < len; i++) {
            ItemClass = ITEM_CLASS_LIST[i];
            guessedType = ItemClass.type;

            if (typeof target === 'string') {
                if (testExtensions(target, ItemClass)) {
                    items = [target];
                    break;
                }
            } else {
                items = ItemClass.retrieve(target);
                if (items && items.length && (typeof items[0] === 'string') && testExtensions(items[0], ItemClass)) {
                    break;
                }
            }
            items = undef;
            guessedType = undef;
        }
    }
    if (items) {
        return {
            type: type || guessedType,
            items: items
        };
    }
    return;
}

function testExtensions(url, ItemClass) {
    if (!url) return;
    var extensions = ItemClass.extensions;
    var i = extensions.length;
    var len = url.length;
    while (i--) {
        if (url.lastIndexOf('.' + extensions[i]) === len - extensions[i].length - 1) {
            return true;
        }
    }
    return false;
}

function create() {
    return new Energize();
}

function check() {
    var addedUrl = [];
    var notLoadedUrl = [];
    for (var url in addedItems) {
        addedUrl.push(url);
        if (!loadedItems[url]) {
            notLoadedUrl.push(addedItems[url]);
        }
    }
    console.log({
        added: addedUrl,
        notLoaded: notLoadedUrl
    });
}