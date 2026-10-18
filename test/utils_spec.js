var should = require('should');
var sinon = require('sinon');
var { cap, deCap, commandOptions, attributeOptions, resolveTyped } = require('../utils');

describe('utils.js', function () {

    describe('cap()', function () {
        it('should capitalize the first character', function () {
            cap('hello').should.equal('Hello');
        });
        it('should leave an already-capitalized string unchanged', function () {
            cap('Hello').should.equal('Hello');
        });
        it('should handle single character', function () {
            cap('a').should.equal('A');
        });
    });

    describe('deCap()', function () {
        it('should lowercase the first character', function () {
            deCap('Hello').should.equal('hello');
        });
        it('should leave an already-lowercased string unchanged', function () {
            deCap('hello').should.equal('hello');
        });
        it('should handle single character', function () {
            deCap('A').should.equal('a');
        });
    });

    describe('commandOptions()', function () {
        it('should return parameter schema for OnOff.toggle (no params)', function () {
            var opts = commandOptions('6', 'toggle');
            opts.should.be.an.Object();
            // toggle has no parameters, so the result should be empty
            Object.keys(opts).length.should.equal(0);
        });

        it('should return parameters for LevelControl.moveToLevel', function () {
            var opts = commandOptions('8', 'moveToLevel');
            opts.should.be.an.Object();
            // MoveToLevel has 4 parameters (Level, TransitionTime, etc.)
            // Note: values may be undefined when the model has no default
            Object.keys(opts).length.should.be.above(0);
        });

        it('should return empty object for unknown command', function () {
            var opts = commandOptions('6', 'nonExistentCommand');
            opts.should.be.an.Object();
            Object.keys(opts).length.should.equal(0);
        });
    });

    describe('attributeOptions()', function () {
        it('should return info for OnOff.onOff attribute', function () {
            var opts = attributeOptions('6', 'onOff');
            opts.should.be.an.Object();
            opts.should.have.property('name', 'OnOff');
            opts.should.have.property('type');
        });

        it('should return empty object for unknown attribute', function () {
            var opts = attributeOptions('6', 'nonExistentAttr');
            opts.should.be.an.Object();
            Object.keys(opts).length.should.equal(0);
        });
    });

    describe('resolveTyped()', function () {
        var mockRED;

        beforeEach(function () {
            mockRED = {
                util: {
                    evaluateNodeProperty: sinon.stub()
                }
            };
        });

        it('should resolve null for dataType "null"', function () {
            return resolveTyped(mockRED, 'anything', 'null', {}, {})
                .then(function (result) {
                    should(result).be.null();
                });
        });

        it('should resolve evaluated value for other types', function () {
            mockRED.util.evaluateNodeProperty.callsFake(function (data, type, node, msg, cb) {
                cb(null, 'resolved-value');
            });
            return resolveTyped(mockRED, 'test', 'str', {}, {})
                .then(function (result) {
                    result.should.equal('resolved-value');
                });
        });

        it('should reject when evaluation fails', function () {
            mockRED.util.evaluateNodeProperty.callsFake(function (data, type, node, msg, cb) {
                cb(new Error('eval failed'));
            });
            return resolveTyped(mockRED, 'test', 'str', {}, {})
                .should.be.rejectedWith('eval failed');
        });
    });
});
