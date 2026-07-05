---
read_when:
    - オンボーディング パスの選択
    - 新しい環境のセットアップ
sidebarTitle: Onboarding Overview
summary: OpenClaw のオンボーディングオプションとフローの概要
title: オンボーディングの概要
x-i18n:
    generated_at: "2026-07-05T17:42:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c41a83d23341504ef8c8279530c33a7e9b73c466eb7128775756acd800849e61
    source_path: start/onboarding-overview.md
    workflow: 16
---

OpenClaw には2つのオンボーディング経路があります。どちらも認証、Gateway、
任意のチャットチャネルを設定します。違いは、セットアップとのやり取りの方法だけです。

## どちらの経路を使うべきですか？

|                | CLIオンボーディング                         | macOSアプリのオンボーディング        |
| -------------- | -------------------------------------- | --------------------------- |
| **プラットフォーム**  | macOS、Linux、Windows（ネイティブまたは WSL2） | macOSのみ                  |
| **インターフェイス**  | ターミナルウィザード                        | ガイド付きUI + Crestodianチャット |
| **最適な用途**   | サーバー、ヘッドレス、完全な制御        | デスクトップMac、視覚的なセットアップ   |
| **自動化** | スクリプト用の `--non-interactive`        | 手動のみ                 |
| **コマンド**    | `openclaw onboard`                     | アプリを起動              |

ほとんどのユーザーは **CLIオンボーディング** から始めるべきです。どこでも動作し、
最も細かく制御できます。

## オンボーディングで設定される内容

どちらの経路を選んでも、オンボーディングでは次をセットアップします。

1. **モデルプロバイダーと認証** — 選択したプロバイダー用のAPIキー、OAuth、またはセットアップトークン
2. **ワークスペース** — エージェントファイル、ブートストラップテンプレート、メモリ用のディレクトリ
3. **Gateway** — ポート、バインドアドレス、認証モード
4. **チャネル**（任意）— Discord、Feishu、Google Chat、iMessage、Mattermost、Microsoft Teams、
   Telegram、WhatsApp などの組み込みおよびバンドル済みチャットチャネル
5. **デーモン**（任意）— Gatewayが自動的に起動するようにするバックグラウンドサービス

## CLIオンボーディング

任意のターミナルで実行します。

```bash
openclaw onboard
```

`--install-daemon` を追加すると、バックグラウンドサービスも1ステップでインストールできます。

完全なリファレンス: [オンボーディング（CLI）](/ja-JP/start/wizard)
CLIコマンドドキュメント: [`openclaw onboard`](/ja-JP/cli/onboard)

## macOSアプリのオンボーディング

OpenClawアプリを開きます。ローカルセットアップでは、初回実行フローがGatewayを起動し、
既存のAIアクセス（Claude Code、Codex、Gemini CLI、またはAPIキー）を検出し、
最適なオプションをライブテストして、実際の応答が返った後にのみ保存します。何も見つからない場合は
自動的にフォールバックし、検証済みの手動APIキー手順を提示します。機密認証情報にはマスク入力を使用します。
リモートセットアップでは、代わりに設定済みのGatewayに接続し、同じAIチェックをそのGatewayに対して実行します。

完全なリファレンス: [オンボーディング（macOSアプリ）](/ja-JP/start/onboarding)

## カスタムまたは未掲載のプロバイダー

プロバイダーがオンボーディングに表示されない場合は、**カスタムプロバイダー** を選択し、
次を入力します。

- エンドポイント互換性: OpenAI互換（`/chat/completions`）、OpenAI Responses互換（`/responses`）、Anthropic互換（`/messages`）、または不明（3つすべてをプローブして自動検出）
- ベースURLとAPIキー（エンドポイントがAPIキーを必要としない場合、APIキーは任意）
- モデルIDと任意のモデルエイリアス

複数のカスタムエンドポイントは共存できます。それぞれに独自のエンドポイントIDが割り当てられます。

## 関連

- [はじめに](/ja-JP/start/getting-started)
- [CLIセットアップリファレンス](/ja-JP/start/wizard-cli-reference)
