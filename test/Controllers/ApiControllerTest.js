"use strict";

var ApiController = require('../../src/Controllers/ApiController'),

    TestingUtil = require('../../src/Testing/Util'),

    fs = require('fs'),
    path = require('path'),
    sinon = require('sinon'),

    testUtil,
    testConfig,
    mockApp;

testConfig = {
    appLogs: {
        dir: path.resolve(__dirname, '../../tmp/logs'),
        daily: false
    }
};

mockApp = {
    NexusServer: {
        config: testConfig
    }
}

describe('ApiController', function () {
    before(function (done) {
        testUtil = new TestingUtil();

        // Setup database
        testUtil.setupDb()
            .then(function () {
                done();
            });
    });

    it('should be a constructor function', function () {
        var instance = new ApiController(mockApp);

        instance.should.be.instanceOf(ApiController);
    });

    describe('#getIndex', function () {
        it('should return a successful response', function () {
            var instance = new ApiController(mockApp),
                resMock;

            resMock = {
                send: sinon.spy(),
                set: sinon.spy()
            };

            instance.getIndex({}, resMock, {});

            resMock.send.calledOnce.should.be.true;

            JSON.parse(resMock.send.args[0][0]).status.should.be.equal('success');
        });
    });

    describe('#postLogs', function () {
        var instance = new ApiController(mockApp),
            reqMock,
            resMock;

        before(function () {
            resMock = {
                send: sinon.spy(),
                set: sinon.spy(),
                status: function () {
                    return resMock;
                }
            };

            reqMock = {
                body: {
                    filename: 'testapp.log',
                    instanceName: 'testing-abcdef123',
                    applicationId: testUtil.getTestingAppId(),
                    lines: [
                        'my log line 1',
                        'my log line 2'
                    ]
                }
            };

            reqMock.get = sinon.stub();
            reqMock.get.withArgs('Authorization').returns('Bearer ' + testUtil.getTestingToken());
        });

        it('should return a successful response', function (done) {
            resMock.send = function (content) {
                if (content.status) {
                    content.status.should.be.equal('success');
                }

                done();
            };

            instance.postLogs(reqMock, resMock, {});
        });

        it('should return write to logs file', function (done) {
            resMock.send = function (content) {
                fs.existsSync(path.resolve(testConfig.appLogs.dir, 'app' + testUtil.getTestingAppId())).should.be.true;

                done();
            };

            instance.postLogs(reqMock, resMock, {});
        });
    });
});


