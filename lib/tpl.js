/*global document, LOCALEID, DEFAULTLOCALEID, TRHTML, TRANSLATE*/

function addTemplateToDocument(name, htmlString) {
    var fileName = name.split('/').pop(),
        templateId = fileName.replace(/\..*$/, ''), // Strip extension
        existingScriptElement = document.getElementById(templateId);

    if (existingScriptElement) {
        throw new Error("tpl plugin for require.js: More than one of the loaded templates have the file name " + fileName + ", skipped " + name + ". Please disambiguate by changing at least one of the file names.");
    } else {
        // Translate the template if AssetGraph-builder's bootstrapper script is present and we're not using the default language:
        if (typeof TRHTML === 'function' && (typeof DEFAULTLOCALEID === 'undefined' || LOCALEID !== DEFAULTLOCALEID) && (typeof TRANSLATE === 'undefined' || TRANSLATE !== false)) {
            htmlString = TRHTML(htmlString);
        }
        if (/<script/i.test(htmlString)) {
            var div = document.createElement('div');
            div.innerHTML = htmlString;
            var nestedScriptElements = div.getElementsByTagName('script');
            while (nestedScriptElements.length > 0) {
                var nestedScriptElement = nestedScriptElements[0];
                document.body.appendChild(nestedScriptElement);
            }
            htmlString = div.innerHTML;
        }
        if (!/^\s*$/.test(htmlString)) {
            var scriptElement = document.createElement('script');
            scriptElement.setAttribute('type', 'text/html');
            scriptElement.setAttribute('id', templateId);
            if ('textContent' in scriptElement) {
                scriptElement.textContent = htmlString;
            } else {
                // IE8 and below
                scriptElement.text = htmlString;
            }
            document.body.appendChild(scriptElement);
        }
    }
}


/* GLOBAL.document expected to be set on nodejs */
(function () {
    define({
        ontextload: function (name, htmlString, load, config) {
            if (config.isBuild) {
                load.fromText('define(function () {(' + addTemplateToDocument.toString() + '(' + JSON.stringify(name) + ', ' + JSON.stringify(htmlString) + '))});\n');
            } else {
                addTemplateToDocument(name, htmlString);
            }
            load(htmlString);
        },

        load: function (name, req, load, config) {
            if (typeof exports === 'object') {
                var fs = require('fs');
                this.ontextload(name, fs.readFileSync(req.toUrl(name), 'utf8'), load, config);
            } else {
                req(['text!' + name], function (htmlString) {
                    return this.ontextload(name, htmlString, load, config);
                }.bind(this));
            }
        }
    });
}());
