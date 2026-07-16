---
read_when:
    - macOSアプリのインストール
    - macOSでローカルとリモートのGatewayモードを選択する
    - macOSアプリのリリース版ダウンロードを探す
summary: OpenClaw macOSメニューバーアプリのインストールと使用方法
title: macOSアプリ
x-i18n:
    generated_at: "2026-07-16T11:47:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: c6aaf107eb564dd8a444069fee31bb190efe41da9f26b3c52f42fdbbcaf8690c
    source_path: platforms/macos.md
    workflow: 16
---

macOSアプリはOpenClawの**メニューバーコンパニオン**です。ネイティブのトレイUI、macOSの
権限プロンプト、通知、WebChat、音声入力、Canvas、および
`system.run`などのMacホスト型Nodeツールを提供します。

CLIとGatewayだけが必要ですか？[はじめに](/ja-JP/start/getting-started)から開始してください。

## ダウンロード

macOSアプリのビルドは[OpenClawのGitHubリリース](https://github.com/openclaw/openclaw/releases)から入手できます。
リリースにmacOSアプリのアセットが含まれている場合は、以下を探してください。

- `OpenClaw-<version>.dmg`（推奨）
- `OpenClaw-<version>.zip`

リリースによっては、CLI、エビデンス、またはWindows用アセットのみが含まれます。最新リリースに
macOSアプリのアセットがない場合は、それが含まれる最新のリリースを使用するか、
[macOS開発環境のセットアップ](/ja-JP/platforms/mac/dev-setup)に従ってソースからビルドしてください。

## 初回起動

1. **OpenClaw.app**をインストールして起動します。
2. ローカルGatewayには**This Mac**を選択するか、リモートGatewayに接続します。
3. アプリが対応するCLIランタイムをインストールするまで待ちます。ローカルモードでは、
   Gatewayもインストールして起動します。
4. 稼働中のモデルチェックで推論接続を確立します。チェックに合格すると、残りのセットアップは
   OpenClawが処理します。
5. macOSの権限チェックリストを完了し、オンボーディングのテストメッセージを送信します。

アプリが、デフォルトエージェントにモデルが設定済みの既存Gatewayへ到達した場合、
そのGatewayはセットアップ済みとして扱われ、プロバイダーのオンボーディングと
OpenClawをスキップしてダッシュボードを開きます。Gatewayに接続できない場合、または
デフォルトエージェントにモデルがない場合は、復旧用に推論のオンボーディングを
引き続き利用できます。

CLI/Gatewayのセットアップ手順については、[はじめに](/ja-JP/start/getting-started)を参照してください。
権限の復旧については、[macOSの権限](/ja-JP/platforms/mac/permissions)を参照してください。

## アップデート

ダッシュボードのアップデートカードには、アプリが更新する対象が表示されます。

- **MacアプリとGatewayをアップデート**は、署名済みアプリがローカルのlaunchd
  Gatewayを管理していることを意味します。Sparkleが最初にアプリを更新し、再起動後にアプリが
  Gatewayを対応するバージョンへ自動的に更新して再起動し、接続を確認します。
- **Gatewayをアップデート**は、アプリがリモートGateway、手動管理されている
  ローカルGateway、またはアプリが管理していない別のインストールに接続されていることを意味します。
  ボタンを押すと、Macアプリを変更する代わりに、そのGatewayの通常のアップデート処理が実行されます。

連携アップデートに失敗した場合は、再試行、
[アップデートガイド](/ja-JP/install/updating)、Discordのアクションを備えたセットアップ形式のウィンドウにとどまります。自動修復では、
より新しいGatewayへのダウングレードや、`extended-stable`チャンネルの固定設定の上書きは行われません。

アップデートが成功すると、アプリは人間が最後に使用した
トップレベルのダイレクトセッションを特定し、そのエージェントに一度限りのアップデートイベントを送ります。Heartbeat
とCronのアクティビティはこの選択に影響しません。その後、エージェントは
最も使用していた可能性の高い会話から、再びユーザーを迎えられます。リモートモードでは、アプリは
ローカルのMac Nodeランタイムのみを更新し、リモートGatewayがアプリより古い場合は
通知をスキップします。

SparkleはGatewayの`update.channel`設定に従います。`beta`と`dev`では
ベータ版アプリのビルドを有効にし、`stable`、`extended-stable`、および値が欠落しているか不明な場合は
安定版アプリのビルドを使用します。

## ダッシュボードのリンクを開く

macOSアプリ内蔵のダッシュボードで外部Webリンクをクリックすると、ダッシュボードのナビゲーションを表示したまま、ウィンドウ幅の半分を占めるサイズ変更可能なブラウザーサイドバーで開きます。仕切りをドラッグして別の幅を選択できます。アプリはその幅を記憶します。各リンクは個別のタブで開き、複数のページを開くとタブバーが表示されます。同じリンクを再度クリックすると、既存のタブが再利用されます。タブをドラッグして並べ替え、タブの閉じるボタンまたは中央クリックで閉じることができます。タブを右クリックすると、**Open in Default Browser**、**Copy Link**、**Reload**、**Close Tab**、**Close Other Tabs**を使用できます。ウィンドウのタイトルバーにある戻る／進むコントロールとトラックパッドのスワイプではダッシュボードの履歴を移動し、サイドバー独自の戻る／進むコントロールではアクティブなタブの履歴を移動します。サイドバーには、再読み込み、デフォルトブラウザーで開く、閉じるためのコントロールもあります。

タイトルバーのコントロールはアプリのサイドバーに追従します。サイドバーを展開している間は、戻る／進むボタンがサイドバー切り替えボタンの隣の右端に表示されます。折りたたんでいる間は、検索ボタン（コマンドパレットを開く）と新規セッションボタンのために場所を空けます。

外部リンクを右クリックすると、**Open in Sidebar**、**Open in Default Browser**、または**Copy Link**を選択できます。修飾キーを伴うクリックと、ダッシュボードからユーザー操作で開く新規ウィンドウリンクは、引き続きデフォルトブラウザーで開きます。サイドバー内の新規ウィンドウリンクは、新しいサイドバータブとして開きます。通常のブラウザーでホストされるControl UIページでは、ブラウザー標準のリンク動作とコンテキストメニュー動作が維持されます。

## ブラウザーのログイン情報をインポートする

アプリがローカルGatewayに接続している状態でブラウザーサイドバーを初めて開くと、Mac上にCookieを含むChrome系プロファイルが存在する場合、ダッシュボードに閉じることのできるバナーが表示されます。このバナーでは、エージェントがブラウジングに使用する、分離された管理対象プロファイルへCookieをコピーできます。**Import**コントロールからプロファイルを選択します（Touch IDが必要になる場合があります）。進行状況とインポートされたCookie数がインラインで表示され、コピーされるのはCookieのみです。パスワードがコピー元ブラウザーから外部へ出ることはありません。バナーを閉じるとその選択が記録されます。**Settings → General → Browser login → Import…**から、いつでも再度表示できます。基盤となるインポート処理と`browser.allowSystemProfileImport`ゲートについては、[ブラウザー](/ja-JP/cli/browser)を参照してください。

## Gatewayモードを選択する

| モード | 使用する状況 | 詳細ページ |
| ------ | ------------------------------------------------------------------------------ | -------------------------------------------------- |
| ローカル | このMacでGatewayを実行し、launchdによって稼働状態を維持する場合。 | [macOS上のGateway](/ja-JP/platforms/mac/bundled-gateway) |
| リモート | 別のホストでGatewayを実行し、このMacからSSH、LAN、またはTailnet経由で制御する場合。 | [リモート制御](/ja-JP/platforms/mac/remote) |

どちらのモードでも、アプリがNodeホストランタイムを再利用するため、`openclaw` CLIがインストールされている必要があります。
新しいMacでは、アプリが対応するCLIを自動的にインストールします。その後、ローカル
モードではGatewayウィザードを開始し、リモートモードでは2つ目のローカルGatewayを
起動せずに、選択したGatewayへ接続します。
手動での復旧については、[macOS上のGateway](/ja-JP/platforms/mac/bundled-gateway)を参照してください。

## アプリが管理するもの

- メニューバーのステータス、通知、ヘルス状態、WebChat。
- 画面、マイク、音声認識、オートメーション、アクセシビリティに関するmacOSの権限プロンプト。
- ネイティブのCanvas、カメラ／画面キャプチャ、通知、位置情報、
  コンピューター制御と、CLI Nodeホストのシステム、ブラウザー、
  Plugin、スキル、MCPコマンドを組み合わせた1つのMac Node。
- Macホスト型コマンドに対する実行承認プロンプト。
- 承認済みシェルコマンドのアプリコンテキスト実行。CLIランタイムが共有Nodeポリシーを
  管理する一方で、アプリに対するmacOSの権限帰属を維持します。
- リモートモードのSSHトンネルまたはGatewayへの直接接続。

このアプリは、Gatewayや一般的なCLIドキュメントを置き換えるものでは**ありません**。Gatewayの
設定、プロバイダー、Plugin、チャンネル、ツール、セキュリティについては、それぞれの
ドキュメントを参照してください。

## macOSの詳細ページ

| タスク | 参照先 |
| ---------------------------------------- | ------------------------------------------------------------------------------------------- |
| CLI/Gatewayサービスをインストールまたはデバッグする | [macOS上のGateway](/ja-JP/platforms/mac/bundled-gateway) |
| クラウド同期フォルダーに状態を保存しないようにする | [macOS上のGateway](/ja-JP/platforms/mac/bundled-gateway#state-directory-on-macos) |
| アプリの検出と接続をデバッグする | [macOS上のGateway](/ja-JP/platforms/mac/bundled-gateway#debug-app-connectivity) |
| launchdの動作を理解する | [Gatewayのライフサイクル](/ja-JP/platforms/mac/child-process) |
| 権限または署名／TCCの問題を修正する | [macOSの権限](/ja-JP/platforms/mac/permissions) |
| 最後に使用したMacを検出する | [アクティブなコンピューターのプレゼンス](/ja-JP/nodes/presence) |
| リモートGatewayに接続する | [リモート制御](/ja-JP/platforms/mac/remote) |
| メニューバーのステータスとヘルスチェックを確認する | [メニューバー](/ja-JP/platforms/mac/menu-bar)、[ヘルスチェック](/ja-JP/platforms/mac/health) |
| 内蔵チャットUIを使用する | [WebChat](/ja-JP/platforms/mac/webchat) |
| 音声ウェイクまたはプッシュトゥトークを使用する | [音声ウェイク](/ja-JP/platforms/mac/voicewake) |
| CanvasとCanvasのディープリンクを使用する | [Canvas](/ja-JP/platforms/mac/canvas) |
| UIオートメーション用にPeekabooBridgeをホストする | [Peekabooブリッジ](/ja-JP/platforms/mac/peekaboo) |
| コマンド承認を設定する | [実行承認](/ja-JP/tools/exec-approvals)、[高度な詳細](/ja-JP/tools/exec-approvals-advanced) |
| Mac NodeのコマンドとアプリIPCを確認する | [macOS IPC](/ja-JP/platforms/mac/xpc) |
| ログを取得する | [macOSのログ](/ja-JP/platforms/mac/logging) |
| ソースからビルドする | [macOS開発環境のセットアップ](/ja-JP/platforms/mac/dev-setup) |

## 関連項目

- [プラットフォーム](/ja-JP/platforms)
- [はじめに](/ja-JP/start/getting-started)
- [Gateway](/ja-JP/gateway)
- [実行承認](/ja-JP/tools/exec-approvals)
