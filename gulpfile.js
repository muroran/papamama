var gulp = require('gulp');
var browserSync = require("browser-sync");

// ローカルサーバ起動
gulp.task("serve", function () {
    browserSync({
        server: {
            baseDir: "."
        }
    });

    // 監視対象ファイル一覧
    gulp.watch(["css/**", "data/**", "image/**", "js/**", "index.html"], function() {
        browserSync.reload();
    });
});
