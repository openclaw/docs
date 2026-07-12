---
read_when:
    - ドキュメント全体の構成を把握したい場合
summary: すべてのOpenClawドキュメントにリンクするハブ
title: ドキュメントハブ
x-i18n:
    generated_at: "2026-07-11T22:42:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9b51fc77155b2e7ed6cb6e36d375585ebd457c3d89f97c4151877d1aae20717f
    source_path: start/hubs.md
    workflow: 16
---

<Note>
OpenClaw を初めて使用する場合は、[はじめに](/ja-JP/start/getting-started)から開始してください。
</Note>

左側のナビゲーションに表示されない詳細解説やリファレンスドキュメントを含むすべてのページは、以下のハブから見つけられます。

## まずはこちら

- [索引](/ja-JP)
- [はじめに](/ja-JP/start/getting-started)
- [オンボーディング](/ja-JP/start/onboarding)
- [オンボーディング（CLI）](/ja-JP/start/wizard)
- [セットアップ](/ja-JP/start/setup)
- [ダッシュボード（ローカル Gateway）](http://127.0.0.1:18789/)
- [ヘルプ](/ja-JP/help)
- [ドキュメント一覧](/ja-JP/start/docs-directory)
- [設定](/ja-JP/gateway/configuration)
- [設定例](/ja-JP/gateway/configuration-examples)
- [OpenClaw アシスタント](/ja-JP/start/openclaw)
- [ショーケース](/ja-JP/start/showcase)
- [背景世界](/ja-JP/start/lore)

## インストールと更新

- [Docker](/ja-JP/install/docker)
- [Nix](/ja-JP/install/nix)
- [更新とロールバック](/ja-JP/install/updating)
- [Bun ワークフロー（試験的）](/ja-JP/install/bun)

## コア概念

- [アーキテクチャ](/ja-JP/concepts/architecture)
- [機能](/ja-JP/concepts/features)
- [ネットワークハブ](/ja-JP/network)
- [エージェントランタイム](/ja-JP/concepts/agent)
- [エージェントワークスペース](/ja-JP/concepts/agent-workspace)
- [メモリ](/ja-JP/concepts/memory)
- [エージェントループ](/ja-JP/concepts/agent-loop)
- [ストリーミングとチャンク分割](/ja-JP/concepts/streaming)
- [マルチエージェントルーティング](/ja-JP/concepts/multi-agent)
- [Compaction](/ja-JP/concepts/compaction)
- [セッション](/ja-JP/concepts/session)
- [セッションのプルーニング](/ja-JP/concepts/session-pruning)
- [セッションツール](/ja-JP/concepts/session-tool)
- [キュー](/ja-JP/concepts/queue)
- [スラッシュコマンド](/ja-JP/tools/slash-commands)
- [RPC アダプター](/ja-JP/reference/rpc)
- [TypeBox スキーマ](/ja-JP/concepts/typebox)
- [タイムゾーン処理](/ja-JP/concepts/timezone)
- [プレゼンス](/ja-JP/concepts/presence)
- [検出とトランスポート](/ja-JP/gateway/discovery)
- [Bonjour](/ja-JP/gateway/bonjour)
- [チャンネルルーティング](/ja-JP/channels/channel-routing)
- [グループ](/ja-JP/channels/groups)
- [グループメッセージ](/ja-JP/channels/group-messages)
- [モデルのフェイルオーバー](/ja-JP/concepts/model-failover)
- [OAuth](/ja-JP/concepts/oauth)

## プロバイダーと受信経路

- [チャットチャンネルハブ](/ja-JP/channels)
- [モデルプロバイダーハブ](/ja-JP/providers/models)
- [Discord](/ja-JP/channels/discord)
- [iMessage](/ja-JP/channels/imessage)
- [Mattermost](/ja-JP/channels/mattermost)
- [QQ Bot](/ja-JP/channels/qqbot)
- [Signal](/ja-JP/channels/signal)
- [Slack](/ja-JP/channels/slack)
- [Telegram](/ja-JP/channels/telegram)
- [WebChat](/ja-JP/web/webchat)
- [WhatsApp](/ja-JP/channels/whatsapp)
- [位置情報の解析](/ja-JP/channels/location)
- [Webhook](/ja-JP/automation/cron-jobs#webhooks)
- [Gmail Pub/Sub](/ja-JP/automation/cron-jobs#gmail-pubsub-integration)

## Gateway と運用

- [Gateway 運用手順書](/ja-JP/gateway)
- [ネットワークモデル](/ja-JP/network#core-model)
- [Gateway のペアリング](/ja-JP/gateway/pairing)
- [Gateway のロック](/ja-JP/gateway/gateway-lock)
- [バックグラウンドプロセス](/ja-JP/gateway/background-process)
- [健全性](/ja-JP/gateway/health)
- [Heartbeat](/ja-JP/gateway/heartbeat)
- [診断](/ja-JP/gateway/doctor)
- [ログ記録](/ja-JP/gateway/logging)
- [サンドボックス化](/ja-JP/gateway/sandboxing)
- [ダッシュボード](/ja-JP/web/dashboard)
- [コントロール UI](/ja-JP/web/control-ui)
- [リモートアクセス](/ja-JP/gateway/remote)
- [リモート Gateway の README](/ja-JP/gateway/remote-gateway-readme)
- [Tailscale](/ja-JP/gateway/tailscale)
- [セキュリティ](/ja-JP/gateway/security)
- [トラブルシューティング](/ja-JP/gateway/troubleshooting)

## ツールと自動化

- [ツールサーフェス](/ja-JP/tools)
- [OpenProse](/ja-JP/prose)
- [CLI リファレンス](/ja-JP/cli)
- [実行ツール](/ja-JP/tools/exec)
- [PDF ツール](/ja-JP/tools/pdf)
- [昇格モード](/ja-JP/tools/elevated)
- [Cron ジョブ](/ja-JP/automation/cron-jobs)
- [自動化](/ja-JP/automation)
- [思考と詳細出力](/ja-JP/tools/thinking)
- [モデル](/ja-JP/concepts/models)
- [サブエージェント](/ja-JP/tools/subagents)
- [エージェント送信 CLI](/ja-JP/tools/agent-send)
- [ターミナル UI](/ja-JP/web/tui)
- [ブラウザー制御](/ja-JP/tools/browser)
- [ブラウザー（Linux のトラブルシューティング）](/ja-JP/tools/browser-linux-troubleshooting)
- [投票](/ja-JP/cli/message)

## Node、メディア、音声

- [Node の概要](/ja-JP/nodes)
- [カメラ](/ja-JP/nodes/camera)
- [画像](/ja-JP/nodes/images)
- [音声](/ja-JP/nodes/audio)
- [位置情報コマンド](/ja-JP/nodes/location-command)
- [音声ウェイク](/ja-JP/nodes/voicewake)
- [会話モード](/ja-JP/nodes/talk)

## プラットフォーム

- [プラットフォームの概要](/ja-JP/platforms)
- [macOS](/ja-JP/platforms/macos)
- [iOS](/ja-JP/platforms/ios)
- [Android](/ja-JP/platforms/android)
- [Windows ハブ](/ja-JP/platforms/windows)
- [Linux](/ja-JP/platforms/linux)
- [Web サーフェス](/ja-JP/web)

## macOS コンパニオンアプリ（上級者向け）

- [macOS 開発環境のセットアップ](/ja-JP/platforms/mac/dev-setup)
- [macOS メニューバー](/ja-JP/platforms/mac/menu-bar)
- [macOS 音声ウェイク](/ja-JP/platforms/mac/voicewake)
- [macOS 音声オーバーレイ](/ja-JP/platforms/mac/voice-overlay)
- [macOS WebChat](/ja-JP/platforms/mac/webchat)
- [macOS Canvas](/ja-JP/platforms/mac/canvas)
- [macOS 子プロセス](/ja-JP/platforms/mac/child-process)
- [macOS の健全性](/ja-JP/platforms/mac/health)
- [macOS アイコン](/ja-JP/platforms/mac/icon)
- [macOS ログ記録](/ja-JP/platforms/mac/logging)
- [macOS 権限](/ja-JP/platforms/mac/permissions)
- [macOS リモートアクセス](/ja-JP/platforms/mac/remote)
- [macOS 署名](/ja-JP/platforms/mac/signing)
- [macOS Gateway（launchd）](/ja-JP/platforms/mac/bundled-gateway)
- [macOS XPC](/ja-JP/platforms/mac/xpc)
- [macOS Skills](/ja-JP/platforms/mac/skills)
- [macOS Peekaboo](/ja-JP/platforms/mac/peekaboo)

## Plugin

- [Plugin の概要](/ja-JP/tools/plugin)
- [Plugin の構築](/ja-JP/plugins/building-plugins)
- [Plugin フック](/ja-JP/plugins/hooks)
- [Plugin マニフェスト](/ja-JP/plugins/manifest)
- [エージェントツール](/ja-JP/plugins/building-plugins#registering-agent-tools)
- [Plugin バンドル](/ja-JP/plugins/bundles)
- [ClawHub](/clawhub)
- [機能クックブック](/ja-JP/plugins/adding-capabilities)
- [音声通話 Plugin](/ja-JP/plugins/voice-call)
- [Zalo ユーザー Plugin](/ja-JP/plugins/zalouser)

## ワークスペースとテンプレート

- [Skills](/ja-JP/tools/skills)
- [ClawHub](/clawhub)
- [Skills の設定](/ja-JP/tools/skills-config)
- [デフォルトの AGENTS](/ja-JP/reference/AGENTS.default)
- [テンプレート：AGENTS](/ja-JP/reference/templates/AGENTS)
- [テンプレート：BOOTSTRAP](/ja-JP/reference/templates/BOOTSTRAP)
- [テンプレート：HEARTBEAT](/ja-JP/reference/templates/HEARTBEAT)
- [テンプレート：IDENTITY](/ja-JP/reference/templates/IDENTITY)
- [テンプレート：SOUL](/ja-JP/reference/templates/SOUL)
- [テンプレート：TOOLS](/ja-JP/reference/templates/TOOLS)
- [テンプレート：USER](/ja-JP/reference/templates/USER)

## プロジェクト

- [クレジット](/ja-JP/reference/credits)

## テストとリリース

- [テスト](/ja-JP/reference/test)
- [リリースポリシー](/ja-JP/reference/RELEASING)
- [デバイスモデル](/ja-JP/reference/device-models)

## 関連項目

- [はじめに](/ja-JP/start/getting-started)
