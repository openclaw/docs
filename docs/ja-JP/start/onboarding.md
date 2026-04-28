---
read_when:
    - macOS のオンボーディングアシスタントを設計する場合
    - 認証や identity 設定を実装する場合
sidebarTitle: 'Onboarding: macOS App'
summary: OpenClaw の初回セットアップフロー（macOS アプリ）
title: オンボーディング（macOS アプリ）
x-i18n:
  refreshed_at: '2026-04-28T04:45:00Z'
    generated_at: "2026-04-24T05:21:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: aa516f8f5b4c7318f27a5af4e7ac12f5685aef6f84579a68496c2497d6f9041d
    source_path: start/onboarding.md
    workflow: 15
---

このドキュメントでは、**現在の** 初回セットアップフローを説明します。目標は、
スムーズな「day 0」体験です: Gateway をどこで動かすかを選び、認証を接続し、wizard を実行し、
エージェントに自分自身を bootstrap させます。
オンボーディング経路全体の概要については [Onboarding Overview](/ja-JP/start/onboarding-overview) を参照してください。

<Steps>
<Step title="macOS 警告を承認する">
<Frame>
<img src="/assets/macos-onboarding/01-macos-warning.jpeg" alt="" />
</Frame>
</Step>
<Step title="ローカルネットワーク検出を承認する">
<Frame>
<img src="/assets/macos-onboarding/02-local-networks.jpeg" alt="" />
</Frame>
</Step>
<Step title="Welcome とセキュリティ通知">
<Frame caption="表示されるセキュリティ通知を読み、それに応じて判断してください">
<img src="/assets/macos-onboarding/03-security-notice.png" alt="" />
</Frame>

セキュリティ信頼モデル:

- デフォルトでは、OpenClaw は個人用エージェントです: 1 つの信頼された operator boundary。
- 共有/複数ユーザー構成には lock-down が必要です（trust boundary を分離し、tool access は最小限に保ち、[Security](/ja-JP/gateway/security) に従ってください）。
- ローカルオンボーディングは現在、新しい config のデフォルトを `tools.profile: "coding"` にしているため、新規ローカルセットアップでは unrestricted な `full` プロファイルを強制せずに filesystem/runtime tools を維持します。
- hooks/webhooks やその他の信頼できないコンテンツ feed を有効にする場合は、強力で現代的なモデル tier を使い、厳格な tool policy/sandboxing を維持してください。

</Step>
<Step title="Local vs Remote">
<Frame>
<img src="/assets/macos-onboarding/04-choose-gateway.png" alt="" />
</Frame>

**Gateway** はどこで動作しますか？

- **This Mac（Local only）:** オンボーディングで認証設定と認証情報のローカル書き込みができます。
- **Remote（over SSH/Tailnet）:** オンボーディングではローカル認証は設定しません。認証情報は gateway host 側に存在している必要があります。
- **Configure later:** セットアップをスキップし、アプリを未設定のままにします。

<Tip>
**Gateway auth のヒント:**

- wizard は現在、loopback であっても **token** を生成するため、ローカル WS クライアントも認証が必要です。
- 認証を無効にすると、任意のローカルプロセスが接続できます。これは完全に信頼できるマシンでのみ使用してください。
- マルチマシンアクセスまたは non-loopback bind には **token** を使ってください。

</Tip>
</Step>
<Step title="権限">
<Frame caption="OpenClaw に与えたい権限を選んでください">
<img src="/assets/macos-onboarding/05-permissions.png" alt="" />
</Frame>

オンボーディングは、次に必要な TCC 権限を要求します:

- Automation（AppleScript）
- Notifications
- Accessibility
- Screen Recording
- Microphone
- Speech Recognition
- Camera
- Location

</Step>
<Step title="CLI">
  <Info>このステップは任意です</Info>
  アプリは npm、pnpm、または bun を使ってグローバル `openclaw` CLI をインストールできます。
  npm を最優先し、次に pnpm、検出された
  パッケージマネージャーがそれしかない場合のみ bun を使います。Gateway ランタイムについては、引き続き Node が推奨経路です。
</Step>
<Step title="オンボーディングチャット（専用セッション）">
  セットアップ後、アプリは専用のオンボーディングチャットセッションを開き、エージェントが
  自己紹介し、次のステップを案内できるようにします。これにより、初回実行ガイダンスが通常の会話から分離されます。最初の agent 実行中に gateway host 上で何が起きるかについては
  [Bootstrapping](/ja-JP/start/bootstrapping) を参照してください。
</Step>
</Steps>

## 関連

- [Onboarding overview](/ja-JP/start/onboarding-overview)
- [はじめに](/ja-JP/start/getting-started)
