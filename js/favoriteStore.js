window.FavoriteStore = function () {
};

/**
 * お気に入り追加されているか
 */
FavoriteStore.prototype.isFavorite = function(feature) {
  var favoriteList = this.getFavoriteList();
  return favoriteList.indexOf(this.getId(feature)) >= 0;
}

/**
 * お気に入り追加
 */
FavoriteStore.prototype.addFavorite = function(feature) {
  var favoriteList = this.getFavoriteList();
  favoriteList.push(this.getId(feature));
  localStorage.setItem('favorite', JSON.stringify(favoriteList));
}

/**
 * お気に入り削除
 */
FavoriteStore.prototype.removeFavorite = function(feature) {
  var favoriteList = this.getFavoriteList();
  for (var i = favoriteList.length - 1; i >= 0; i--) {
    if(favoriteList[i] === this.getId(feature)) {
      favoriteList.splice(i, 1);
    }
  }
  localStorage.setItem('favorite', JSON.stringify(favoriteList));
}

/**
 * IDの取得
 */
FavoriteStore.prototype.getId = function(feature) {
  if (feature.get) {
    return feature.get('Add1') + feature.get('Add2');
  } else if (feature.properties) {
    return feature.properties['Add1']+feature.properties['Add2']
  }
}

/**
 * お気に入り一覧を取得
 */
FavoriteStore.prototype.getFavoriteList = function() {
  var item = localStorage.getItem("favorite");
  if (item) {
    return JSON.parse(item);
  } else {
    return [];
  }
}
