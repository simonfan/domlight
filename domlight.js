/*! domlight - v.0.1.1 - MIT License - https://github.com/h2non/domlight */
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['exports'], factory)
  } else if (typeof exports === 'object') {
    factory(exports)
    if (typeof module === 'object' && module !== null) {
      module.exports = exports = exports.Domlight
    }
  } else {
    factory(root)
  }
}(this, function (exports) {
  'use strict'

  var VERSION = '0.1.1'
  var NODE_ID = 'focusable-overlay'

  var slice = Array.prototype.slice
  var hasOwn = Object.prototype.hasOwnProperty

  var defaults = {
    fadeDuration: 700,
    hideOnClick: false,
    hideOnESC: true,
    findOnResize: true,
    context: null
  }

  var elements = []
  var columnWrapper = null
  var overlay = null
  var isSetup = false
  var isVisible = false
  var body = document
  var columnSelector = '#' + NODE_ID + ' .column'

  function Domlight(element, options) {
    options = merge(merge({}, defaults), options);

    if (element && element.length) {

      if (options.context) {
        var contextElement = document.querySelector(options.context);
        var contextHasElement = false;
        for(var i = 0; i < element.length; i++) {
          if (childOf(element[i], contextElement)) {
            element = element[i];
            contextHasElement = true;
          }
        }
        if (!contextHasElement) {
          throw new TypeError('Element is not contained in the provided context.');
        }
      } else {
        element = element[0];
      }

    } else if (!(element instanceof HTMLElement)) {
      throw new TypeError('First argument should be a Node or jQuery/Zepto selector');
    }


    spotlightElement(element, options);

    return {
      element: element,
      options: options,
      isVisible: getVisibility,
      hide: function () {
        hide(element);
      }
    };
  }

  function childOf(c, p) {
    while((c=c.parentNode)&&c!==p);
    return !!c;
  }

  function getVisibility() {
    return isVisible;
  }

  function setup(options) {
    var newDiv = document.createElement('div');
    newDiv.id = NODE_ID;
    var container = document.body;

    if (options.context) {
      container = document.querySelector(options.context);
    }

    container.insertBefore(newDiv, container.firstChild);
    overlay = newDiv;
    isSetup = true;

    addEvents(options);
    addStylesheet(options);
  }

  function addEvents(options) {
    if (options.hideOnESC) {
      window.addEventListener('keyup', keyupHandler);
    }
    if (options.hideOnClick) {
      overlay.addEventListener('click', hideAll);
    }
  }

  function keyupHandler(event) {
    if (event.keyCode === 27 && isVisible) {
      hideAll();
      window.removeEventListener('keyup', keyupHandler);
    }
  }

  function onBodyReady(fn, args) {
    document.onreadystatechange = function () {
      if (document.readyState === 'complete') {
        body = document.body;
        fn.apply(null, args);
      }
    }
  }

  function spotlightElement(element, options) {
    if (document.readyState !== 'complete') {
      return onBodyReady(spotlightElement, arguments);
    } else if (body == null) {
      body = document.body;
    }

    if (isSetup === false) { setup(options); }

    setFocus(element, options);
  }

  function setFocus(element, options) {
    var styleEl = window.getComputedStyle(element)
    var position = styleEl.getPropertyValue('position')
    var zIndex = styleEl.getPropertyValue('z-index')

    elements.push({
      zIndex: zIndex,
      position: position,
      element: element
    });

    if (options.context) {
      document.querySelector(options.context).style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'hidden';
    }
    if (position === 'static') {
      element.style.position = 'relative';
    }
    if ((+zIndex || 1) < 10000) {
      element.style.zIndex = 10000;
    }

    if (isVisible === false) {
      createColumns(element, options.context);
    }
    overlay.style.display = 'block';

    // the transition won't happen at the same time as display: block; create a short delay
    setTimeout(function() {
      overlay.style.opacity = '1';
    }, 50);
  }

  function hide(element) {
    var index = findElement(element);

    if (index) {
      restoreElementStyle(elements[index]);
      elements.splice(index, 1);
    }

    if (elements.length) {
      clearColumns();
      createColumns(elements[0].element);
      if (document.querySelector('#' + NODE_ID) && document.querySelector('#' + NODE_ID).parentNode) {
        document.querySelector('#' + NODE_ID).parentNode.removeChild(document.querySelector('#' + NODE_ID));
        isSetup = false;
      }
    } else {
      hideAll();
    }
  }

  function findElement(element) {
    var index = -1;
    for (var i = 0, l = elements.length; i < l; i += 1) {
      if (elements[i].element === element) {
        index = i;
        break;
      }
    }
    return index;
  }

  function hideAll() {
    isVisible = false;
    document.body.style.overflow = '';
    if (overlay) {
      overlay.style.display = 'none';
    }
    clearColumns();
    elements.splice(0).forEach(restoreElementStyle);
    if (document.querySelector('#' + NODE_ID) && document.querySelector('#' + NODE_ID).parentNode) {
      document.querySelector('#' + NODE_ID).parentNode.removeChild(document.querySelector('#' + NODE_ID));
      isSetup = false;
    }
  }

  function restoreElementStyle(node) {
    node.element.style.zIndex = node.zIndex;
    node.element.style.position = node.position;
  }

  function createColumns(element, context) {
    var createdColumns = 0;
    isVisible = true;
    clearColumns();

    while (createdColumns < 4) {
      createColumn(element, createdColumns, context);
      createdColumns += 1;
    }
  }

  function createColumn(element, index, context) {
    var top = 0,
        left = 0,
        width = px(element.clientWidth),
        parentTop = 0,
        parentLeft = 0,
        height = '100%';
    var offset = element.getBoundingClientRect();
    if (context) {
      var contextOffset = document.querySelector(context).getBoundingClientRect();
      parentTop = contextOffset.top;
      parentLeft = contextOffset.left;
    }


    switch (index) {
      case 0:
        width = px(offset.left - parentLeft);
        break
      case 1:
        left = px(offset.left - parentLeft);
        height = px(offset.top - parentTop);
        break
      case 2:
        left = px(offset.left - parentLeft);
        top = px(element.clientHeight + offset.top - parentTop);
        break
      case 3:
        width = '100%'
        left = px(element.clientWidth + offset.left - parentLeft);
        break
    }

    var styles = 'top:' + top + ';left:' + left + ';width:' + width + ';height:' + height;
    var column = createColumnDivisor(styles);
    overlay.appendChild(column);
  }

  function createColumnDivisor(styles) {
    var column = document.createElement('div');
    column.className = 'column';
    column.setAttribute('style', styles);
    return column;
  }

  function clearColumns() {
    if (overlay) {
      var columns = overlay.querySelectorAll('#' + NODE_ID + ' .column');
      for (var i = 0, l = columns.length; i < l; i += 1) {
        columns[i].parentNode.removeChild(columns[i]);
      }
    }
  }

  function px(value) {
    return value + 'px';
  }

  function addStylesheet(options) {
    var sheet = appendStylesheet();

    sheet.insertRule('#' + NODE_ID
    + '{' +
      + 'display:none;'
      + 'opacity:0;'
      + 'transition: opacity ' + options.fadeDuration + 'ms;'
      + 'position: absolute;'
      + 'top: 0;'
      + 'left: 0;'
      + 'width: 100%;'
      + 'height: 100%;'
      + 'z-index: 9999;'
      + 'overflow: hidden;'
      + 'pointer-events: none;'
    + '}', 0);

    sheet.insertRule('#' + NODE_ID + ' .column'
    + '{'
      + 'position: absolute;'
      + 'background: rgba(0,0,0,0.8);'
      + 'pointer-events: all;'
    + '}', 1);
  }

  function appendStylesheet() {
    var style = document.createElement('style');
    style.appendChild(document.createTextNode(''));
    document.head.appendChild(style);
    return style.sheet;
  }

  function getActiveElements() {
    return elements.map(function (node) {
      return node.element;
    })
  }

  function merge(target, source) {
    for (var key in source) if (hasOwn.call(source, key)) {
      target[key] = source[key];
    }
    return target;
  }

  exports.Domlight = Domlight;
  Domlight.defaults = defaults;
  Domlight.hideAll = hideAll;
  Domlight.isVisible = getVisibility;
  Domlight.getActiveElements = getActiveElements;
  Domlight.VERSION = VERSION;

}));
