var unexpected = require('unexpected'),
    _ = require('underscore'),
    jsdom = require('jsdom'),
    sinon = require('sinon'),
    Path = require('path'),
    vm = require('vm'),
    tplPath = Path.resolve(__dirname, '..', 'lib', 'tpl.js'),
    tplText = require('fs').readFileSync(tplPath, 'utf-8');

describe('tpl', function () {
    var window,
        document,
        templateName;
    beforeEach(function () {
        document = jsdom.jsdom();
        window = {document: document};
        templateName = 'theTemplateName.html';
    });

    var expect = unexpected.clone()
        .use(require('unexpected-sinon'))
        .use(require('unexpected-dom'))
        .addAssertion('<string> to be loaded as a template <any?>', function (expect, subject, value) {
            var context = vm.createContext();
            context.window = context;
            context.console = console; // For debugging
            _.extend(context, window);
            context.define = sinon.spy(function (obj) {
                expect(obj.load, 'to be a function');
                var req = sinon.spy(function (deps, cb) {
                    expect(deps, 'to satisfy', ['text!' + templateName]);
                    expect(cb, 'to be a function');
                    var htmlString = subject;
                    cb(htmlString);
                }).named('req');

                var load = sinon.spy().named('load');
                obj.load(templateName, req, load);
                expect(req, 'was called once');
                expect(load, 'was called once');
            });
            new vm.Script(tplText, tplPath).runInContext(context);
            expect(context.define, 'was called once');
            if (typeof value !== 'undefined') {
                expect(document.documentElement, 'to exhaustively satisfy', typeof value === 'string' ? jsdom.jsdom(value).documentElement : value);
            }
        });

    it('should load a template', function () {
        expect('Pure text', 'to be loaded as a template', '<html><head></head><body><script type="text/html" id="theTemplateName">Pure text</script></body></html>');
    });

    it('should use the file name without any extension', function () {
        templateName = 'theTemplateName.touch.html';
        expect('Pure text', 'to be loaded as a template', '<html><head></head><body><script type="text/html" id="theTemplateName">Pure text</script></body></html>');
    });

    it('should not overwrite an existing template of with the same id', function () {
        expect(function () {
            document.body.innerHTML = '<script type="text/html" id="theTemplateName">Existing pure text</script>';
            expect('Pure text', 'to be loaded as a template');
        }, 'to throw exception', 'tpl plugin for require.js: More than one of the loaded templates have the file name theTemplateName.html, skipped theTemplateName.html. Please disambiguate by changing at least one of the file names.');
    });

    it('should invoke TRHTML on the template if available', function () {
        window.TRHTML = sinon.spy(function (element) {
            return 'Ren tekst';
        });
        expect('Pure text', 'to be loaded as a template', '<html><head></head><body><script type="text/html" id="theTemplateName">Ren tekst</script></body></html>');

        expect(window.TRHTML, 'was called once');
    });

    it('should invoke TRHTML on the template if available and DEFAULTLOCALEID !== LOCALEID', function () {
        window.DEFAULTLOCALEID = 'en_us';
        window.LOCALEID = 'da';
        window.TRHTML = sinon.spy(function (element) {
            return 'Ren tekst';
        });
        expect('Pure text', 'to be loaded as a template', '<html><head></head><body><script type="text/html" id="theTemplateName">Ren tekst</script></body></html>');

        expect(window.TRHTML, 'was called once');
    });

    it('should not TRHTML on the template body if TRANSLATE is false', function () {
        window.TRANSLATE = false;
        window.TRHTML = sinon.spy(function (element) {
            return 'Ren tekst';
        });
        expect('Pure text', 'to be loaded as a template', '<html><head></head><body><script type="text/html" id="theTemplateName">Pure text</script></body></html>');

        expect(window.TRHTML, 'was not called');
    });

    it('should not TRHTML on the template body if LOCALEID is equal to DEFAULTLOCALEID', function () {
        window.DEFAULTLOCALEID = 'en_us';
        window.LOCALEID = 'en_us';
        window.TRHTML = sinon.spy(function (element) {
            return 'Ren tekst';
        });
        expect('Pure text', 'to be loaded as a template', '<html><head></head><body><script type="text/html" id="theTemplateName">Pure text</script></body></html>');

        expect(window.TRHTML, 'was not called');
    });

    it('should hoist nested <script type=text/html> to the top level while preserving the attributes', function () {
        expect(
            '<script type="text/html" data-outer="id">' +
                '<div data-bind="class: cls"></div>' +
            '</script>' +
            '<script type="text/html" data-inner="id">' +
                '<span>Text</span>' +
            '</script>',
            'to be loaded as a template',
            '<html>' +
                '<head>' +
                '</head>' +
                '<body>' +
                '<script type="text/html" data-outer="id">' +
                    '<div data-bind="class: cls"></div>' +
                '</script>' +
                '<script type="text/html" data-inner="id">' +
                    '<span>Text</span>' +
                '</script>' +
                '</body>' +
            '</html>'
        );
    });

    it('should hoist nested templates', function () {
        expect(
            'Foo bar' +
            '<script type="text/html" id="subtemplate" foo="bar">Contents of subtemplate</script>',
            'to be loaded as a template',
            '<html>' +
                '<head></head>' +
                '<body>' +
                    '<script type="text/html" id="subtemplate" foo="bar">Contents of subtemplate</script>' +
                    '<script type="text/html" id="theTemplateName">Foo bar</script>' +
                '</body>' +
            '</html>'
        );
    });
});
