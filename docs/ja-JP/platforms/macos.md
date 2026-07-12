---
read_when:
    - macOSアプリのインストール
    - macOS でローカル Gateway モードとリモート Gateway モードのどちらを使用するかを決める
    - macOS アプリのリリース版ダウンロードを探す
summary: OpenClaw macOSメニューバーアプリをインストールして使用する
title: macOSアプリ
x-i18n:
    generated_at: "2026-07-12T14:41:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 6f15d0840b7ceb8ac4d82f2c67c060c4b7e8bd25cbb12c216b93be31cb2604b0
    source_path: platforms/macos.md
    workflow: 16
---

macOS アプリは OpenClaw の**メニューバーコンパニオン**です。ネイティブのトレイ UI、macOS の
権限プロンプト、通知、WebChat、音声入力、Canvas、および
`system.run` などの Mac ホスト型 Node ツールを提供します。

CLI と Gateway だけが必要ですか？[はじめに](/ja-JP/start/getting-started)から開始してください。

## ダウンロード

macOS アプリのビルドは [OpenClaw の GitHub リリース](https://github.com/openclaw/openclaw/releases)から入手できます。
リリースに macOS アプリのアセットが含まれている場合は、次を探してください。

- `OpenClaw-<version>.dmg`（推奨）
- `OpenClaw-<version>.zip`

一部のリリースには CLI、エビデンス、または Windows のアセットしか含まれていません。最新のリリースに
macOS アプリのアセットがない場合は、それが含まれる最新のリリースを使用するか、
[macOS 開発環境のセットアップ](/ja-JP/platforms/mac/dev-setup)に従ってソースからビルドしてください。

## 初回起動

1. **OpenClaw.app** をインストールして起動します。
2. ローカル Gateway を使用する場合は**この Mac**を選択し、そうでなければリモート Gateway に接続します。
3. ローカルモード：アプリがユーザー空間のランタイムと Gateway をインストールするまで待ちます。
4. ライブモデルのチェックで推論を確立します。チェックに合格すると、残りのセットアップは Crestodian
   が処理します。
5. macOS の権限チェックリストを完了し、オンボーディングのテストメッセージを送信します。

アプリが、デフォルトエージェントにモデルが設定済みの既存 Gateway に接続すると、
その Gateway はすでにセットアップ済みと見なされ、プロバイダーのオンボーディングと
Crestodian をスキップしてダッシュボードを開きます。Gateway に接続できない場合、または
デフォルトエージェントにモデルがない場合は、復旧用に推論のオンボーディングを引き続き
利用できます。

CLI/Gateway のセットアップ手順については、[はじめに](/ja-JP/start/getting-started)を参照してください。
権限を復旧するには、[macOS の権限](/ja-JP/platforms/mac/permissions)を参照してください。

## アップデート

ダッシュボードのアップデートカードは、最初に Sparkle を通じて署名済みの macOS アプリを更新します。
アプリが再起動すると、アプリが管理する対応するローカル Gateway も自動的に更新され、
再起動されます。Homebrew など、ユーザーが管理する CLI インストールでは、
通常の Gateway アップデートフローが維持されます（カードから Gateway のアップデートを直接実行します）。
また、自動修復によって新しい Gateway がダウングレードされたり、
`extended-stable` チャネルの固定が上書きされたりすることはありません。

Sparkle は Gateway の `update.channel` 設定に従います。`beta` と `dev` では
ベータ版アプリのビルドを使用し、`stable`、`extended-stable`、および値が未指定または不明な場合は
安定版アプリのビルドを使用します。

## ダッシュボードのリンクを開く

macOS アプリの埋め込みダッシュボードで外部 Web リンクをクリックすると、サイズ変更可能なブラウザーサイドバーで開きます。各リンクは個別のタブで開き、同じリンクをもう一度クリックすると既存のタブが再利用されます。タブをドラッグして並べ替えたり、タブの閉じるボタンまたはミドルクリックで閉じたり、タブを右クリックして**デフォルトブラウザーで開く**、**リンクをコピー**、**再読み込み**、**タブを閉じる**、**他のタブを閉じる**を選択したりできます。ウィンドウのタイトルバーにある戻る／進むコントロールとトラックパッドのスワイプではダッシュボードの履歴を移動し、サイドバー独自の戻る／進むコントロールではアクティブなタブの履歴を移動します。サイドバーには再読み込み、デフォルトブラウザーで開く、閉じるの各コントロールもあり、その幅が記憶されます。

タイトルバーのコントロールはアプリのサイドバーに追従します。サイドバーが展開されている間、戻る／進むコントロールはサイドバー切り替えボタンの横にある右端に配置されます。サイドバーが折りたたまれている間は、検索ボタン（コマンドパレットを開く）と新規セッションボタンのために場所を空けます。

外部リンクを右クリックすると、**サイドバーで開く**、**デフォルトブラウザーで開く**、または**リンクをコピー**を選択できます。修飾キーを使用したクリックや、ダッシュボードからユーザー操作で開かれた新規ウィンドウリンクは、引き続きデフォルトブラウザーで開きます。サイドバー内の新規ウィンドウリンクは、サイドバーの新しいタブとして開きます。通常のブラウザーでホストされている Control UI ページでは、ブラウザー標準のリンクおよびコンテキストメニューの動作が維持されます。

## ブラウザーのログイン情報をインポートする

アプリがローカル Gateway に接続しており、Cookie を含む Chrome 系プロファイルが Mac に存在する場合、ダッシュボードウィンドウには、エージェントがブラウジングに使用する分離された管理対象プロファイルへ、その Cookie をコピーするための閉じることが可能なバナーが表示されます。バナーの**インポート**コントロールからプロファイルを選択します（Touch ID が必要になる場合があります）。進行状況とインポートされた Cookie の数がその場に表示され、コピーされるのは Cookie だけです。パスワードが元のブラウザーから外部に出ることはありません。バナーを閉じると、その選択が記録されます。**設定 → 一般 → ブラウザーのログイン → インポート…**から、いつでも再表示できます。基盤となるインポートフローと `browser.allowSystemProfileImport` ゲートについては、[ブラウザー](/ja-JP/cli/browser)を参照してください。

## Gateway モードを選択する

| モード   | 使用する状況                                                                    | 詳細ページ                                        |
| ------ | ------------------------------------------------------------------------------ | -------------------------------------------------- |
| ローカル  | この Mac で Gateway を実行し、launchd によって常時稼働させる場合。                | [macOS 上の Gateway](/ja-JP/platforms/mac/bundled-gateway) |
| リモート | 別のホストで Gateway を実行し、この Mac から SSH、LAN、または Tailnet 経由で制御する場合。 | [リモート制御](/ja-JP/platforms/mac/remote)            |

ローカルモードには、インストール済みの `openclaw` CLI が必要です。新しい Mac では、
アプリが Gateway ウィザードを開始する前に、対応する CLI とランタイムを自動的にインストールします。
手動で復旧する方法については、[macOS 上の Gateway](/ja-JP/platforms/mac/bundled-gateway)を参照してください。

## アプリが管理するもの

- メニューバーのステータス、通知、ヘルス、および WebChat。
- 画面、マイク、音声認識、オートメーション、アクセシビリティに関する macOS の権限プロンプト。
- ローカル Node ツール：Canvas、カメラ／画面キャプチャ、通知、および `system.run`。
- Mac ホスト型コマンドに対する実行承認プロンプト。
- リモートモードの SSH トンネルまたは Gateway への直接接続。

このアプリは、Gateway または一般的な CLI のドキュメントを置き換えるものでは**ありません**。Gateway の
設定、プロバイダー、Plugin、チャネル、ツール、セキュリティについては、それぞれの
ドキュメントを参照してください。

## macOS の詳細ページ

| タスク                                     | 参照先                                                                                        |
| ---------------------------------------- | ------------------------------------------------------------------------------------------- |
| CLI/Gateway サービスをインストールまたはデバッグする | [macOS 上の Gateway](/ja-JP/platforms/mac/bundled-gateway)                                          |
| 状態をクラウド同期フォルダーの外に保持する   | [macOS 上の Gateway](/ja-JP/platforms/mac/bundled-gateway#state-directory-on-macos)                 |
| アプリの検出と接続をデバッグする     | [macOS 上の Gateway](/ja-JP/platforms/mac/bundled-gateway#debug-app-connectivity)                   |
| launchd の動作を理解する              | [Gateway のライフサイクル](/ja-JP/platforms/mac/child-process)                                           |
| 権限または署名／TCC の問題を修正する    | [macOS の権限](/ja-JP/platforms/mac/permissions)                                             |
| 最後に使用した Mac を検出する    | [アクティブなコンピューターのプレゼンス](/ja-JP/nodes/presence)                                                 |
| リモート Gateway に接続する              | [リモート制御](/ja-JP/platforms/mac/remote)                                                     |
| メニューバーのステータスとヘルスチェックを確認する   | [メニューバー](/ja-JP/platforms/mac/menu-bar)、[ヘルスチェック](/ja-JP/platforms/mac/health)                 |
| 埋め込みチャット UI を使用する                 | [WebChat](/ja-JP/platforms/mac/webchat)                                                           |
| 音声ウェイクまたはプッシュトゥトークを使用する           | [音声ウェイク](/ja-JP/platforms/mac/voicewake)                                                      |
| Canvas と Canvas のディープリンクを使用する         | [Canvas](/ja-JP/platforms/mac/canvas)                                                             |
| UI オートメーション用に PeekabooBridge をホストする    | [Peekaboo ブリッジ](/ja-JP/platforms/mac/peekaboo)                                                  |
| コマンドの承認を設定する              | [実行承認](/ja-JP/tools/exec-approvals)、[高度な詳細](/ja-JP/tools/exec-approvals-advanced) |
| Mac Node のコマンドとアプリ IPC を確認する    | [macOS IPC](/ja-JP/platforms/mac/xpc)                                                             |
| ログを取得する                             | [macOS のログ](/ja-JP/platforms/mac/logging)                                                     |
| ソースからビルドする                        | [macOS 開発環境のセットアップ](/ja-JP/platforms/mac/dev-setup)                                                 |

## 関連項目

- [プラットフォーム](/ja-JP/platforms)
- [はじめに](/ja-JP/start/getting-started)
- [Gateway](/ja-JP/gateway)
- [実行承認](/ja-JP/tools/exec-approvals)
