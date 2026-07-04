---
read_when:
    - macOS アプリのインストール
    - macOSでローカルとリモートのGatewayモードを選択する
    - macOSアプリのリリースダウンロードを探しています
summary: OpenClaw macOSメニューバーアプリをインストールして使用する
title: macOS アプリ
x-i18n:
    generated_at: "2026-07-04T06:22:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0b693bb8ebced46bac173f47cdd90d1b69948ccf2388fda449c77a47ae2a4fb4
    source_path: platforms/macos.md
    workflow: 16
---

macOS アプリは OpenClaw の**メニューバー コンパニオン**です。ネイティブなトレイ UI、macOS 権限プロンプト、通知、WebChat、音声入力、Canvas、または `system.run` などの Mac ホスト型ノードツールが必要な場合に使用します。

CLI と Gateway だけが必要な場合は、[はじめに](/ja-JP/start/getting-started)から始めてください。

## ダウンロード

macOS アプリビルドは
[OpenClaw GitHub リリース](https://github.com/openclaw/openclaw/releases)からダウンロードします。
リリースに macOS アプリのアセットが含まれる場合は、次を探してください。

- `OpenClaw-<version>.dmg`（推奨）
- `OpenClaw-<version>.zip`

一部のリリースには CLI、証拠、または Windows アセットのみが含まれます。最新の
リリースに macOS アプリのアセットがない場合は、それを含む最新リリースを使用するか、
[macOS 開発セットアップ](/ja-JP/platforms/mac/dev-setup)でソースからアプリをビルドしてください。

## 初回起動

1. **OpenClaw.app** をインストールして起動します。
2. ローカル Gateway には **This Mac** を選ぶか、リモート Gateway に接続します。
3. ローカルモードでは、アプリがユーザー空間ランタイムと Gateway をインストールするまで待ちます。
4. プロバイダー設定と macOS 権限チェックリストを完了します。
5. オンボーディングのテストメッセージを送信します。

CLI/Gateway のセットアップ経路については、[はじめに](/ja-JP/start/getting-started)を使用してください。
権限の復旧については、[macOS 権限](/ja-JP/platforms/mac/permissions)を使用してください。

## Gateway モードを選択する

| モード | 使用する場合 | 詳細ページ |
| ------ | --------------------------------------------------------------------------------------- | -------------------------------------------------- |
| ローカル | この Mac で Gateway を実行し、launchd で稼働を維持する必要がある場合。 | [macOS の Gateway](/ja-JP/platforms/mac/bundled-gateway) |
| リモート | 別のホストが Gateway を実行し、この Mac が SSH、LAN、または Tailnet 経由で制御する必要がある場合。 | [リモート制御](/ja-JP/platforms/mac/remote) |

ローカルモードには、インストール済みの `openclaw` CLI が必要です。新しい Mac では、アプリが
Gateway ウィザードを開始する前に、対応する CLI とランタイムを自動的にインストールします。
手動復旧については、[macOS の Gateway](/ja-JP/platforms/mac/bundled-gateway)を参照してください。

## アプリが所有するもの

- メニューバーのステータス、通知、ヘルス、WebChat。
- 画面、マイク、音声認識、オートメーション、アクセシビリティに関する macOS 権限プロンプト。
- Canvas、カメラ/画面キャプチャ、通知、`system.run` などのローカルノードツール。
- Mac ホスト型コマンドの Exec 承認プロンプト。
- リモートモードの SSH トンネルまたは直接 Gateway 接続。

アプリは OpenClaw Gateway や一般的な CLI ドキュメントを置き換えるものでは**ありません**。コアの
Gateway 設定、プロバイダー、plugins、チャネル、ツール、セキュリティには
それぞれ専用のドキュメントがあります。

## macOS 詳細ページ

| タスク | 読むもの |
| ---------------------------------------- | ------------------------------------------------------------------------------------------- |
| CLI/Gateway サービスをインストールまたはデバッグする | [macOS の Gateway](/ja-JP/platforms/mac/bundled-gateway) |
| クラウド同期フォルダーから状態を除外する | [macOS の Gateway](/ja-JP/platforms/mac/bundled-gateway#state-directory-on-macos) |
| アプリの検出と接続をデバッグする | [macOS の Gateway](/ja-JP/platforms/mac/bundled-gateway#debug-app-connectivity) |
| launchd の動作を理解する | [Gateway ライフサイクル](/ja-JP/platforms/mac/child-process) |
| 権限または署名/TCC の問題を修正する | [macOS 権限](/ja-JP/platforms/mac/permissions) |
| リモート Gateway に接続する | [リモート制御](/ja-JP/platforms/mac/remote) |
| メニューバーのステータスとヘルスチェックを読む | [メニューバー](/ja-JP/platforms/mac/menu-bar), [ヘルスチェック](/ja-JP/platforms/mac/health) |
| 組み込みチャット UI を使用する | [WebChat](/ja-JP/platforms/mac/webchat) |
| 音声ウェイクまたはプッシュトゥトークを使用する | [音声ウェイク](/ja-JP/platforms/mac/voicewake) |
| Canvas と Canvas ディープリンクを使用する | [Canvas](/ja-JP/platforms/mac/canvas) |
| UI オートメーション用に PeekabooBridge をホストする | [Peekaboo ブリッジ](/ja-JP/platforms/mac/peekaboo) |
| コマンド承認を設定する | [Exec 承認](/ja-JP/tools/exec-approvals), [詳細](/ja-JP/tools/exec-approvals-advanced) |
| Mac ノードコマンドとアプリ IPC を調査する | [macOS IPC](/ja-JP/platforms/mac/xpc) |
| ログをキャプチャする | [macOS ロギング](/ja-JP/platforms/mac/logging) |
| ソースからビルドする | [macOS 開発セットアップ](/ja-JP/platforms/mac/dev-setup) |

## 関連

- [プラットフォーム](/ja-JP/platforms)
- [はじめに](/ja-JP/start/getting-started)
- [Gateway](/ja-JP/gateway)
- [Exec 承認](/ja-JP/tools/exec-approvals)
