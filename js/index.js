// 地図表示時の中心座標
var init_center_coords = [140.1112972, 35.6129448];

// Bing APIのキー
var bing_api_key = 'AhGQykUKW2-u1PwVjLwQkSA_1rCTFESEC7bCZ0MBrnzVbVy7KBHsmLgwW_iRJg17';

// map
var map;

// 保育施設JSON格納用オブジェクト
var nurseryFacilities = {};

// 園一覧を取得
var papamamap = new Papamamap();
var loadNurseryFacilitiesPromise = papamamap.loadNurseryFacilitiesJson(function(data){
	nurseryFacilities = data;
});

// 比較する園の一覧
var compareNurseries = [];

// 中心座標変更セレクトボックス用データ
var moveToList = [];

// フィルター
var filter = new FacilityFilter();

// お気に入り
var favoriteStore = new FavoriteStore();

// マップサーバ一覧
var mapServerList = {
	'bing-road': {
		label: "標準(Bing)",
		source_type: "bing",
		source: new ol.source.BingMaps({
			culture: 'ja-jp',
			key: bing_api_key,
			imagerySet: 'Road',
		})
	},
	"cyberjapn-pale": {
		label: "国土地理院",
		source_type: "xyz",
		source: new ol.source.XYZ({
			attributions: [
				new ol.Attribution({
					html: "<a href='http://portal.cyberjapan.jp/help/termsofuse.html' target='_blank'>国土地理院</a>"
				})
			],
			url: "http://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png",
			projection: "EPSG:3857"
		})
	},
	'osm': {
		label: "交通",
		source_type: "osm",
		source: new ol.source.OSM({
			url: "http://{a-c}.tile.thunderforest.com/transport/{z}/{x}/{y}.png",
			attributions: [
				ol.source.OSM.DATA_ATTRIBUTION,
				new ol.Attribution({html: "Tiles courtesy of <a href='http://www.thunderforest.com/' target='_blank'>Andy Allan</a>"})
			]
		})
	},
	'bing-aerial': {
		label: "写真",
		source_type: "bing",
		source: new ol.source.BingMaps({
			culture: 'ja-jp',
			key: bing_api_key,
			imagerySet: 'Aerial',
		})
	}
};

/**
 * デバイス回転時、地図の大きさを画面全体に広げる
 * @return {[type]} [description]
 */
function resizeMapDiv() {
	var screenHeight = $.mobile.getScreenHeight();
	var contentCurrentHeight = $(".ui-content").outerHeight() - $(".ui-content").height();
	var contentHeight = screenHeight - contentCurrentHeight;
	var navHeight = $("#nav1").outerHeight();
	$(".ui-content").height(contentHeight);
	$("#map").height(contentHeight - navHeight);
}

$(window).on("orientationchange", function() {
	resizeMapDiv();
	map.setTarget('null');
	map.setTarget('map');
});

var initialized = false;
$('#mainPage').on('pageshow', function() {
	// お気に入り削除時、反映のためreload
	var deleteFlg = document.getElementById("delete-flg").value;
	if(deleteFlg == 1) {
		location.reload(true);
		document.getElementById("delete-flg").value = null;
	}

	if(initialized) {
		return;
	}
	initialized = true;
	resizeMapDiv();

	// 地図レイヤー定義
	papamamap.viewCenter = init_center_coords;
	papamamap.generate(mapServerList['bing-road']);
	map = papamamap.map;

	// 保育施設の読み込みとレイヤーの追加
	loadNurseryFacilitiesPromise.done(function(){
		papamamap.addNurseryFacilitiesLayer(nurseryFacilities);
	});

	// ポップアップ定義
	var popup = new ol.Overlay({
		element: $('#popup')
	});
	map.addOverlay(popup);

	// 背景地図一覧リストを設定する
	for(var item in mapServerList) {
		option = $('<option>').html(mapServerList[item].label).val(item);
		$('#changeBaseMap').append(option);
	}

	// 最寄駅セレクトボックスの生成
	mtl = new MoveToList();
	mtl.loadStationJson().then(function() {
		mtl.appendToMoveToListBox(moveToList);
	}, function(){
		mtl.loadStationJson().then(function() {
			mtl.appendToMoveToListBox(moveToList);
		});
	});

	// 保育施設クリック時の挙動を定義
	map.on('click', function(evt) {
		if ( $('#popup').is(':visible') ) {
			// ポップアップを消す
			$('#popup').hide();
			return;
		}

		// クリック位置の施設情報を取得
		obj = map.forEachFeatureAtPixel(
			evt.pixel,
			function(feature, layer) {
				return {feature: feature, layer: layer};
			}
		);

		var feature = null;
		var layer   = null;
		if(obj !== undefined) {
			feature = obj.feature;
			layer   = obj.layer;
		}
		// クリックした場所に要素がなんにもない場合、クリック位置に地図の移動を行う
		if (feature === null) {
			coord = map.getCoordinateFromPixel(evt.pixel);
			view = map.getView();
			papamamap.animatedMove(coord[0], coord[1], false);
			view.setCenter(coord);
		}

		// クリックした場所に既に描いた同心円がある場合、円を消す
		if (feature && layer.get('name') === 'layerCircle' &&
			feature.getGeometry().getType() === "Polygon") {
			$('#cbDisplayCircle').attr('checked', false).checkboxradio('refresh');
			clearCenterCircle();
		}

		// クリックした場所に保育施設がある場合、ポップアップダイアログを出力する
		if (feature && "Point" == feature.getGeometry().getType()) {
			var type = feature.get('種別') ? feature.get('種別') :  feature.get('Type');
			if(type === undefined) {
				return;
			}
			var geometry = feature.getGeometry();
			var coord = geometry.getCoordinates();
			popup.setPosition(coord);

			// タイトル部
			var title = papamamap.getPopupTitle(feature);
			$("#popup-title").html(title);

			// 内容部
			papamamap.animatedMove(coord[0], coord[1], false);
			var content = papamamap.getPopupContent(feature);
			$("#popup-content").html(content);

			// ナビ部
			var isFavorite = favoriteStore.isFavorite(feature);
			var $addFavoriteBtn = $('#add-favorite');
			var $removeFavoriteBtn = $('#remove-favorite');
			if (isFavorite) {
				$addFavoriteBtn.hide();
				$removeFavoriteBtn.show();
			} else {
				$addFavoriteBtn.show();
				$removeFavoriteBtn.hide();
			}
			$addFavoriteBtn.on('click',function(){
				favoriteStore.addFavorite(feature);
				papamamap.updateNurseryStyle(feature);
				$addFavoriteBtn.hide();
				$removeFavoriteBtn.show();

				$addFavoriteBtn.off('click');
				$removeFavoriteBtn.off('click');
			});
			$removeFavoriteBtn.on('click',function(){
				favoriteStore.removeFavorite(feature);
				papamamap.updateNurseryStyle(feature);
				$addFavoriteBtn.show();
				$removeFavoriteBtn.hide();

				$addFavoriteBtn.off('click');
				$removeFavoriteBtn.off('click');
			});

			var height = $('#popup').css('max-height', '').height();
			$('#popup').css('top', - height / 2).show();
			view = map.getView();
			view.setCenter(coord);
		}
	});

	// 中心座標変更セレクトボックス操作イベント定義
	$('#moveTo').change(function(){
		// $('#markerTitle').hide();
		// $('#marker').hide();

		// 指定した最寄り駅に移動
		papamamap.moveToSelectItem(moveToList[$(this).val()]);

		// 地図上にマーカーを設定する
		var lon = moveToList[$(this).val()].lon;
		var lat = moveToList[$(this).val()].lat;
		var label = moveToList[$(this).val()].name;
		var pos = ol.proj.transform([lon, lat], 'EPSG:4326', 'EPSG:3857');
		// Vienna marker
		drawMarker(pos, label);
	});

	// 幼稚園チェックボックスのイベント設定
	$('#cbKindergarten').click(function() {
		papamamap.switchLayer(this.id, $(this).prop('checked'));
	});

	// 認可保育所チェックボックスのイベント設定
	$('#cbNinka').click(function() {
		papamamap.switchLayer(this.id, $(this).prop('checked'));
	});

	// 認可外保育所チェックボックスのイベント設定
	$('#cbNinkagai').click(function() {
		papamamap.switchLayer(this.id, $(this).prop('checked'));
	});

	// 中学校区チェックボックスのイベント定義
	$('#cbMiddleSchool').click(function() {
		layer = map.getLayers().item(1);
		layer.setVisible($(this).prop('checked'));
	});

	// 小学校区チェックボックスのイベント定義
	$('#cbElementarySchool').click(function() {
		layer = map.getLayers().item(2);
		layer.setVisible($(this).prop('checked'));
	});

	// 現在地に移動するボタンのイベント定義
	$('#moveCurrentLocation').click(function(evt){
		control = new MoveCurrentLocationControl();
		control.getCurrentPosition(
			function(pos) {
				var coordinate = ol.proj.transform(
					[pos.coords.longitude, pos.coords.latitude], 'EPSG:4326', 'EPSG:3857');
				view = map.getView();
				view.setCenter(coordinate);
				drawMarker(coordinate, "現在地");
			},
			function(err) {
				alert('位置情報が取得できませんでした。');
			}
		);
	});

	// 半径セレクトボックスのイベント定義
	$('#changeCircleRadius').change(function(evt){
		radius = $(this).val();
		if(radius === "") {
			clearCenterCircle();
			$('#cbDisplayCircle').prop('checked', false).checkboxradio('refresh');
			return;
		} else {
			$('#cbDisplayCircle').prop('checked', true).checkboxradio('refresh');
			drawCenterCircle(radius);
		}
	});

	// 円表示ボタンのイベント定義
	$('#cbDisplayCircle').click(function(evt) {
		radius = $('#changeCircleRadius').val();
		if($('#cbDisplayCircle').prop('checked')) {
			drawCenterCircle(radius);
		} else {
			clearCenterCircle();
		}
	});

	// 地図変更選択ボックス操作時のイベント
	$('#changeBaseMap').change(function(evt) {
		if($(this).val() === "背景") {
			$(this).val($(this).prop("selectedIndex", 1).val());
		}
		papamamap.changeMapServer(
			mapServerList[$(this).val()], $('#changeOpacity option:selected').val()
			);
	});

	// ポップアップを閉じるイベント
	$('#popup-closer').click(function(evt){
		$('#popup').hide();
		return;
	});

	// ポップアップを閉じる
	$('.ol-popup').parent('div').click(function(evt){
		$('#popup').hide();
		return;
	});

	// 親要素へのイベント伝播を停止する
	$('.ol-popup').click(function(evt){
		evt.stopPropagation();
	});

	// 検索フィルターを有効にする
	$('#filterApply').click(function(evt){
		// 条件作成処理
		conditions = [];
		ninka = ninkagai = kindergarten = false;

		// 保育園
		if($('#OpenTime option:selected').val() !== "") {
			conditions['OpenTime'] = $('#OpenTime option:selected').val();
			ninka = ninkagai = true;
		}
		if($('#CloseTime option:selected').val() !== "") {
			conditions['CloseTime'] = $('#CloseTime option:selected').val();
			ninka = ninkagai = true;
		}
		if($('#IchijiHoiku').prop('checked')) {
			conditions['IchijiHoiku'] = 1;
			ninka = ninkagai = true;
		}
		if($('#Yakan').prop('checked')) {
			conditions['Yakan'] = 1;
			ninka = ninkagai = true;
		}
		if($('#Kyujitu').prop('checked')) {
			conditions['Kyujitu'] = 1;
			ninka = ninkagai = true;
		}
		if($('#Vacancy').prop('checked')) {
			conditions['Vacancy'] = 1;
			ninka = ninkagai = true;
		}
		if($('#24H').prop('checked')) {
			conditions['24H'] = 1;
			ninka = ninkagai = true;
		}
		// 先取りプロジェクト認定
		if($('#Sakidori_auth').prop('checked')) {
			conditions['Sakidori_auth'] = 1;
			ninkagai = true;
		}
		// 保育ルーム認定
		if($('#Hoikuroom_auth').prop('checked')) {
			conditions['Hoikuroom_auth'] = 1;
			ninkagai = true;
		}
		// こども園
		if($('#Kodomo').prop('checked')) {
			conditions['Kodomo'] = 1;
			ninka = ninkagai = kindergarten = true;
		}
		// 事業所内保育所
		if($('#Shanai').prop('checked')) {
			conditions['Shanai'] = 1;
			ninka = ninkagai = true;
		}

		// 幼稚園

		// フィルター適用時
		if(Object.keys(conditions).length > 0) {
			newGeoJson = filter.getFilteredFeaturesGeoJson(conditions, nurseryFacilities);
			papamamap.addNurseryFacilitiesLayer(newGeoJson);
			$('#btnFilter').css('background-color', '#3388cc');
		} else {
			papamamap.addNurseryFacilitiesLayer(nurseryFacilities);
			$('#btnFilter').css('background-color', '#f6f6f6');
			ninka = ninkagai = kindergarten = true;
		}

		// レイヤー表示状態によって施設の表示を切り替える
		updateLayerStatus({ninka: ninka, ninkagai: ninkagai, kindergarten: kindergarten});
	});

	// 絞込条件のリセット
	$('#filterReset').click(function(evt){
		// チェックボックスをリセット
		$(".filtercb").each(function(){
			$(this).prop('checked', false).checkboxradio('refresh');
		});
		// セレクトボックスをリセット
		$('.filtersb').each(function(){
			$(this).selectmenu(); // これを実行しないと次の行でエラー発生
			$(this).val('').selectmenu('refresh');
		});
		// 施設情報をリセット
		papamamap.addNurseryFacilitiesLayer(nurseryFacilities);
		$('#btnFilter').css('background-color', '#f6f6f6');

		// レイヤー表示状態によって施設の表示を切り替える
		updateLayerStatus({ninka: true, ninkagai: true, kindergarten: true});
	});

	/**
	 * レイヤー状態を切り替える
	 *
	 * @param  {[type]} checkObj [description]
	 * @return {[type]}               [description]
	 */
	function updateLayerStatus(checkObj)
	{
		papamamap.switchLayer($('#cbNinka').prop('id'), checkObj.ninka);
		papamamap.switchLayer($('#cbNinkagai').prop('id'), checkObj.ninkagai);
		papamamap.switchLayer($('#cbKindergarten').prop('id'), checkObj.kindergarten);
		$('#cbNinka').prop('checked', checkObj.ninka).checkboxradio('refresh');
		$('#cbNinkagai').prop('checked', checkObj.ninkagai).checkboxradio('refresh');
		$('#cbKindergarten').prop('checked', checkObj.kindergarten).checkboxradio('refresh');
	}

	/**
	 * 円を描画する 関数内関数
	 *
	 * @param  {[type]} radius    [description]
	 * @return {[type]}           [description]
	 */
	function drawCenterCircle(radius)
	{
		if($('#cbDisplayCircle').prop('checked')) {
			papamamap.drawCenterCircle(radius);

			$('#center_markerTitle').hide();
			$('#center_marker').hide();

			var center = map.getView().getCenter();
			var coordinate = center;
			var marker = new ol.Overlay({
				position: coordinate,
				positioning: 'center-center',
				element: $('#center_marker'),
				stopEvent: false
			});
			map.addOverlay(marker);

			// 地図マーカーラベル設定
			$('#center_markerTitle').html("");
			var markerTitle = new ol.Overlay({
				position: coordinate,
				element: $('#center_markerTitle')
			});
			map.addOverlay(markerTitle);
			$('#center_markerTitle').show();
			$('#center_marker').show();
		}
	}

	/**
	 * 円を消す
	 *
	 * @return {[type]} [description]
	 */
	function clearCenterCircle()
	{
		papamamap.clearCenterCircle();
		$('#center_markerTitle').hide();
		$('#center_marker').hide();
		$('#changeCircleRadius').val('').selectmenu('refresh');
		return;
	}

	/**
	 * 指定座標にマーカーを設定する
	 * @param  {[type]} coordinate [description]
	 * @return {[type]}            [description]
	 */
	function drawMarker(coordinate, label)
	{
		$('#markerTitle').hide();
		$('#marker').hide();
		var marker = new ol.Overlay({
			position: coordinate,
			positioning: 'center-center',
			element: $('#marker'),
			stopEvent: false
		});
		map.addOverlay(marker);

		// 地図マーカーラベル設定
		$('#markerTitle').html(label);
		var markerTitle = new ol.Overlay({
			position: coordinate,
			element: $('#markerTitle')
		});
		map.addOverlay(markerTitle);
		$('#markerTitle').show();
		$('#marker').show();
		return;
	}

});

/**
 * お気に入り一覧画面
 */
// 表示処理
$('#favorite-list').on('pageshow', function() {
	// お気に入り一覧作成
	createFavoriteList();
});

// チェックボックス選択時
var onChangeCheckbox = function() {
	var favoriteCheckboxes = $('#favorite-list').find("#favorite-items").find(".ui-checkbox");
	compareNurseries = favoriteCheckboxes.find(":checked").map(function(){
	  return $(this).val();
	}).get();

	if (compareNurseries.length >= 2) {
		favoriteCheckboxes.each(function(){
			var $checkbox = $(this).find(":checkbox");
			if (!$checkbox.is(":checked")) {
				$(this).addClass("ui-state-disabled");
				$checkbox.prop("disabled", true);
			} else {
				$(this).addClass("ui-state-active");
			}
		});
		$("#compare-btn").removeClass("ui-state-disabled");
		$("#compare-btn").prop("disabled", false);
	} else {
		favoriteCheckboxes.each(function(){
			$(this).removeClass("ui-state-disabled").removeClass("ui-state-active");
			$(this).find(":checkbox").prop("disabled", false);
		});
		$("#compare-btn").addClass("ui-state-disabled");
		$("#compare-btn").prop("disabled", true);
	}
};
$("#favorite-list").on("change", "#favorite-items .ui-checkbox :checkbox", onChangeCheckbox);

$('#compare-page').on('pageshow', function() {
	var feature1 = filter.getFeatureById(compareNurseries[0]) || {};
	var feature2 = filter.getFeatureById(compareNurseries[1]) || {};
	var nursery1 = feature1.properties || {};
	var nursery2 = feature2.properties || {};
	// 名称
	$("#compare-title-1").text(nursery1["Name"]);
	$("#compare-title-2").text(nursery2["Name"]);

	var compareDataDom = function(title, data1, data2, trClass) {
		var dom = "";
		if (data1 != null || data2 != null) {
			dom += '<tr ' + (trClass != null ? 'class="' + trClass + '"' : '') + '>';
			dom += '<th class="item-label">' + (title ? title : '') + '</th>';
			dom += '<td>' + (data1 ? data1 : '') + '</td>';
			dom += '<td>' + (data2 ? data2 : '') + '</td>';
			dom += '</tr>';
		}
		return dom;
	}

	var compareBooleanDataDom = function(title, data1, data2, yValue, nValue, trClass) {
		var value1 = booleanValue(data1, yValue, nValue);
		var value2 = booleanValue(data2, yValue, nValue);;
		return compareDataDom(title, value1, value2, trClass);
	}

	var booleanValue = function(value, yValue, nValue) {
		if (value === 'Y') {
			return yValue || 'はい'
		}
		if (value === 'N') {
			return nValue || 'いいえ'
		}
		return null;
	}

	var dateValue = function(dateStr) {
		if (dateStr == null || dateStr.length !== 8) {
			return dateStr;
		}
		return dateStr.substring(0,4) + '/' + dateStr.substring(4,6) + '/' +dateStr.substring(6,8);
	}

	var content = '';
	// 種別
	content += compareDataDom("種別", nursery1["Type"], nursery2["Type"], "nursery-type");
	// 施設種別
	var kodomo1  = nursery1["Kodomo"] === 'Y' ? '認定こども園' : "";
	var shanai1 = nursery1["Shanai"] === 'Y' ? '事業所内保育所' : "";
	var kodomo2  = nursery2["Kodomo"] === 'Y' ? '認定こども園' : "";
	var shanai2 = nursery2["Shanai"] === 'Y' ? '事業所内保育所' : "";
	content += compareDataDom("施設種別", kodomo1+shanai1 || null, kodomo2+shanai2 || null, "nursery-type");

	// 時間
	var open1  = nursery1["Open"] || "";
	var close1 = nursery1["Close"] || "";
	var open2  = nursery2["Open"] || "";
	var close2 = nursery2["Close"] || "";
	content += compareDataDom("時間", open1 + "〜" + close1, open2 + "〜" + close2);
	// 備考
	content += compareDataDom("備考", nursery1["Memo"], nursery2["Memo"]);
	// 一時保育
	content += compareBooleanDataDom("一時保育", nursery1["Temp"], nursery2["Temp"], 'あり', 'なし');
	// 休日保育
	content += compareBooleanDataDom("休日保育", nursery1["Holiday"], nursery2["Holiday"], 'あり', 'なし');
	// 夜間保育
	content += compareBooleanDataDom("夜間保育", nursery1["Night"], nursery2["Night"], 'あり', 'なし');
	// 24時間
	content += compareBooleanDataDom("24時間", nursery1["H24"], nursery2["H24"], '対応', '未対応');
  // 監督基準
	var proof1 = nursery1["Type"] === "認可外" ? nursery1["Proof"] : null;
	var proof2 = nursery2["Type"] === "認可外" ? nursery2["Proof"] : null;
	// 千葉市版は証明書発行表示必要ないので、proof1,2にnullを設定
	proof1 = null;
	proof2 = null;
	content += compareBooleanDataDom("監督基準", proof1, proof2, '証明書発行済み', '未発行');
	// 欠員
	var vacancy1 = null, vacancy2 = null;
	if (nursery1["Type"] === "認可保育所") {
		vacancy1 = booleanValue(nursery1["Vacancy"], '空きあり', '空きなし');
		if (nursery1["VacancyDate"] != null) {
				vacancy1 += "<br> (" + dateValue(nursery1["VacancyDate"]) + ")";
		}
	}
	if (nursery2["Type"] === "認可保育所") {
		vacancy2 = booleanValue(nursery2["Vacancy"], '空きあり', '空きなし');
		if (nursery2["VacancyDate"] != null) {
				vacancy2 += "<br> (" + dateValue(nursery2["VacancyDate"]) + ")";
		}
	}
	content += compareDataDom("欠員", vacancy1, vacancy2, '空きあり', '空きなし');
	// 年齢
	var ageS1  = nursery1["AgeS"] || "";
	var ageE1 = nursery1["AgeE"] || "";
	var ageS2  = nursery2["AgeS"] || "";
	var ageE2 = nursery2["AgeE"] || "";
	var age1 = (ageS1 || ageE1) ? ageS1 + "〜" + ageE1 : null;
	var age2 = (ageS2 || ageE2) ? ageS2 + "〜" + ageE2 : null;
	content += compareDataDom("年齢", age1, age2);
	// 定員
	content += compareDataDom("定員", nursery1["Full"] ? nursery1["Full"] + '人' : null, nursery2["Full"] ? nursery2["Full"] + '人' : null);
	// TEL
	content += compareDataDom("TEL", nursery1["TEL"], nursery2["TEL"]);
	// 住所
	var adr1 = (nursery1["Add1"] || "") + (nursery1["Add2"] || "" );
	var adr2 = (nursery2["Add1"] || "") + (nursery2["Add2"] || "" );
	content += compareDataDom("住所", adr1, adr2);
	// 設置者
	content += compareDataDom("設置者", nursery1["Owner"], nursery2["Owner"]);
	// 駐車場台数
	content += compareDataDom("駐車場台数", nursery1["Parking"], nursery2["Parking"]);
	// 送迎バス
	content += compareBooleanDataDom("送迎バス", nursery1["Bus"], nursery2["Bus"], 'あり', 'なし');
	// 制服
	content += compareBooleanDataDom("制服", nursery1["Uniform"], nursery2["Uniform"], 'あり', 'なし');
	// スモック
	content += compareBooleanDataDom("スモック", nursery1["Smock"], nursery2["Smock"], 'あり', 'なし');
	// 給食
	content += compareBooleanDataDom("給食", nursery1["Lunch"], nursery2["Lunch"], 'あり', 'なし');
	// その他経費
	content += compareDataDom("その他経費", nursery1["Cost"], nursery2["Cost"]);
	// 申込倍率
	var competition1 = nursery1["Cost"] ? nursery1["Cost"] + '倍' : null;
	var competition2 = nursery2["Cost"] ? nursery2["Cost"] + '倍' : null;
	content += compareDataDom("申込倍率", competition1, competition2);
	// 建築年月日
	content += compareDataDom("建築年月日", dateValue(nursery1["Openingdate"]), dateValue(nursery2["Openingdate"]));
	// 園庭広さ
	var playground1 = nursery1["Playground"] ? nursery1["Playground"] + '㎡' : null;
	var playground2 = nursery2["Playground"] ? nursery2["Playground"] + '㎡' : null;
	content += compareDataDom("園庭広さ", playground1, playground2);
	// 保育室広さ
	var playroom1 = nursery1["Playroom"] ? nursery1["Playroom"] + '㎡' : null;
	var playroom2 = nursery2["Playroom"] ? nursery2["Playroom"] + '㎡' : null;
	content += compareDataDom("保育室広さ", playroom1, playroom2);
	// プール
	content += compareBooleanDataDom("プール", nursery1["Pool"], nursery2["Pool"], 'あり', 'なし');
	if(nursery1['Type'] === '認可外' && nursery2['Type'] === '認可外') {
		// 先取りプロジェクト認定
		content += compareBooleanDataDom("先取りプロジェクト認定", nursery1["Sakidori_auth"], nursery2["Sakidori_auth"], 'あり', 'なし');
		// 保育ルーム認定
		content += compareBooleanDataDom("保育ルーム認定", nursery1["Hoikuroom_auth"], nursery2["Hoikuroom_auth"], 'あり', 'なし');
	}
	// 備考
	content += compareDataDom("備考", nursery1["Remarks"], nursery2["Remarks"]);

	$("#nursery-compare-body").html(content);
});

// お気に入り一覧作成
function createFavoriteList() {
	var favoriteList = filter.getFavoriteFeatures(nurseryFacilities);
	var $items = $("#favorite-items");
	$items.children().remove();
	favoriteList.forEach(function(item, index){
		var id = favoriteStore.getId(item);
		var styleClass = "ui-btn ui-corner-all ui-btn-inherit ui-btn-icon-left ui-checkbox-on";
		if (index === 0) {
			styleClass += " ui-first-child";
		}
		if (index === favoriteList.length - 1) {
			styleClass += " ui-last-child";
		}
		var element = "";
		element += "<div class='ui-checkbox'>";
		element += "  <div class='delete-favorite-left'>";
		element += "  	<label for='" + id + "' class='" + styleClass + "'>" + item.properties['Name'] + "</label>";
		element += "  	<input type='checkbox' value='" + id + "' id='" + id + "' " + (compareNurseries.indexOf(id) >= 0 ? "checked='checked'" : "") + ">";
		element += "  </div>";
		element += "  <div class='delete-favorite-right'>";
		element += "  	<a id='delete-button1' value='" + id + "' href='#popupBasic' data-rel='popup' data-role='button' data-icon='delete' data-iconpos='right' data-inline='true' data-transition='pop'></a>";
		element += "  	<div data-role='popup' id='popupBasic'>";
		element += "  		<p>削除しますか？</p>";
		element += "  		<ul>";
		element += "  		 	<li><a id='delete-button2' href='#' data-rel='back' data-mini='true' class='ui-btn ui-btn-inline ui-corner-all'>はい</a></li>";
		element += "  			<li><a href='#' data-rel='back' data-mini='true' class='ui-btn ui-btn-inline ui-corner-all'>いいえ</a></li>";
		element += "  		</ul>";
		element += "  	</div>";
		element += "  </div>";
		element += "</div>"

		$items.append(element);
	});
	$items.trigger('create');

	onChangeCheckbox();

	// お気に入り削除ポップアップ
	var $deleteBtn1 = $('a#delete-button1');
	var $deleteBtn2 = $('a#delete-button2');
	$deleteBtn1.click(function() {
		delVal = $(this).attr("value");
		delTarget = filter.getFeatureById(delVal);
		$deleteBtn2.on('tap', function() {
			favoriteStore.removeFavorite(delTarget);
			document.getElementById("delete-flg").value = '1';
			createFavoriteList();
		});
	});
}
