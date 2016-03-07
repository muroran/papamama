var gulp = require('gulp');
var browserSync = require("browser-sync");
var shapefile = require('shapefile');
var fs = require('fs');

// ローカルサーバ起動
gulp.task("serve", () => {
  browserSync({
    server: {
      baseDir: "."
    }
  });

  // 監視対象ファイル一覧
  gulp.watch(["css/**", "data/**", "image/**", "js/**", "index.html"], () => {
    browserSync.reload();
  });
});

gulp.task("updatedata", () => {

});

// 行政区域のデータ更新
gulp.task("data-wards", (cb) => {
  shapefile.read('data_org/N03-15_12_150101.shp', {encoding: 'shift_jis'}, (err, json) => {
    if(err) {
      console.log(err);
    } else {
      json.features = json.features.filter((feature) => {
        var cityCode = feature.properties.N03_007;
        return cityCode && cityCode.indexOf('121') === 0;
      });
      fs.writeFileSync( 'data/wards.geojson', JSON.stringify(json) );
    }
    cb();
  });
});
