// __mocks__/fs.js
'use strict';

const path = require('path');

const fs = jest.genMockFromModule('fs');

const __mockDirStatsFn = () => {
    const result = new fs.Stats();
    result.dev = 16777227;
    result.mode = 16877;
    result.nlink = 7;
    result.uid = 501;
    result.gid = 20;
    result.rdev = 0;
    result.blksize = 4096;
    result.ino = 93692;
    result.size = 646;
    result.blocks = 0;
    result.atimeMs = 1530429887000;
    result.mtimeMs = 1530426402000;
    result.ctimeMs = 1530426402000;
    result.birthtimeMs = 1530085031000;
    result.atime = new Date(1530429887000);
    result.mtime = new Date(1530426402000);
    result.ctime = new Date(1530426402000);
    result.birthtime = new Date(1530085031000);
    result.isFile = () => { return false; };
    result.isDirectory = () => { return true; };
    return result;
};

const __mockFileStatsFn = () => {
    const result = new fs.Stats();
    result.dev = 16777220;
    result.mode = 33133;
    result.nlink = 1;
    result.uid = 501;
    result.gid = 80;
    result.rdev = 0;
    result.blksize = 4096;
    result.ino = 9507556;
    result.size = 30287780;
    result.blocks = 59160;
    result.atimeMs = 1530429891000;
    result.mtimeMs = 1529712595000;
    result.ctimeMs = 1529712596000;
    result.birthtimeMs = 1529516570000;
    result.atime = new Date(1530429891000);
    result.mtime = new Date(1529712595000);
    result.ctime = new Date(1529712596000);
    result.birthtime = new Date(1529516570000);
    result.isFile = () => { return true; };
    result.isDirectory = () => { return false; };
    return result;
};

const __mockMissingErrorFn = (pathname) => {
    const result = new Error("ENOENT: no such file or directory, stat '" + pathname + "'");
    result.errno = -2;
    result.syscall = "stat";
    result.code = "ENOENT";
    result.path = pathname;
    return result;
};

let mockFiles = Object.create(null);

fs.__setMockFiles = (newMockFiles) => {
    mockFiles = Object.create(null);
    newMockFiles.forEach(file => {
        const isDir = file.endsWith('/');
        const dir = isDir ?
            file.substring(0, file.length - 1) :
                path.dirname(file);
        if (!mockFiles[dir]) {
            mockFiles[dir] = [];
        }
        if (!isDir) {
            mockFiles[dir].push(path.basename(file));
        }
    });
};

function mockFileExists(pathname) {
    const dir = path.dirname(pathname);

    if (mockFiles[dir]) {
        if (pathname.endsWith('/') || mockFiles[pathname]) {
            return true;
        }
        const basename = path.basename(pathname);
        return (mockFiles[dir].indexOf(basename) >= 0);
    }
    return false;
}

// A custom version of `stat` that reads from the special mocked out
// file list set via __setMockFiles
fs.stat = (pathname, options, callback) => {
    const callbackFn = (callback === undefined) ? options : callback;
    const opts = (callback === undefined) ? {} : options;

    //console.dir(mockFiles);
    if (mockFileExists(pathname)) {
        if (mockFiles[pathname]) {
            callbackFn(null, __mockDirStatsFn());
        } else {
            callbackFn(null, __mockFileStatsFn());
        }
    } else {
        callbackFn(__mockMissingErrorFn(pathname), null);
    }
}

module.exports = fs;