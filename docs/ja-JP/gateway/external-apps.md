---
read_when:
    - OpenClaw と通信する外部アプリ、スクリプト、ダッシュボード、CI ジョブ、または IDE 拡張機能を構築している
    - Gateway RPC と Plugin SDK のどちらを選ぶか
    - Gateway エージェントの実行、セッション、イベント、承認、モデル、またはツールと統合している
sidebarTitle: External apps
summary: 外部アプリ、スクリプト、ダッシュボード、CIジョブ、IDE拡張機能の現在の連携パス
title: 外部アプリ向けGateway連携
x-i18n:
    generated_at: "2026-07-05T11:20:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 40ff41c23b5312d4a9f91c8c512d205810b04481fc2e1ea80d0506141658f77f
    source_path: gateway/external-apps.md
    workflow: 16
---

外部アプリは Gateway プロトコルを通じて OpenClaw と通信します。これは WebSocket
トランスポートと RPC メソッドで構成されます。スクリプト、ダッシュボード、CI ジョブ、IDE
拡張機能、または別のプロセスが、エージェント実行の開始、イベントのストリーム、結果の待機、
作業のキャンセル、Gateway リソースの検査を行いたい場合に使用します。

<Warning>
  公開 npm クライアントパッケージはまだありません。リリースノートで公開済み
  パッケージが発表され、このページにインストール手順が含まれるまで、OpenClaw クライアントパッケージ
  名をアプリケーション依存関係として追加しないでください。
</Warning>

<Note>
  このページは OpenClaw プロセス外のコード向けです。OpenClaw 内で実行される Plugin コードは、
  代わりに文書化された `openclaw/plugin-sdk/*` サブパスを使用してください。
</Note>

## 現在利用できるもの

| サーフェス                              | ステータス | 用途                                                                                          |
| --------------------------------------- | ---------- | --------------------------------------------------------------------------------------------- |
| [Gateway プロトコル](/ja-JP/gateway/protocol) | 準備完了   | WebSocket トランスポート、接続ハンドシェイク、認可スコープ、プロトコルバージョニング、イベント。 |
| [Gateway RPC リファレンス](/ja-JP/reference/rpc) | 準備完了 | エージェント、セッション、タスク、モデル、ツール、アーティファクト、承認の現在の Gateway メソッド。 |
| [`openclaw agent`](/ja-JP/cli/agent)          | 準備完了   | CLI をシェル経由で呼び出すだけで十分な場合のワンショットのスクリプト連携。                  |
| [`openclaw message`](/ja-JP/cli/message)      | 準備完了   | スクリプトからメッセージまたはチャネルアクションを送信する。                                |

将来のクライアントライブラリパッケージは内部で開発中ですが、まだ公開インストール用のサーフェスではありません。
リリースで公開済みのバージョン付きパッケージが発表されるまでは、プレビュー実装の詳細として扱ってください。

## 推奨パス

1. Gateway を実行または検出します。
2. [Gateway プロトコル](/ja-JP/gateway/protocol)で接続します。
3. [Gateway RPC リファレンス](/ja-JP/reference/rpc)の文書化された RPC メソッドを呼び出します。
4. テスト対象の OpenClaw バージョンを固定します。
5. OpenClaw をアップグレードするときは RPC リファレンスを再確認します。

エージェント実行では、`agent` RPC から始め、最終結果を得るために `agent.wait` と組み合わせます。
永続的な会話状態には `sessions.*` メソッドを使用します。
UI 連携では、Gateway イベントを購読し、アプリが理解するイベントファミリーのみをレンダリングします。

## アプリコードと Plugin コード

コードが OpenClaw の外部にある場合は Gateway RPC を使用します。

- エージェント実行を開始または監視する Node スクリプト
- Gateway を呼び出す CI ジョブ
- ダッシュボードと管理パネル
- IDE 拡張機能
- チャネル Plugin になる必要がない外部ブリッジ
- 偽または実際の Gateway トランスポートを使う統合テスト

コードが OpenClaw 内で実行される場合は Plugin SDK を使用します。

- プロバイダー Plugin
- チャネル Plugin
- ツールまたはライフサイクルフック
- エージェントハーネス Plugin
- 信頼済みランタイムヘルパー

外部アプリは `openclaw/plugin-sdk/*` をインポートしないでください。これらのサブパスは
OpenClaw によって読み込まれる Plugin 向けです。

## 関連

- [Gateway プロトコル](/ja-JP/gateway/protocol)
- [Gateway RPC リファレンス](/ja-JP/reference/rpc)
- [CLI agent コマンド](/ja-JP/cli/agent)
- [CLI message コマンド](/ja-JP/cli/message)
- [エージェントループ](/ja-JP/concepts/agent-loop)
- [エージェントランタイム](/ja-JP/concepts/agent-runtimes)
- [セッション](/ja-JP/concepts/session)
- [バックグラウンドタスク](/ja-JP/automation/tasks)
- [ACP エージェント](/ja-JP/tools/acp-agents)
- [Plugin SDK 概要](/ja-JP/plugins/sdk-overview)
