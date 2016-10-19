# 千葉市保育園マップについて
========

千葉市保育園マップはさっぽろ保育園マップをフォークして作られています。

- http://www.codeforsapporo.org/papamama/

千葉市内に点在する保育所（認可、認可外）、幼稚園の位置・定員情報をマッピングした地図を作成しています。

## 利用している地図について

地理院地図で提供している地理院タイルの地図情報を利用しています。

- http://portal.cyberjapan.jp/help/development/ichiran.html

## 提供されるデータについて

千葉市で公開している保育所データ、および、国土数値情報ダウンロードサービスから入手できる福祉施設情報を元に独自のCSVデータを作成し利用しています。

- http://TODO
- http://nlftp.mlit.go.jp/ksj/index.html

## 開発環境構築 & 開発時の起動方法

### node & gulpが使用出来ない場合
gulpが使用出来ない場合はnodeをinstallし、gulpをインストールします。

gulpのインストール手順

    $ npm install -g gulp-cli

権限がない場合はsudo npm install -g gulp-cliとしてください。

### node & gulpが使用できる場合
gulpが使用できる場合は次のコマンドで環境構築が完了します

    $ git clone https://github.com/codeforchiba/papamama.git
    $ cd papamama
    $ npm install
    $ gulp serve

## ブランチについて

ブランチ名 | 用途
--- | ---
master | code for sapporoのmasterブランチと完全同期するためのブランチ。このブランチに対して作業を行うことはない。
chiba/master | code for chibaのmasterブランチ。本番にリリースされているソースと同じもの。開発には使用しない。
chiba/develop | code for chibaの開発ブランチ。普段の開発はこのブランチを使用して行われる。

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

このソフトウェアは、MITライセンスでのもとで公開されています。LICENSE.txtを見てください。
