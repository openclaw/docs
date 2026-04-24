---
read_when:
    - オンボーディング経路を選ぶこと
    - 新しい環境をセットアップすること
sidebarTitle: Onboarding Overview
summary: OpenClaw のオンボーディングオプションとフローの概要
title: オンボーディング概要
x-i18n:
    generated_at: "2026-04-24T05:21:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3a161e504f94c633873a497dd97c971ebfed6f31ef23a3fe9e85eec5a06d1d97
    source_path: start/onboarding-overview.md
    workflow: 15
---

OpenClaw には 2 つのオンボーディング経路があります。どちらも auth、Gateway、
任意のチャットチャンネルを設定します。違いはセットアップとの対話方法だけです。

## どの経路を使うべきですか？

|                | CLI オンボーディング | macOS アプリのオンボーディング |
| -------------- | -------------------------------------- | ------------------------- |
| **対応プラットフォーム** | macOS、Linux、Windows（ネイティブまたは WSL2） | macOS のみ |
| **インターフェース** | ターミナルウィザード | アプリ内のガイド付き UI |
| **最適な用途** | サーバー、ヘッドレス、完全な制御 | デスクトップ Mac、視覚的セットアップ |
| **自動化** | スクリプト向けに `--non-interactive` 対応 | 手動のみ |
| **コマンド** | `openclaw onboard` | アプリを起動 |

ほとんどのユーザーは **CLI オンボーディング** から始めるべきです。どこでも動作し、
最も高い制御性があります。

## オンボーディングで設定されるもの

どちらの経路を選んでも、オンボーディングでは次を設定します。

1. **モデルプロバイダーと auth** — 選択した provider 向けの API key、OAuth、または setup token
2. **workspace** — エージェントファイル、bootstrap テンプレート、メモリ用ディレクトリ
3. **Gateway** — port、bind address、auth mode
4. **チャンネル**（任意） — BlueBubbles、Discord、Feishu、Google Chat、Mattermost、Microsoft Teams、
   Telegram、WhatsApp などの組み込み/同梱チャットチャンネル
5. **daemon**（任意） — Gateway が自動起動するようにするバックグラウンド service

## CLI オンボーディング

任意のターミナルで実行します。

```bash
openclaw onboard
```

バックグラウンド service も 1 ステップでインストールするには `--install-daemon` を追加します。

完全なリファレンス: [Onboarding (CLI)](/ja-JP/start/wizard)
CLI コマンド docs: [`openclaw onboard`](/ja-JP/cli/onboard)

## macOS アプリのオンボーディング

OpenClaw アプリを開きます。初回起動ウィザードが、同じ手順を
視覚的インターフェースで案内します。

完全なリファレンス: [Onboarding (macOS App)](/ja-JP/start/onboarding)

## custom または一覧にない provider

provider がオンボーディング一覧にない場合は、**Custom Provider** を選び、次を入力してください。

- API 互換モード（OpenAI-compatible、Anthropic-compatible、または auto-detect）
- Base URL と API key
- model ID と任意の alias

複数の custom endpoint を共存させることができ、それぞれに独自の endpoint ID が与えられます。

## 関連

- [Getting started](/ja-JP/start/getting-started)
- [CLI setup reference](/ja-JP/start/wizard-cli-reference)
