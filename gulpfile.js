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
  gulp.watch(["css/**/*", "data/**/*", "image/**/*", "js/**/*", "index.html"], () => {
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

// 中学校区域のデータ更新
gulp.task("data-middleSchool", (cb) => {
  shapefile.read('data_org/A32-13_12.shp', {encoding: 'shift_jis'}, (err, json) => {
    if(err) {
      console.log(err);
    } else {
      json.features = json.features.filter((feature) => {
        var cityCode = feature.properties.A32_001;
        return cityCode && cityCode.indexOf('121') === 0;
      });
      fs.writeFileSync( 'data/MiddleSchool.geojson', JSON.stringify(json) );
    }
    cb();
  });
});

// 小学校区域のデータ更新
gulp.task("data-elementary", (cb) => {
  shapefile.read('data_org/A27-10_12-g_SchoolDistrict.shp', {encoding: 'shift_jis'}, (err, json) => {
    if(err) {
      console.log(err);
    } else {
      json.features = json.features.filter((feature) => {
        var cityCode = feature.properties.A27_005;
        return cityCode && cityCode.indexOf('121') === 0;
      });
      fs.writeFileSync( 'data/Elementary.geojson', JSON.stringify(json) );
    }
    cb();
  });
});

// 学校のデータ作成
gulp.task("data-school", (cb) => {
  shapefile.read('data_org/p29-13_12.shp', {encoding: 'shift_jis'}, (err, json) => {
    if(err) {
      console.log(err);
    } else {
      var features = json.features.filter((feature) => {
        var cityCode = feature.properties.P29_001;
        feature.properties.label = feature.properties.P29_005.replace(/学校$/, '');
        return cityCode && cityCode.indexOf('121') === 0;
      });
      // 小学校
      json.features = features.filter((feature) => {
        return feature.properties.P29_004 === '16001';
      });
      fs.writeFileSync( 'data/Elementary_loc.geojson', JSON.stringify(json) );
      // 中学校
      json.features = features.filter((feature) => {
        return feature.properties.P29_004 === '16002' || feature.properties.P29_004 === '16003';
      });
      fs.writeFileSync( 'data/MiddleSchool_loc.geojson', JSON.stringify(json) );
    }
    cb();
  });
});
