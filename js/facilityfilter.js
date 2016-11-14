window.FacilityFilter = function () {
};

/**
 * 指定したフィルター条件に一致する施設情報のGeoJsonを生成する
 *
 * @param  {[type]} conditions        [description]
 * @param  {[type]} nurseryFacilities [description]
 * @return {[type]}                   [description]
 */
FacilityFilter.prototype.getFilteredFeaturesGeoJson = function (conditions, nurseryFacilities)
{
    // 絞り込んだ条件に一致する施設を格納するgeoJsonを準備
    var newGeoJson = {
        "type": "FeatureCollection",
        "crs": { "type": "name", "properties": { "name": "urn:ogc:def:crs:OGC:1.3:CRS84" } },
        "features":[]
    };
    // console.log("getFilteredFeaturesGeoJson");

    // 保育園の検索元データを取得
    var hoikuenFeatures = [];
    _features = nurseryFacilities.features.filter(function (item,idx) {
            var type = item.properties['種別'] ? item.properties['種別'] : item.properties['Type'];
            if(type == "認可保育所" || type == "認可外") return true;
        });
    Array.prototype.push.apply(hoikuenFeatures, _features);

    // 幼稚園の検索元データを取得
    var youchienFeatures = [];
    _features = nurseryFacilities.features.filter(function (item,idx) {
            var type = item.properties['種別'] ? item.properties['種別'] : item.properties['Type'];
            if(type == "幼稚園") return true;
        });
    Array.prototype.push.apply(youchienFeatures, _features);

    // ----------------------------------------------------------------------
    // 保育園向けフィルター
    // ----------------------------------------------------------------------
    // 開園時間
    // console.log("[before]ninkaFeatures length:", ninkaFeatures.length);
    if(conditions['OpenTime']) {
        filterfunc = function (item, idx) {
            f = function (item,idx) {
                var _time = conditions['OpenTime'];
                var open = item.properties['開園時間'] ? item.properties['開園時間'] : item.properties['Open'];
                if(open <= _time) {
                    return true;
                }
            };
            return f(item,idx);
        };
        hoikuenFeatures = hoikuenFeatures.filter(filterfunc);
    }
    // 終園時間
    if(conditions['CloseTime']) {
        filterfunc = function (item, idx) {
            f = function (item,idx) {
                var _time = conditions['CloseTime'];
                var close = item.properties['終園時間'] ? item.properties['終園時間'] : item.properties['Close'];

                // 終園時間が0時or翌日の場合は、24時間プラス
                if(close == '0:00' || close.substr(0,1) == '翌') {
                    var index = close.indexOf('：');
                    var hour = Number(close.substr(1,index-1)) + 24;
                    var minute = close.substr(index+1);
                    close = hour + ':' + minute;
                }

                if(close >= _time) {
                    return true;
                }
            };
            return f(item,idx);
        };
        hoikuenFeatures = hoikuenFeatures.filter(filterfunc);
    }
    // 一時保育
    if(conditions['IchijiHoiku']) {
        filterfunc = function (item,idx) {
            var temp = item.properties['一時'] ? item.properties['一時'] : item.properties['Temp'];
            if(temp === 'Y') {
                return true;
            }
        };
        hoikuenFeatures = hoikuenFeatures.filter(filterfunc);
    }
    // 夜間
    if(conditions['Yakan']) {
        filterfunc = function (item,idx) {
            var night = item.properties['夜間'] ? item.properties['夜間'] : item.properties['Night'];
            if(night === 'Y') {
                return true;
            }
        };
        hoikuenFeatures = hoikuenFeatures.filter(filterfunc);
    }
    // 休日
    if(conditions['Kyujitu']) {
        filterfunc = function (item,idx) {
            var holiday = item.properties['休日'] ? item.properties['休日'] : item.properties['Holiday'];
            if(holiday === 'Y') {
                return true;
            }
        };
        hoikuenFeatures = hoikuenFeatures.filter(filterfunc);
    }
    // 空き状況
    if(conditions['Vacancy']) {
        filterfunc = function (item,idx) {
            var vacancy = item.properties['Vacancy'] ? item.properties['Vacancy'] : item.properties['Vacancy'];
            if(vacancy === 'Y') {
                return true;
            }
        };
        hoikuenFeatures = hoikuenFeatures.filter(filterfunc);
    }
    // console.log("[after]ninkaFeatures length:", ninkaFeatures.length);

    // 24時間
    if(conditions['24H']) {
        filterfunc = function (item,idx) {
            var h24 = item.properties['H24'] ? item.properties['H24'] : item.properties['H24'];
            if(h24 === 'Y') {
                return true;
            }
        };
        hoikuenFeatures = hoikuenFeatures.filter(filterfunc);
    }
    // 先取りプロジェクト認定あり
    if(conditions['Sakidori_auth']) {
        filterfunc = function (item,idx) {
            var proof = item.properties['Sakidori_auth'];
            if(proof === 'Y') {
                return true;
            }
        };
        hoikuenFeatures = hoikuenFeatures.filter(filterfunc);
    }
    // 保育ルーム認定あり
    if(conditions['Hoikuroom_auth']) {
        filterfunc = function (item,idx) {
            var proof = item.properties['Hoikuroom_auth'];
            if(proof === 'Y') {
                return true;
            }
        };
        hoikuenFeatures = hoikuenFeatures.filter(filterfunc);
    }
    // 事業所内保育所
    if(conditions['Shanai']) {
        filterfunc = function (item,idx) {
            var shanai = item.properties['Shanai'];
            if(shanai === 'Y') {
                return true;
            }
        };
        hoikuenFeatures = hoikuenFeatures.filter(filterfunc);
    }
    // こども園
    if(conditions['Kodomo']) {
        filterfunc = function (item,idx) {
            var kodomo = item.properties['Kodomo'];
            if(kodomo === 'Y') {
                return true;
            }
        };
        hoikuenFeatures = hoikuenFeatures.filter(filterfunc);
        youchienFeatures = youchienFeatures.filter(filterfunc);
    }
    // console.log("[after]ninkagaiFeatures length:", ninkagaiFeatures.length);

    // ----------------------------------------------------------------------
    // 幼稚園向けフィルター
    // ----------------------------------------------------------------------
    // まだ用意しない

    // 戻り値の作成
    var features = [];
    Array.prototype.push.apply(features, hoikuenFeatures);
    Array.prototype.push.apply(features, youchienFeatures);
    // console.log("getFilteredFeaturesGeoJson: return value: ", features.length);
    newGeoJson.features = features;
    return newGeoJson;
};

/**
 * お気に入りの園を返す
 */
FacilityFilter.prototype.getFavoriteFeatures = function (nurseryFacilities){
  var favoriteList = favoriteStore.getFavoriteList();
  if (nurseryFacilities.features) {
    return nurseryFacilities.features.filter(function (item,idx) {
      return favoriteList.indexOf(favoriteStore.getId(item)) >= 0;
    });
  } else {
    return [];
  }
}

/**
 * idに一致した園を返します。
 */
FacilityFilter.prototype.getFeatureById = function(id) {
  var favoriteList = favoriteStore.getFavoriteList();
  if (nurseryFacilities.features) {
    return nurseryFacilities.features.find(function (item,idx) {
      return favoriteStore.getId(item) === id;
    });
  } else {
    return null;
  }
}
