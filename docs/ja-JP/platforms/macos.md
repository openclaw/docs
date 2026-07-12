---
read_when:
    - macOSアプリのインストール
    - macOSでローカルGatewayモードとリモートGatewayモードのどちらを使用するかを決める
    - macOSアプリのリリース版ダウンロードを探す
summary: OpenClaw macOSメニューバーアプリのインストールと使用
title: macOSアプリ
x-i18n:
    generated_at: "2026-07-12T21:30:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: ef3ea75aa2f158829da643ca016681e40102cc4fad84e207e80b377d023c2e1f
    source_path: platforms/macos.md
    workflow: 16
---

macOS アプリは OpenClaw の**メニューバーコンパニオン**です。ネイティブのトレイ UI、macOS の
権限プロンプト、通知、WebChat、音声入力、Canvas、および
`system.run` などの Mac ホスト型 Node ツールを提供します。

CLI と Gateway だけが必要ですか？[はじめに](/ja-JP/start/getting-started)を参照してください。

## ダウンロード

macOS アプリのビルドは [OpenClaw の GitHub リリース](https://github.com/openclaw/openclaw/releases)から入手できます。
リリースに macOS アプリのアセットが含まれる場合は、次を探してください。

- `OpenClaw-<version>.dmg`（推奨）
- `OpenClaw-<version>.zip`

一部のリリースには、CLI、エビデンス、または Windows 向けアセットしか含まれません。最新リリースに
macOS アプリのアセットがない場合は、それが含まれる最新のリリースを使用するか、
[macOS 開発環境のセットアップ](/ja-JP/platforms/mac/dev-setup)に従ってソースからビルドしてください。

## 初回実行

1. **OpenClaw.app** をインストールして起動します。
2. ローカル Gateway を使用する場合は **This Mac** を選択し、それ以外の場合はリモート Gateway に接続します。
3. アプリが対応する CLI ランタイムをインストールするまで待ちます。ローカルモードでは、
   Gateway もインストールして起動します。
4. 稼働中のモデルを確認して推論を確立します。確認に成功すると、Crestodian が
   残りのセットアップを処理します。
5. macOS の権限チェックリストを完了し、オンボーディングのテストメッセージを送信します。

アプリが、デフォルトエージェントにモデルが設定済みの既存 Gateway に到達した場合、
その Gateway はセットアップ済みとみなされ、プロバイダーのオンボーディングと
Crestodian をスキップしてダッシュボードを開きます。Gateway に接続できない場合や、
デフォルトエージェントにモデルがない場合は、復旧用として推論のオンボーディングを
引き続き利用できます。

CLI/Gateway のセットアップ手順については、[はじめに](/ja-JP/start/getting-started)を参照してください。
権限の復旧については、[macOS の権限](/ja-JP/platforms/mac/permissions)を参照してください。

## アップデート

ダッシュボードのアップデートカードは、まず Sparkle を通じて署名済み macOS アプリを更新します。
アプリの再起動後、アプリが管理する対応ローカル Gateway を自動的に更新して再起動します。
Homebrew など、ユーザーが管理する CLI インストールでは、通常の Gateway 更新フローが維持され
（カードが Gateway の更新を直接実行します）、自動修復によって新しい Gateway が
ダウングレードされたり、`extended-stable` チャネルの固定が上書きされたりすることはありません。

Sparkle は Gateway の `update.channel` 設定に従います。`beta` と `dev` では
ベータ版アプリのビルドが有効になり、`stable`、`extended-stable`、および値が未設定または不明な場合は、
安定版アプリのビルドが使用されます。

## ダッシュボードのリンクを開く

macOS アプリの埋め込みダッシュボードで外部 Web リンクをクリックすると、サイズ変更可能なブラウザーサイドバーで開きます。各リンクは個別のタブで開き、同じリンクを再度クリックすると既存のタブが再利用されます。タブをドラッグして並べ替えたり、タブの閉じるボタンまたは中クリックで閉じたりできます。また、タブを右クリックすると、**Open in Default Browser**、**Copy Link**、**Reload**、**Close Tab**、**Close Other Tabs** を選択できます。ウィンドウのタイトルバーにある戻る／進むコントロールとトラックパッドのスワイプではダッシュボードの履歴を移動し、サイドバー独自の戻る／進むコントロールではアクティブなタブの履歴を移動します。サイドバーには再読み込み、デフォルトブラウザーで開く、閉じるためのコントロールもあり、幅も記憶されます。

タイトルバーのコントロールはアプリのサイドバーに連動します。展開中は、戻る／進むコントロールがサイドバー切り替えボタンの隣にある右端に配置されます。折りたたみ中は、検索ボタン（コマンドパレットを開きます）と新規セッションボタンのために場所を空けます。

外部リンクを右クリックすると、**Open in Sidebar**、**Open in Default Browser**、または **Copy Link** を選択できます。修飾キーを押しながらのクリック、およびダッシュボードからユーザー操作で開かれる新規ウィンドウリンクは、引き続きデフォルトブラウザーで開きます。サイドバー内の新規ウィンドウリンクは、新しいサイドバータブとして開きます。通常のブラウザーでホストされる Control UI ページでは、ブラウザー標準のリンク動作とコンテキストメニュー動作が維持されます。

## ブラウザーのログイン情報をインポートする

アプリがローカル Gateway に接続して動作し、Cookie を含む Chrome 系プロファイルが Mac 上に存在する場合、ダッシュボードウィンドウには、エージェントがブラウジングに使用する分離された管理対象プロファイルへ Cookie をコピーするための、閉じることができるバナーが表示されます。バナーの **Import** コントロールからプロファイルを選択します（Touch ID が必要な場合があります）。進行状況とインポートされた Cookie 数がインラインで表示され、コピーされるのは Cookie のみです。パスワードがコピー元ブラウザーから外部に出ることはありません。バナーを閉じるとその選択が記録されます。**Settings → General → Browser login → Import…** から、いつでも再度表示できます。基盤となるインポートフローと `browser.allowSystemProfileImport` ゲートについては、[ブラウザー](/ja-JP/cli/browser)を参照してください。

## Gateway モードを選択する

| モード | 使用する場面 | 詳細ページ |
| ------ | ------------------------------------------------------------------------------ | -------------------------------------------------- |
| ローカル | この Mac で Gateway を実行し、launchd によって稼働状態を維持する場合。 | [macOS 上の Gateway](/ja-JP/platforms/mac/bundled-gateway) |
| リモート | 別のホストで Gateway を実行し、この Mac から SSH、LAN、または Tailnet 経由で制御する場合。 | [リモート制御](/ja-JP/platforms/mac/remote) |

どちらのモードでも、アプリが Node ホストランタイムを再利用するため、`openclaw` CLI が
インストールされている必要があります。新しい Mac では、アプリが対応する CLI を自動的にインストールします。
その後、ローカルモードでは Gateway ウィザードを開始し、リモートモードではローカルで 2 つ目の Gateway を
起動せず、選択した Gateway に接続します。
手動で復旧する方法については、[macOS 上の Gateway](/ja-JP/platforms/mac/bundled-gateway)を参照してください。

## アプリが管理するもの

- メニューバーのステータス、通知、ヘルス状態、および WebChat。
- 画面、マイク、音声認識、オートメーション、アクセシビリティに関する macOS の権限プロンプト。
- ネイティブの Canvas、カメラ／画面キャプチャ、通知、位置情報、コンピューター制御と、CLI Node ホストのシステム、ブラウザー、Plugin、Skills、MCP コマンドを組み合わせた 1 つの Mac Node。
- Mac ホスト型コマンドに対する実行承認プロンプト。
- 承認済みシェルコマンドのアプリコンテキストでの実行。CLI ランタイムが共有 Node ポリシーを管理しながら、アプリに対する macOS の権限帰属を維持します。
- リモートモードの SSH トンネルまたは Gateway への直接接続。

アプリは Gateway や一般的な CLI ドキュメントの代わりには**なりません**。Gateway の
設定、プロバイダー、Plugin、チャネル、ツール、セキュリティについては、
それぞれのドキュメントを参照してください。

## macOS の詳細ページ

| タスク | 参照先 |
| ---------------------------------------- | ------------------------------------------------------------------------------------------- |
| CLI/Gateway サービスをインストールまたはデバッグする | [macOS 上の Gateway](/ja-JP/platforms/mac/bundled-gateway) |
| クラウド同期フォルダーに状態を保存しないようにする | [macOS 上の Gateway](/ja-JP/platforms/mac/bundled-gateway#state-directory-on-macos) |
| アプリの検出と接続をデバッグする | [macOS 上の Gateway](/ja-JP/platforms/mac/bundled-gateway#debug-app-connectivity) |
| launchd の動作を理解する | [Gateway のライフサイクル](/ja-JP/platforms/mac/child-process) |
| 権限または署名／TCC の問題を修正する | [macOS の権限](/ja-JP/platforms/mac/permissions) |
| 最後に使用した Mac を検出する | [アクティブなコンピューターのプレゼンス](/ja-JP/nodes/presence) |
| リモート Gateway に接続する | [リモート制御](/ja-JP/platforms/mac/remote) |
| メニューバーのステータスとヘルスチェックを確認する | [メニューバー](/ja-JP/platforms/mac/menu-bar)、[ヘルスチェック](/ja-JP/platforms/mac/health) |
| 埋め込みチャット UI を使用する | [WebChat](/ja-JP/platforms/mac/webchat) |
| 音声ウェイクまたはプッシュトゥトークを使用する | [音声ウェイク](/ja-JP/platforms/mac/voicewake) |
| Canvas と Canvas のディープリンクを使用する | [Canvas](/ja-JP/platforms/mac/canvas) |
| UI オートメーション用に PeekabooBridge をホストする | [Peekaboo ブリッジ](/ja-JP/platforms/mac/peekaboo) |
| コマンド承認を設定する | [実行承認](/ja-JP/tools/exec-approvals)、[高度な詳細](/ja-JP/tools/exec-approvals-advanced) |
| Mac Node のコマンドとアプリ IPC を調査する | [macOS IPC](/ja-JP/platforms/mac/xpc) |
| ログを収集する | [macOS のログ記録](/ja-JP/platforms/mac/logging) |
| ソースからビルドする | [macOS 開発環境のセットアップ](/ja-JP/platforms/mac/dev-setup) |

## 関連項目

- [プラットフォーム](/ja-JP/platforms)
- [はじめに](/ja-JP/start/getting-started)
- [Gateway](/ja-JP/gateway)
- [実行承認](/ja-JP/tools/exec-approvals)
