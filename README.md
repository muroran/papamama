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

- 千葉市のオープンデータの URL を入れる
- http://nlftp.mlit.go.jp/ksj/index.html

## 開発環境構築 & 開発時の起動方法

### node & gulpが使用出来ない場合

gulpが使用出来ない場合はnodeをinstallし、gulpをインストールします。

gulpのインストール手順

    $ npm install -g gulp-cli

権限がない場合はsudo npm install -g gulp-cliとしてください。

### node & gulpが使用できる場合

gulpが使用できる場合は次のコマンドで環境構築が完了します

    $ git clone https://github.com/og-kyogikai/papamama.git
    $ cd papamama
    $ npm install
    $ gulp serve

## アプリケーションに必要なデータの作成方法

国土数値情報ダウンロードサービスから以下のデータを取得してくる

- 行政区域
- 小学校区
- 中学校区
- 学校
- 鉄道
- 福祉施設

ダウンロードしてきたらzipファイルを展開して、data_orgディレクトリにshpファイルとdbfファイルを配置する

以下のコマンドを実行することでdataディレクトリにgeojsonデータが生成されます。

    $ gulp updatedata

## ライセンスについて

このソフトウェアは、MITライセンスでのもとで公開されています。[こちら](LICENSE.txt) をご覧ください。
