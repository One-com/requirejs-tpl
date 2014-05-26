var unexpected = require('unexpected'),
    _ = require('underscore'),
    jsdom = require('jsdom'),
    sinon = require('sinon'),
    fs = require('fs'),
    Path = require('path'),
    vm = require('vm'),
    tplPath = Path.resolve(__dirname, '..', 'lib', 'tpl.js'),
    tplText = fs.readFileSync(tplPath, 'utf-8');

describe('tpl', function () {
    var expect = unexpected.clone()
        .installPlugin(require('unexpected-sinon'))
        .installPlugin(require('unexpected-jsdom'))
        .addAssertion('to be loaded as a template', function (expect, subject, value) {
            if (typeof subject === 'string') {
                subject = {name: subject};
            }
            var context = vm.createContext(),
                document = subject.document || '<html><head></head><body></body></html>';
            if (typeof document === 'string') {
                document = jsdom.jsdom(document);
            }
            context.window = context;
            context.document = document;
            context.console = console;
            _.extend(context, subject.context);
            context.define = sinon.spy(function (obj) {
                expect(obj.load, 'to be a function');
                var req = sinon.spy(function (deps, cb) {
                    expect(deps, 'to equal', ['text!' + subject.name]);
                    expect(cb, 'to be a function');
                    var htmlString = fs.readFileSync(Path.resolve(__dirname, '..', 'testdata', subject.name), 'utf-8');
                    cb(htmlString);
                });

                var req,
                    load = sinon.spy();
                obj.load(subject.name, req, load);
                expect(req, 'was called once');
                expect(load, 'was called once');
            });
            new vm.Script(tplText, tplPath).runInContext(context);
            expect(context.define, 'was called once');
            expect(document, 'to equal', typeof value === 'string' ? jsdom.jsdom(value) : value);
        });

    it('should load a template', function () {
        expect('pureText.html', 'to be loaded as a template', '<html><head></head><body><script type="text/html" id="pureText">Pure text</script></body></html>');
    });

    it('should not overwrite an existing template of with the same id', function () {
        expect(function () {
            expect({
                document: '<html><head></head><body><script type="text/html" id="pureText">Existing pure text</script></body></html>',
                name: 'pureText.html'
            }, 'to be loaded as a template');
        }, 'to throw exception', 'tpl plugin for require.js: More than one of the loaded templates have the file name pureText.html, skipped pureText.html. Please disambiguate by changing at least one of the file names.');
    });

    it('should invoke TRHTML on the template if available', function () {
        var context = {
            TRHTML: sinon.spy(function (element) {
                return 'Ren tekst';
            })
        };
        expect({
            context: context,
            name: 'pureText.html'
        }, 'to be loaded as a template', '<html><head></head><body><script type="text/html" id="pureText">Ren tekst</script></body></html>');

        expect(context.TRHTML, 'was called once');
    });

    it('should invoke TRHTML on the template if available and DEFAULTLOCALEID !== LOCALEID', function () {
        var context = {
            DEFAULTLOCALEID: 'en_us',
            LOCALEID: 'da',
            TRHTML: sinon.spy(function (element) {
                return 'Ren tekst';
            })
        };
        expect({
            context: context,
            name: 'pureText.html'
        }, 'to be loaded as a template', '<html><head></head><body><script type="text/html" id="pureText">Ren tekst</script></body></html>');

        expect(context.TRHTML, 'was called once');
    });

    it('should not TRHTML on the template body if TRANSLATE is false', function () {
        var context = {
            TRANSLATE: false,
            TRHTML: sinon.spy(function (element) {
                return 'Ren tekst';
            })
        };
        expect({
            context: context,
            name: 'pureText.html'
        }, 'to be loaded as a template', '<html><head></head><body><script type="text/html" id="pureText">Pure text</script></body></html>');

        expect(context.TRHTML, 'was not called');
    });

    it('should not TRHTML on the template body if LOCALEID is equal to DEFAULTLOCALEID', function () {
        var context = {
            DEFAULTLOCALEID: 'en_us',
            LOCALEID: 'en_us',
            TRHTML: sinon.spy(function (element) {
                return 'Ren tekst';
            })
        };
        expect({
            context: context,
            name: 'pureText.html'
        }, 'to be loaded as a template', '<html><head></head><body><script type="text/html" id="pureText">Pure text</script></body></html>');

        expect(context.TRHTML, 'was not called');
    });
});
