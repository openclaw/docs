---
read_when:
    - オンボーディング手順の選択
    - 新しい環境のセットアップ
sidebarTitle: Onboarding Overview
summary: OpenClaw のオンボーディングオプションとフローの概要
title: オンボーディングの概要
x-i18n:
    generated_at: "2026-07-05T11:51:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 62fdb7768aff55620c6195b8017dd95baa1ef393b03e39e5a07b1a9b9e6ef5a4
    source_path: start/onboarding-overview.md
    workflow: 16
---

OpenClaw には 2 つのオンボーディング経路があります。どちらも認証、Gateway、
任意のチャットチャネルを設定します。違いは、セットアップとのやり取りの方法だけです。

## どちらの経路を使うべきですか？

|                | CLI オンボーディング                  | macOS アプリのオンボーディング |
| -------------- | -------------------------------------- | --------------------------- |
| **プラットフォーム** | macOS、Linux、Windows（ネイティブまたは WSL2） | macOS のみ                  |
| **インターフェイス** | ターミナルウィザード                  | ガイド付き UI + Crestodian チャット |
| **最適な用途** | サーバー、ヘッドレス、完全な制御        | デスクトップ Mac、視覚的なセットアップ |
| **自動化** | スクリプト用の `--non-interactive`        | 手動のみ                 |
| **コマンド**    | `openclaw onboard`                     | アプリを起動              |

ほとんどのユーザーは **CLI オンボーディング** から始めるべきです。どこでも動作し、
最も高い制御性が得られます。

## オンボーディングで設定される内容

どちらの経路を選んでも、オンボーディングでは次をセットアップします。

1. **モデルプロバイダーと認証** — 選択したプロバイダーの API キー、OAuth、またはセットアップトークン
2. **ワークスペース** — エージェントファイル、ブートストラップテンプレート、メモリ用のディレクトリ
3. **Gateway** — ポート、バインドアドレス、認証モード
4. **チャネル**（任意） — Discord、Feishu、Google Chat、iMessage、
   Mattermost、Microsoft Teams、Telegram、WhatsApp などの組み込みおよびバンドルされたチャットチャネル
5. **デーモン**（任意） — Gateway が自動的に起動するようにするバックグラウンドサービス

## CLI オンボーディング

任意のターミナルで実行します。

```bash
openclaw onboard
```

バックグラウンドサービスも 1 ステップでインストールするには、`--install-daemon` を追加します。

完全なリファレンス: [オンボーディング（CLI）](/ja-JP/start/wizard)
CLI コマンドドキュメント: [`openclaw onboard`](/ja-JP/cli/onboard)

## macOS アプリのオンボーディング

OpenClaw アプリを開きます。ローカルセットアップでは、初回実行フローが Gateway を起動し、
既存の AI アクセスを検出し、ワークスペースと設定を提案し、
承認後にプランを適用する Crestodian の会話を開きます。機密性の高い
認証情報にはマスク入力を使用します。リモートセットアップでは、代わりに設定済みの
Gateway に接続します。

完全なリファレンス: [オンボーディング（macOS アプリ）](/ja-JP/start/onboarding)

## カスタムまたは未掲載のプロバイダー

プロバイダーがオンボーディングに掲載されていない場合は、**カスタムプロバイダー** を選択して
次を入力します。

- エンドポイント互換性: OpenAI 互換（`/chat/completions`）、OpenAI Responses 互換（`/responses`）、Anthropic 互換（`/messages`）、または不明（3 つすべてをプローブして自動検出）
- ベース URL と API キー（エンドポイントで不要な場合、API キーは任意）
- モデル ID と任意のモデルエイリアス

複数のカスタムエンドポイントを共存させることができます。それぞれに独自のエンドポイント ID が割り当てられます。

## 関連

- [はじめに](/ja-JP/start/getting-started)
- [CLI セットアップリファレンス](/ja-JP/start/wizard-cli-reference)
