# 千葉市版保育園マップについて

Code for Sapporo の開発したさっぽろ保育園マップを千葉市にも作ろう！ ということで開発しました。

千葉市版は、さっぽろ保育園マップをベースに作られたオープンガバメント推進協議会版をベースに機能追加と、千葉市の制度に合わせております。

さっぽろ保育園マップについては、こちら。

- http://www.codeforsapporo.org/papamama/

オープンガバメント推進協議会については、こちらをどうぞ。

- https://www.facebook.com/ogkyogikai/

## 利用している地図について

地理院地図で提供している地理院タイルの地図情報を利用しています。

- http://portal.cyberjapan.jp/help/development/ichiran.html

## 保育園マップで使われるデータについて

千葉市で公開している保育所データ、および、国土数値情報ダウンロードサービスから入手できる福祉施設情報を元に独自のCSVデータを作成し利用しています。

- http://www.city.chiba.jp/kodomomirai/kodomomirai/unei/nyuusyomatiitiran.html
- https://www.city.chiba.jp/kodomomirai/kodomomirai/unei/akizyoukyou.html
- http://nlftp.mlit.go.jp/ksj/index.html

## 開発環境構築 & 開発時の起動方法

### Node.js & gulp が使用できる場合

gulp が使用できる場合は、次のコマンドで環境構築が完了します。

    $ git clone https://github.com/codeforchiba/papamama.git
    $ cd papamama
    $ npm install
    $ gulp serve

### Node.js & gulp が使用出来ない場合

gulp が使用出来ない場合は、 Node.js 及び gulp をインストールします。Node.js のインストールについては、こちらをご覧ください。

- https://nodejs.org/ja/
- https://nodejs.org/ja/download/package-manager/

Node.js の実行環境をインストールした後、gulp をインストールします。

    $ npm install -g gulp-cli

権限がないというエラーがでた場合は、 sudo してください。

    $ sudo npm install -g gulp-cli

## アプリケーションに必要なデータの作成方法

国土数値情報ダウンロードサービスから、該当する市町村の以下のデータを取得してください。

- 行政区域
- 小学校区
- 中学校区
- 学校
- 鉄道
- 福祉施設

ダウンロードしてきたら zip ファイルを展開して、data_org ディレクトリにshp ファイルと dbf ファイルを配置します。

以下のコマンドを実行することで data ディレクトリに geojson データが生成されます。

    $ gulp updatedata

## ライセンスについて

このソフトウェアは、MITライセンスでのもとで公開されています。[こちら](LICENSE.txt) をご覧ください。
