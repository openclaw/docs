---
read_when:
    - macOSアプリのインストール
    - macOS で local と remote の Gateway モードを選ぶ
    - macOS アプリのリリースダウンロードを探しています
summary: OpenClaw macOS メニューバーアプリをインストールして使用する
title: macOSアプリ
x-i18n:
    generated_at: "2026-06-28T00:13:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 42cd610465f2e60736da4681e028bca3ed3ed00b424028554ea098acc8ea980c
    source_path: platforms/macos.md
    workflow: 16
---

macOSアプリはOpenClawの**メニューバーコンパニオン**です。ネイティブなトレイUI、
macOSの権限プロンプト、通知、WebChat、音声入力、Canvas、または`system.run`のような
MacでホストされるNodeツールが必要な場合に使用します。

CLIとGatewayだけが必要な場合は、[はじめに](/ja-JP/start/getting-started)から始めてください。

## ダウンロード

macOSアプリのビルドは
[OpenClaw GitHubリリース](https://github.com/openclaw/openclaw/releases)からダウンロードします。
リリースにmacOSアプリのアセットが含まれている場合は、次を探してください。

- `OpenClaw-<version>.dmg`（推奨）
- `OpenClaw-<version>.zip`

一部のリリースにはCLI、証跡、またはWindowsアセットのみが含まれます。最新の
リリースにmacOSアプリのアセットがない場合は、それが含まれる最新のリリースを使用するか、
[macOS開発セットアップ](/ja-JP/platforms/mac/dev-setup)でソースからアプリをビルドしてください。

## 初回起動

1. **OpenClaw.app**をインストールして起動します。
2. macOSの権限チェックリストを完了します。
3. **ローカル**または**リモート**モードを選択します。
4. アプリから求められた場合は、`openclaw` CLIをインストールします。
5. メニューバーからWebChatを開き、テストメッセージを送信します。

CLI/Gatewayのセットアップ手順には、[はじめに](/ja-JP/start/getting-started)を使用してください。
権限の復旧には、[macOSの権限](/ja-JP/platforms/mac/permissions)を使用してください。

## Gatewayモードを選択する

| モード | 使用する場面 | 詳細ページ |
| ------ | --------------------------------------------------------------------------------------- | -------------------------------------------------- |
| ローカル | このMacでGatewayを実行し、launchdで稼働状態を維持する必要がある場合。 | [macOS上のGateway](/ja-JP/platforms/mac/bundled-gateway) |
| リモート | 別のホストでGatewayを実行し、このMacからSSH、LAN、またはTailnet経由で制御する必要がある場合。 | [リモート制御](/ja-JP/platforms/mac/remote) |

ローカルモードには、インストール済みの`openclaw` CLIが必要です。アプリからインストールすることも、
[macOS上のGateway](/ja-JP/platforms/mac/bundled-gateway)に従うこともできます。

## アプリが担うこと

- メニューバーのステータス、通知、ヘルス、WebChat。
- 画面、マイク、音声認識、オートメーション、アクセシビリティに関するmacOSの権限プロンプト。
- Canvas、カメラ/画面キャプチャ、通知、`system.run`などのローカルNodeツール。
- Macでホストされるコマンドの実行承認プロンプト。
- リモートモードのSSHトンネルまたは直接Gateway接続。

このアプリはOpenClaw Gatewayや一般的なCLIドキュメントを置き換えるものでは**ありません**。コアの
Gateway設定、プロバイダー、Plugin、チャネル、ツール、セキュリティは
それぞれのドキュメントにあります。

## macOS詳細ページ

| タスク | 読むもの |
| ---------------------------------------- | ------------------------------------------------------------------------------------------- |
| CLI/Gatewayサービスをインストールまたはデバッグする | [macOS上のGateway](/ja-JP/platforms/mac/bundled-gateway) |
| クラウド同期フォルダーに状態を置かないようにする | [macOS上のGateway](/ja-JP/platforms/mac/bundled-gateway#state-directory-on-macos) |
| アプリの検出と接続性をデバッグする | [macOS上のGateway](/ja-JP/platforms/mac/bundled-gateway#debug-app-connectivity) |
| launchdの動作を理解する | [Gatewayライフサイクル](/ja-JP/platforms/mac/child-process) |
| 権限または署名/TCCの問題を修正する | [macOSの権限](/ja-JP/platforms/mac/permissions) |
| リモートGatewayに接続する | [リモート制御](/ja-JP/platforms/mac/remote) |
| メニューバーのステータスとヘルスチェックを読む | [メニューバー](/ja-JP/platforms/mac/menu-bar), [ヘルスチェック](/ja-JP/platforms/mac/health) |
| 組み込みチャットUIを使用する | [WebChat](/ja-JP/platforms/mac/webchat) |
| 音声ウェイクまたはプッシュトゥトークを使用する | [音声ウェイク](/ja-JP/platforms/mac/voicewake) |
| CanvasとCanvasディープリンクを使用する | [Canvas](/ja-JP/platforms/mac/canvas) |
| UIオートメーション用にPeekabooBridgeをホストする | [Peekabooブリッジ](/ja-JP/platforms/mac/peekaboo) |
| コマンド承認を設定する | [実行承認](/ja-JP/tools/exec-approvals), [高度な詳細](/ja-JP/tools/exec-approvals-advanced) |
| MacのNodeコマンドとアプリIPCを調査する | [macOS IPC](/ja-JP/platforms/mac/xpc) |
| ログを収集する | [macOSロギング](/ja-JP/platforms/mac/logging) |
| ソースからビルドする | [macOS開発セットアップ](/ja-JP/platforms/mac/dev-setup) |

## 関連

- [プラットフォーム](/ja-JP/platforms)
- [はじめに](/ja-JP/start/getting-started)
- [Gateway](/ja-JP/gateway)
- [実行承認](/ja-JP/tools/exec-approvals)
