/**
 * コンストラクタ
 *
 * @param ol.Map map OpenLayers3 map object
 *
 */
window.Papamamap = function() {
    this.map = null;
    this.centerLatOffsetPixel = 75;
    this.viewCenter = [];
    this.featureOverlays = {};
};

/**
 * マップを作成して保持する
 *
 * @param  {[type]} mapServerListItem [description]
 * @return {[type]}                   [description]
 */
Papamamap.prototype.generate = function(mapServerListItem)
{
    this.map = new ol.Map({
        layers: [
            new ol.layer.Tile({
                opacity: 1.0,
                name: 'layerTile',
                source: mapServerListItem.source
            }),
            // 中学校区レイヤーグループ
            new ol.layer.Group({
                layers:[
                    // 中学校区ポリゴン
                    new ol.layer.Vector({
                        source: new ol.source.GeoJSON({
                            projection: 'EPSG:3857',
                            url: 'data/MiddleSchool.geojson'
                        }),
                        name: 'layerMiddleSchool',
                        style: middleSchoolStyleFunction,
                    }),
                    // 中学校区位置
                    new ol.layer.Vector({
                        source: new ol.source.GeoJSON({
                            projection: 'EPSG:3857',
                            url: 'data/MiddleSchool_loc.geojson'
                        }),
                        name: 'layerMiddleSchoolLoc',
                        style: middleSchoolStyleFunction,
                    }),
                ],
                visible: false
            }),
            // 小学校区レイヤーグループ
            new ol.layer.Group({
                layers:[
                     // 小学校区ポリゴン
                     new ol.layer.Vector({
                         source: new ol.source.GeoJSON({
                             projection: 'EPSG:3857',
                             url: 'data/Elementary.geojson'
                         }),
                         name: 'layerElementarySchool',
                         style: elementaryStyleFunction,
                     }),
                     // 小学校区位置
                     new ol.layer.Vector({
                         source: new ol.source.GeoJSON({
                             projection: 'EPSG:3857',
                             url: 'data/Elementary_loc.geojson'
                         }),
                         name: 'layerElementarySchoolLoc',
                         style: elementaryStyleFunction,
                     })
                ],
                visible: false
            }),
            // 距離同心円描画用レイヤー
            new ol.layer.Vector({
                 source: new ol.source.Vector(),
                 name: 'layerCircle',
                 style: circleStyleFunction,
                 visible: true
            }),
        ],
        target: 'map',
        view: new ol.View({
            center: ol.proj.transform(this.viewCenter, 'EPSG:4326', 'EPSG:3857'),
            zoom: 14,
            maxZoom: 18,
            minZoom: 10
        }),
        controls: [
             new ol.control.Attribution({collapsible: true}),
             new ol.control.ScaleLine({}), // 距離ライン定義
             new ol.control.Zoom({}),
             new ol.control.ZoomSlider({}),
             new ol.control.Rotate({}), // ノースアップ
             new MoveCurrentLocationControl()
        ]
    });
};

/**
 * 指定した名称のレイヤーの表示・非表示を切り替える
 * @param  {[type]} layerName [description]
 * @param  {[type]} visible   [description]
 * @return {[type]}           [description]
 */
Papamamap.prototype.switchLayer = function(layerName, visible)
{
    this.map.getLayers().forEach(function(layer) {
        if (layer.get('name') == layerName) {
            layer.setVisible(visible);
        }
    });
};

/**
 * 指定した座標にアニメーションしながら移動する
 * isTransform:
 * 座標参照系が変換済みの値を使うには false,
 * 変換前の値を使うには true を指定
 */
Papamamap.prototype.animatedMove = function(lon, lat, isTransform)
{
    // グローバル変数 map から view を取得する
    view = this.map.getView();
    var pan = ol.animation.pan({
        duration: 850,
        source: view.getCenter()
    });
    this.map.beforeRender(pan);
    var coordinate = [lon, lat];
    if(isTransform) {
        // 座標参照系を変換する
        coordinate = ol.proj.transform([lon, lat], 'EPSG:4326', 'EPSG:3857');
    } else {
        // 座標系を変換しない
        // モバイルでポップアップ上部が隠れないように中心をずらす
        var pixel = this.map.getPixelFromCoordinate(coordinate);
        pixel[1] = pixel[1] - this.centerLatOffsetPixel;
        coordinate = this.map.getCoordinateFromPixel(pixel);
    }
    view.setCenter(coordinate);
};


/**
 * 指定したgeojsonデータを元に認可外・認可・幼稚園レイヤーを描写する
 *
 * @param {[type]} facilitiesData [description]
 */
Papamamap.prototype.addNurseryFacilitiesLayer = function(facilitiesData)
{
    if(this.map.getLayers().getLength() >= 4) {
        this.map.removeLayer(this.map.getLayers().item(4));
        this.map.removeLayer(this.map.getLayers().item(4));
        this.map.removeLayer(this.map.getLayers().item(4));
    }

    // 幼稚園
    var layerKindergarten = new ol.layer.Vector({
        source: new ol.source.GeoJSON({
            projection: 'EPSG:3857',
            object: {
              type: facilitiesData.type,
              features: _.filter(facilitiesData.features, function(data) {return data.properties['Type'] === '幼稚園'})
            }
        }),
        name: 'layerKindergarten',
        style: nurseryStyleFunction
    });
    this.map.addLayer(layerKindergarten);
    this.featureOverlays["幼稚園"] = layerKindergarten;

    // 認可外
    var layerNinkagai = new ol.layer.Vector({
        source: new ol.source.GeoJSON({
            projection: 'EPSG:3857',
            object: {
              type: facilitiesData.type,
              features: _.filter(facilitiesData.features, function(data) {return data.properties['Type'] === '認可外'})
            }
        }),
        name: 'layerNinkagai',
        style: nurseryStyleFunction
    });
    this.map.addLayer(layerNinkagai);
    this.featureOverlays["認可外"] = layerNinkagai;

    // 認可
    var layerNinka = new ol.layer.Vector({
        source: new ol.source.GeoJSON({
            projection: 'EPSG:3857',
            object: {
              type: facilitiesData.type,
              features: _.filter(facilitiesData.features, function(data) {return data.properties['Type'] === '認可保育所'})
            }
        }),
        name: 'layerNinka',
        style: nurseryStyleFunction
    });
    this.map.addLayer(layerNinka);
    this.featureOverlays["認可保育所"] = layerNinka;
};

/**
 * 保育施設データの読み込みを行う
 * @return {[type]} [description]
 */
Papamamap.prototype.loadNurseryFacilitiesJson = function(successFunc)
{
    var d = new $.Deferred();
    $.getJSON(
        "data/nurseryFacilities.geojson",
        function(data) {
            successFunc(data);
            d.resolve();
        }
    ).fail(function(){
        console.log('station data load failed.');
        d.reject('load error.');
    });
    return d.promise();
};

/**
 *
 * @param  {[type]} mapServerListItem [description]
 * @param  {[type]} opacity           [description]
 * @return {[type]}                   [description]
 */
Papamamap.prototype.changeMapServer = function(mapServerListItem, opacity)
{
    this.map.removeLayer(this.map.getLayers().item(0));
    source_type = mapServerListItem.source_type;
    var layer = null;
    switch(source_type) {
        case 'image':
            layer = new ol.layer.Image({
                opacity: opacity,
                source: mapServerListItem.source
            });
            break;
        default:
            layer = new ol.layer.Tile({
                opacity: opacity,
                source: mapServerListItem.source
            });
            break;
    }
    this.map.getLayers().insertAt(0, layer);
};

/**
 * 指定した名前のレイヤー情報を取得する
 * @param  {[type]} layerName [description]
 * @return {[type]}           [description]
 */
Papamamap.prototype.getLayer = function(layerName)
{
    result = null;
    this.map.getLayers().forEach(function(layer) {
        if (layer.get('name') == layerName) {
            result = layer;
        }
    });
    return result;
};

/**
 * 指定した場所に地図の中心を移動する。
 * 指定した場所情報にポリゴンの座標情報を含む場合、ポリゴン外枠に合わせて地図の大きさを変更する
 *
 * @param  {[type]} mapServerListItem [description]
 * @return {[type]}                   [description]
 */
Papamamap.prototype.moveToSelectItem = function(mapServerListItem)
{
    if(mapServerListItem.coordinates !== undefined) {
        // 区の境界線に合わせて画面表示
        components = [];
        for(var i=0; i<mapServerListItem.coordinates.length; i++) {
            coord = mapServerListItem.coordinates[i];
            pt2coo = ol.proj.transform(coord, 'EPSG:4326', 'EPSG:3857');
            components.push(pt2coo);
        }
        components = [components];

        view = this.map.getView();
        polygon = new ol.geom.Polygon(components);
        size =  this.map.getSize();
        var pan = ol.animation.pan({
            duration: 850,
            source: view.getCenter()
        });
        this.map.beforeRender(pan);

        feature = new ol.Feature({
            name: mapServerListItem.name,
            geometry: polygon
        });
        layer = this.getLayer(this.getLayerName("Circle"));
        source = layer.getSource();
        source.clear();
        source.addFeature(feature);

        view.fitGeometry(
            polygon,
            size,
            {
                constrainResolution: false
            }
        );
    } else {
        // 選択座標に移動
        lon = mapServerListItem.lon;
        lat = mapServerListItem.lat;
        if(lon !== undefined && lat !== undefined) {
            this.animatedMove(lon, lat, true);
        }
    }
};

/**
 * [getPopupTitle description]
 * @param  {[type]} feature [description]
 * @return {[type]}         [description]
 */
Papamamap.prototype.getPopupTitle = function(feature)
{
    // タイトル部
    var title = '';
    // 認可 or 認可外
    var type = feature.get('種別') ? feature.get('種別') : feature.get('Type');
    title  = '[' + type + '] ';
    // 先取りプロジェクト or 保育ルーム
    if (type === '認可外'){
        var sakidori_auth = feature.get('Sakidori_auth');
        var hoikuroom_auth = feature.get('Hoikuroom_auth');
        if (sakidori_auth === 'Y') {
            title += ' [先取りプロジェクト]';
        }
        if (hoikuroom_auth === 'Y') {
            title += ' [保育ルーム]';
        }
    }
    var owner = feature.get('設置') ? feature.get('設置') : feature.get('Ownership');
    if(owner !== undefined && owner !== null && owner !== "") {
        title += ' [' + owner +']';
    }
    var name = feature.get('名称') ? feature.get('名称') : feature.get('Name');
    title += '</br>' + name;
    url = feature.get('url');
    if(url !== null && url !='') {
        title = '<a href="' +url+ '" target="_blank">' + title + '</a>';
    }
    return title;
};

/**
 * [getPopupContent description]
 * @param  {[type]} feature [description]
 * @return {[type]}         [description]
 */
Papamamap.prototype.getPopupContent = function(feature)
{
    var content = '';
    content = '<table><tbody>';
    var booleanValue = function(value, yValue, nValue) {
        if (value === 'Y') {
            return yValue || 'はい'
        }
        if (value === 'N') {
            return nValue || 'いいえ'
        }
        return null;
    };

    var dateValue = function(dateStr) {
      if (dateStr == null || dateStr.length !== 8) {
        return dateStr;
      }
      return dateStr.substring(0,4) + '/' + dateStr.substring(4,6) + '/' +dateStr.substring(6,8);
    }

    var type = feature.get('種別') ? feature.get('種別') : feature.get('Type');
    var vacancy = feature.get('Vacancy');
    if(type == "認可保育所" && vacancy != null) {
        content += '<tr>';
        content += '<th>欠員</th>';
        content += '<td>';
        if(vacancy === 'Y') {
            content += '<a href="http://www.city.chiba.jp/kodomomirai/kodomomirai/unei/akizyoukyou.html" target="_blank">空きあり</a>';
        }else if (vacancy === 'N'){
            content += '<a href="http://www.city.chiba.jp/kodomomirai/kodomomirai/unei/akizyoukyou.html" target="_blank">空きなし</a>';
        }
        var vacancyDate = feature.get('VacancyDate');
        if (vacancyDate != null) {
            content += " (" + dateValue(vacancyDate) + ")";
        }
        content += '</td>';
        content += '</tr>';
    }

    var kodomo = feature.get('Kodomo');
    var shanai = feature.get('Shanai');
    if (kodomo === 'Y' || shanai === 'Y') {
        content += '<tr>';
        content += '<th>施設種別</th>';
        content += '<td>';
        content += kodomo === 'Y' ? '認定こども園 ' : '';
        content += shanai === 'Y' ? '事業所内保育所 ' : '';
        content += '</td>';
        content += '</tr>';
    }

    var open  = feature.get('開園時間') ? feature.get('開園時間') : feature.get('Open');
    var close = feature.get('終園時間') ? feature.get('終園時間') : feature.get('Close');
    if (open !=  null || close != null ) {
        content += '<tr>';
        content += '<th>時間</th>';
        content += '<td>';
        content += (open ? open : "") + '〜' + (close ? close : "");
        content += '</td>';
        content += '</tr>';
    }
    var memo = feature.get('備考') ? feature.get('備考') : feature.get('Memo');
    if (memo != null) {
        content += '<tr>';
        content += '<th></th>';
        content += '<td>' + memo + '</td>';
        content += '</tr>';
    }

    var extra   = feature.get('Extra');
    var temp    = feature.get('一時') ? feature.get('一時') : feature.get('Temp');
    var holiday = feature.get('休日') ? feature.get('休日') : feature.get('Holiday');
    var night   = feature.get('夜間') ? feature.get('夜間') : feature.get('Night');
    var h24     = feature.get('H24') ? feature.get('H24') : feature.get('H24');
    if (extra != null) {
        content += '<tr>';
        content += '<th>延長保育</th>';
        content += '<td>' + booleanValue(extra, 'あり', 'なし') + '</td>';
        content += '</tr>';
    }
    if (temp != null) {
        content += '<tr>';
        content += '<th>一時保育</th>';
        content += '<td>' + booleanValue(temp, 'あり', 'なし') + '</td>';
        content += '</tr>';
    }
    if (holiday != null) {
        content += '<tr>';
        content += '<th>休日保育</th>';
        content += '<td>' + booleanValue(holiday, 'あり', 'なし') + '</td>';
        content += '</tr>';
    }
    if (night != null) {
        content += '<tr>';
        content += '<th>夜間保育</th>';
        content += '<td>' + booleanValue(night, 'あり', 'なし') + '</td>';
        content += '</tr>';
    }
    if (h24 != null) {
        content += '<tr>';
        content += '<th>24時間</th>';
        content += '<td>' + booleanValue(h24, 'あり', 'なし') + '</td>';
        content += '</tr>';
    }

    var proof = feature.get('証明') ? feature.get('証明') : feature.get('Proof');
    // 千葉市版は証明書発行表示必要ないので、proofにnullを設定
    proof = null;

    if(type == "認可外" && proof === 'Y') {
        content += '<tr>';
        content += '<th>監督基準</th>';
        content += '<td>';
        content += '証明書発行済<a href="https://www.city.chiba.jp/kodomomirai/kodomomirai/unei/ninkagai.html" target="_blank">(詳細)</a>';
        content += '</td>';
        content += '</tr>';
    }

    var ageS = feature.get('開始年齢') ? feature.get('開始年齢') : feature.get('AgeS');
    var ageE = feature.get('終了年齢') ? feature.get('終了年齢') : feature.get('AgeE');
    if (ageS != null || ageE != null) {
        content += '<tr>';
        content += '<th>年齢</th>';
        content += '<td>' + (ageS ? ageS : "") + '〜' + (ageE ? ageE : "") + '</td>';
        content += '</tr>';
    }
    var full = feature.get('定員') ? feature.get('定員') : feature.get('Full');
    if (full != null) {
        content += '<tr>';
        content += '<th>定員</th>';
        content += '<td>' + full + '人</td>';
        content += '</tr>';
    }
    var tel = feature.get('TEL') ? feature.get('TEL') : feature.get('TEL');
    if (tel != null) {
        content += '<tr>';
        content += '<th>TEL</th>';
        content += '<td>' + tel + '</td>';
        content += '</tr>';
    }
    var fax = feature.get('FAX') ? feature.get('FAX') : feature.get('FAX');
    if (fax != null) {
        content += '<tr>';
        content += '<th>FAX</th>';
        content += '<td>' + fax + '</td>';
        content += '</tr>';
    }
    var add1 = feature.get('住所１') ? feature.get('住所１') : feature.get('Add1');
    var add2 = feature.get('住所２') ? feature.get('住所２') : feature.get('Add2');
    if (add1 != null || add2 != null) {
        content += '<tr>';
        content += '<th>住所</th>';
        content += '<td>' + (add1 ? add1 : "") + (add2 ? add2 : "") +'</td>';
        content += '</tr>';
    }
    var owner = feature.get('設置者') ? feature.get('設置者') : feature.get('Owner');
    if (owner != null) {
        content += '<tr>';
        content += '<th>設置者</th>';
        content += '<td>' + owner + '</td>';
        content += '</tr>';
    }
    var parking = feature.get('Parking');
    if (parking != null) {
        content += '<tr>';
        content += '<th>駐車場台数</th>';
        content += '<td>' + parking + '</td>';
        content += '</tr>';
    }
    var bus = booleanValue(feature.get('Bus'), 'あり', 'なし');
    if (bus != null) {
        content += '<tr>';
        content += '<th>送迎バス</th>';
        content += '<td>' + bus + '</td>';
        content += '</tr>';
    }
    var uniform = booleanValue(feature.get('Uniform'), 'あり', 'なし');
    if (uniform != null) {
        content += '<tr>';
        content += '<th>制服</th>';
        content += '<td>' + uniform + '</td>';
        content += '</tr>';
    }
    var smock = booleanValue(feature.get('Smock'), 'あり', 'なし');
    if (smock != null) {
        content += '<tr>';
        content += '<th>スモック</th>';
        content += '<td>' + smock + '</td>';
        content += '</tr>';
    }
    var lunch = booleanValue(feature.get('Lunch'), 'あり (年齢により、ない場合もあり)', 'なし');
    if (lunch != null) {
        content += '<tr>';
        content += '<th>給食</th>';
        content += '<td>' + lunch + '</td>';
        content += '</tr>';
    }
    var cost = feature.get('Cost');
    if (cost != null) {
        content += '<tr>';
        content += '<th>その他経費</th>';
        content += '<td>' + cost + '</td>';
        content += '</tr>';
    }
    var competition = feature.get('Competition');
    if (competition != null) {
        content += '<tr>';
        content += '<th>申込倍率</th>';
        content += '<td>' + competition + '倍 (2016年4月入園時)</td>';
        content += '</tr>';
    }
    var openingdate = feature.get('Openingdate');
    if (openingdate != null) {
        content += '<tr>';
        content += '<th>建築年月日</th>';
        content += '<td>' + dateValue(openingdate) + '</td>';
        content += '</tr>';
    }
    var playground = feature.get('Playground');
    if (playground != null) {
        content += '<tr>';
        content += '<th>園庭広さ</th>';
        content += '<td>' + playground + '㎡</td>';
        content += '</tr>';
    }
    var playroom = feature.get('Playroom');
    if (playroom != null) {
        content += '<tr>';
        content += '<th>保育室広さ</th>';
        content += '<td>' + playroom + '㎡</td>';
        content += '</tr>';
    }
    var pool = booleanValue(feature.get('Pool'), 'あり', 'なし');
    if (pool != null) {
        content += '<tr>';
        content += '<th>プール</th>';
        content += '<td>' + pool + '</td>';
        content += '</tr>';
    }
    var remarks = feature.get('Remarks');
    if (remarks != null) {
        content += '<tr>';
        content += '<th>備考</th>';
        content += '<td>' + remarks + '</td>';
        content += '</tr>';
    }
    content += '</tbody></table>';
    return content;
};

/**
 * 円を消す
 *
 * @param  {[type]} radius      [description]
 * @param  {[type]} moveToPixel [description]
 * @return {[type]}             [description]
 */
Papamamap.prototype.clearCenterCircle = function()
{
    var layer = this.getLayer(this.getLayerName("Circle"));
    var source = layer.getSource();
    source.clear();
};

/**
 * 円を描画する
 *
 * @param  {[type]} radius      [description]
 * @param  {[type]} moveToPixel [description]
 * @return {[type]}             [description]
 */
Papamamap.prototype.drawCenterCircle = function(radius, moveToPixel)
{
    if(moveToPixel === undefined || moveToPixel === null) {
        moveToPixel = 0;
    }
    if(radius === "") {
        radius = 500;
    }

    // 円を消す
    this.clearCenterCircle();

    view  = this.map.getView();
    coordinate = view.getCenter();
    if(moveToPixel > 0) {
        var pixel = map.getPixelFromCoordinate(coordinate);
        pixel[1] = pixel[1] + moveToPixel;
        coordinate = map.getCoordinateFromPixel(pixel);
    }
    // circleFeatures = drawConcentricCircle(coord, radius);

    // 選択した半径の同心円を描く
    radius = Math.floor(radius);

    circleFeatures = [];
    // 中心部の円を描く
    var sphere = new ol.Sphere(6378137); // ol.Sphere.WGS84 ol.js には含まれてない
    coordinate = ol.proj.transform(coordinate, 'EPSG:3857', 'EPSG:4326');

    // 描画する円からextent情報を取得し、円の大きさに合わせ画面の縮尺率を変更
    geoCircle = ol.geom.Polygon.circular(sphere, coordinate, radius);
    geoCircle.transform('EPSG:4326', 'EPSG:3857');
    circleFeature = new ol.Feature({
        geometry: geoCircle
    });
    circleFeatures.push(circleFeature);

    // 大きい円に合わせて extent を設定
    extent = geoCircle.getExtent();
    view   = this.map.getView();
    sizes  = this.map.getSize();
    size   = (sizes[0] < sizes[1]) ? sizes[0] : sizes[1];
    view.fitExtent(extent, [size, size]);

    // 円の内部に施設が含まれるかチェック
    _features = _.filter(nurseryFacilities.features, function(item,idx){
        coordinate = ol.proj.transform(item.geometry.coordinates, 'EPSG:4326', 'EPSG:3857');
        if(ol.extent.containsCoordinate(extent, coordinate))
            return true;
        });
    for(var i=0; i < _features.length; i++) {
        console.log(_features[i].properties['名称']);
    }
    console.log(_features);

    var layer  = this.getLayer(this.getLayerName("Circle"));
    var source = layer.getSource();
    source.addFeatures(circleFeatures);
    return;
};

/**
 * レイヤー名を取得する
 * @param  {[type]} cbName [description]
 * @return {[type]}        [description]
 */
Papamamap.prototype.getLayerName = function(cbName)
{
    return 'layer' + cbName;
};

/**
 * 指定した名称のレイヤーの表示・非表示を切り替える
 * @param  {[type]} layerName [description]
 * @param  {[type]} visible   [description]
 * @return {[type]}           [description]
 */
Papamamap.prototype.switchLayer = function(layerName, visible) {
    var _layerName = this.getLayerName(layerName.substr(2));
    this.map.getLayers().forEach(function(layer) {
        if (layer.get('name') == _layerName) {
            layer.setVisible(visible);
        }
    });
};

Papamamap.prototype.updateNurseryStyle = function(feature, setId) {
    var type = null;
    var id = null;
    if (feature.Type != null) {
        // お気に入り一覧画面からTypeを取得する場合
        type = feature.Type;
        id = setId;
    } else {
        type = feature.get('種別') ? feature.get('種別') :  feature.get('Type');
        id = favoriteStore.getId(feature);
    }
    if(type === undefined) {
        return;
    }
    var overlay = this.featureOverlays[type];

    var features = overlay.getSource().getFeatures();
    if (features != null && features.length > 0) {
        for (x in features) {
            if (id === favoriteStore.getId(features[x])) {
                overlay.getSource().removeFeature(features[x]);
                overlay.getSource().addFeature(features[x]);
                break;
            }
        }
    }
}
