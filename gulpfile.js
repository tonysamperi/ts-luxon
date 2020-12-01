"use strict";

function logStart(msg) {
    console.info("***** Task '" + msg + "' started *****");
}

function logEnd(msg) {
    console.info("***** Task '" + msg + "' finished *****");
}

const gulp = require("gulp"),
    path = require("path")
;

const libName = "app";
const rootFolder = path.join(__dirname);
const distFolder = path.join(rootFolder, `dist/${libName}`);

const taskNames = {
    postBuild: "postBuild",
    copyFiles: "copyFiles"
};

gulp.task(taskNames.copyFiles, (cb) => {
    logStart(taskNames.copyFiles);
    gulp.src([
        path.join(rootFolder, "lib/**"),
        path.join(rootFolder, "lib")
    ])
    .pipe(gulp.dest(distFolder));
    logEnd(taskNames.copyFiles);
    cb();
});

// MAIN
gulp.task(taskNames.postBuild, gulp.series(taskNames.copyFiles, function (cb, err) {
    logEnd(taskNames.postBuild);
    cb(err);
}));
