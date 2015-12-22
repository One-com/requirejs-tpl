Template plugin for RequireJs
-----------------------------

[![NPM version](https://badge.fury.io/js/requirejs-tpl.svg)](http://badge.fury.io/js/requirejs-tpl)
[![Build Status](https://travis-ci.org/One-com/requirejs-tpl.svg?branch=master)](https://travis-ci.org/One-com/requirejs-tpl)
[![Coverage Status](https://img.shields.io/coveralls/One-com/requirejs-tpl.svg)](https://coveralls.io/r/One-com/requirejs-tpl?branch=master)
[![Dependency Status](https://david-dm.org/One-com/requirejs-tpl.svg)](https://david-dm.org/One-com/requirejs-tpl)

Notice! this plugin requires the standard [text plugin](https://github.com/requirejs/text).

This plugin will allow you to require templates, as employed in KnockoutJS, via the ordinary dependency syntax.

Example:

    define([
        'tpl!templates/thing.ko'
    ], function () {
        [... code ...]
    });

The above will fetch the `thing.ko` file, and insert it into the DOM in a script tag with the id `thing`.
