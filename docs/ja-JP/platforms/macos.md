---
read_when:
    - macOSアプリのインストール
    - macOS で local Gateway モードと remote Gateway モードを選ぶ
    - macOS アプリのリリースダウンロードを探しています
summary: OpenClaw macOSメニューバーアプリをインストールして使用する
title: macOS アプリ
x-i18n:
    generated_at: "2026-07-05T11:35:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b34bade53181819a32edf6eefb075b38ba92cf1ae739da4d497c31c410ce0edb
    source_path: platforms/macos.md
    workflow: 16
---

macOS アプリは OpenClaw の**メニューバーコンパニオン**です。ネイティブトレイ UI、macOS
権限プロンプト、通知、WebChat、音声入力、Canvas、および
`system.run` などの Mac ホスト型ノードツールを提供します。

CLI と Gateway だけが必要ですか？[はじめに](/ja-JP/start/getting-started)から開始してください。

## ダウンロード

macOS アプリのビルドは [OpenClaw GitHub releases](https://github.com/openclaw/openclaw/releases) から入手できます。
リリースに macOS アプリのアセットが含まれている場合は、次を探してください。

- `OpenClaw-<version>.dmg`（推奨）
- `OpenClaw-<version>.zip`

一部のリリースには CLI、証跡、または Windows アセットのみが含まれます。最新リリースに
macOS アプリのアセットがない場合は、それが含まれる最新のリリースを使用するか、
[macOS dev setup](/ja-JP/platforms/mac/dev-setup) に従ってソースからビルドしてください。

## 初回起動

1. **OpenClaw.app** をインストールして起動します。
2. ローカル Gateway には **This Mac** を選ぶか、リモート Gateway に接続します。
3. ローカルモード: アプリがユーザー空間ランタイムと Gateway をインストールする間、待機します。
4. プロバイダー設定と macOS 権限チェックリストを完了します。
5. オンボーディングテストメッセージを送信します。

CLI/Gateway のセットアップ手順には、[はじめに](/ja-JP/start/getting-started)を使用してください。
権限の復旧には、[macOS permissions](/ja-JP/platforms/mac/permissions)を使用してください。

## Gateway モードを選択する

| モード | 使用する場面 | 詳細ページ |
| ------ | ------------------------------------------------------------------------------ | -------------------------------------------------- |
| ローカル | この Mac で Gateway を実行し、launchd で稼働状態を維持する必要がある場合。 | [Gateway on macOS](/ja-JP/platforms/mac/bundled-gateway) |
| リモート | 別のホストが Gateway を実行し、この Mac から SSH、LAN、または Tailnet 経由で制御する場合。 | [Remote control](/ja-JP/platforms/mac/remote) |

ローカルモードには、インストール済みの `openclaw` CLI が必要です。新しい Mac では、アプリが
一致する CLI とランタイムを自動的にインストールしてから Gateway ウィザードを開始します。
手動で復旧する方法は、[Gateway on macOS](/ja-JP/platforms/mac/bundled-gateway) を参照してください。

## アプリが担当すること

- メニューバーの状態、通知、ヘルス、WebChat。
- 画面、マイク、スピーチ、自動化、アクセシビリティに関する macOS 権限プロンプト。
- ローカルノードツール: Canvas、カメラ/画面キャプチャ、通知、`system.run`。
- Mac ホスト型コマンドの Exec 承認プロンプト。
- リモートモードの SSH トンネルまたは直接 Gateway 接続。

このアプリは Gateway や一般的な CLI ドキュメントを置き換えるものでは**ありません**。Gateway の
設定、プロバイダー、プラグイン、チャンネル、ツール、セキュリティは、それぞれの
ドキュメントにあります。

## macOS 詳細ページ

| タスク | 読むもの |
| ---------------------------------------- | ------------------------------------------------------------------------------------------- |
| CLI/Gateway サービスをインストールまたはデバッグする | [Gateway on macOS](/ja-JP/platforms/mac/bundled-gateway) |
| クラウド同期フォルダーの外に状態を置く | [Gateway on macOS](/ja-JP/platforms/mac/bundled-gateway#state-directory-on-macos) |
| アプリの検出と接続性をデバッグする | [Gateway on macOS](/ja-JP/platforms/mac/bundled-gateway#debug-app-connectivity) |
| launchd の動作を理解する | [Gateway lifecycle](/ja-JP/platforms/mac/child-process) |
| 権限または署名/TCC の問題を修正する | [macOS permissions](/ja-JP/platforms/mac/permissions) |
| リモート Gateway に接続する | [Remote control](/ja-JP/platforms/mac/remote) |
| メニューバーの状態とヘルスチェックを読む | [Menu bar](/ja-JP/platforms/mac/menu-bar), [Health checks](/ja-JP/platforms/mac/health) |
| 組み込みチャット UI を使用する | [WebChat](/ja-JP/platforms/mac/webchat) |
| 音声ウェイクまたはプッシュトゥトークを使用する | [Voice wake](/ja-JP/platforms/mac/voicewake) |
| Canvas と Canvas ディープリンクを使用する | [Canvas](/ja-JP/platforms/mac/canvas) |
| UI 自動化用に PeekabooBridge をホストする | [Peekaboo bridge](/ja-JP/platforms/mac/peekaboo) |
| コマンド承認を設定する | [Exec approvals](/ja-JP/tools/exec-approvals), [advanced details](/ja-JP/tools/exec-approvals-advanced) |
| Mac ノードコマンドとアプリ IPC を調べる | [macOS IPC](/ja-JP/platforms/mac/xpc) |
| ログを取得する | [macOS logging](/ja-JP/platforms/mac/logging) |
| ソースからビルドする | [macOS dev setup](/ja-JP/platforms/mac/dev-setup) |

## 関連

- [Platforms](/ja-JP/platforms)
- [はじめに](/ja-JP/start/getting-started)
- [Gateway](/ja-JP/gateway)
- [Exec approvals](/ja-JP/tools/exec-approvals)
