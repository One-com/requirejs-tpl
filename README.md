Template plugin for RequireJs
------

This plugin will allow you to require templates, as employed in KnockoutJS, via the ordinary dependency syntax.

Example:

    define([
        'tpl!templates/thing.ko'
    ], function () {
        [... code ...]
    });

The above will fetch the `thing.ko` file, and insert it into the DOM in a script tag with the id `thing`.