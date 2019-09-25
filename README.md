# energize
An assets loader that loads everything. Say you have some third party libraries with their own loader modules, you can pipe the loading progress into energize's loading pipeline. It also does basic loading for `image`, `json`, `jsonp`, `text`, `video` and `audio`.

## Usage


### Simple batch loading

Add several assets to the loader and get the percent of the batch loading.

```js
// assuming you are using CommonJS
var energize = require('energize');

// load the asset with a certain type
energize.add('1.jpg', {type: 'image'});

// or let it guess the type by the url extension
energize.add('2.jpg');

// you can also define the weight of the asset which is 1 by default
energize.add('3.jpg', {weight: 2});

energize.start(function(percent) {

    // assuming the files are loaded in the same order as above
    // it will be logged as 0.25, 0.5, 1.0
    console.log(percent);

    if (percent === 1) {
        init();

        // the listender was removed at this point and it
        // will not have any stacked async issues so you can
        // load something else again.
        energize.add(...);
        energize.start(...);
    }
});

```

### Individual asset callback
You can add an onLoad callback to an individual asset.
```js
energize.add('data.json', {
    onLoad: function(data) {
        console.log(data);
    }
});
energize.add('img.jpg');
energize.start(...);

```

### Load a single item out of the energize pipline
For all features that work with batch loading, it works with individual asset loading as well. Basically all you need is to change the `add()` into `load()`
```js
energize.load('data.json', {
    onLoad: function(data) {
        console.log(data);
    }
});

```

### Initial content
Sometimes when you add the loading query to the batch loader, you want to have access to the asset instance immediately. This feature only works with asset type: `image`, `video` and `audio`
```js
var img = energize.add('img.jpg').content;

energize.start(...);

```

### Working with third-party library loaders like THREE.js JSON Loader
```js
energize.load('mesh.json', {

    type: 'any',

    loadFunc: function(url, cb) {

        var loader = new THREE.JSONLoader();

        loader.load(url, function(geometry, material) {
            var mesh = new THREE.Mesh(geometry, material);

            // tell energize the item is loaded and store
            // the mesh instead as content
            cb(mesh);
        });
    }
});

```

### Individual asset preloading
You can also add a listener to the individual asset. This feature only works with asset types `json, `text` and `any`.
```js
energize.add('data.json', {
    type: 'json',
    weight: 5,
    hasLoading: true,
    onLoading: function(percent) {
        console.log(percent);
    }
});
```

### Individual asset preloading with third-party libraries
This following example is to show you when you are using `any` asset type, you can do whatever you want.
```js
energize.add('a_fake_loader', {
    type: 'any',
    weight: 50,
    hasLoading: true,
    onLoading: function(percent) {
        console.log('loading: ' + ~~(percent * 100) + '%');
    },
    onLoad: function(content) {
        // some content here
        console.log('loaded: ' + content);
    },
    loadFunc: function(url, cb, loadingSignal) {
        var count = 0;
        var interval = setInterval(function() {
            count++;
            loadingSignal.dispatch(count / 10);
            if (count == 10) {
                clearInterval(interval);
                cb('some content here');
            }
        }, 100);
    }
});
```

### add a chunk of asset
```js
energize.addChunk(['1.jpg', '2.jpg', '3.jpg'], 'image');

// let energize guess the types
energize.addChunk(['1.jpg', '2.jpg', '3.jpg']);
```

## Add DOM Images (experimental)
It adds all images through the image tag and background images.
```js
energize.addChunk(document.body.querySelectorAll('*'));
```

### Multi-batch Loader instances
For some reason if you want to have 2 loaders, you can create a new one like this:
```js
var energize = require('energize');

var batchLoader = energize.create();
batcherLoader.add(...);

```

## Installation


## Todo
- Write an example to show how to create your own custom types
- Cross domain support