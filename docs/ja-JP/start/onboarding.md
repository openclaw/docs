---
read_when:
    - macOS オンボーディングアシスタントの設計
    - 認証またはアイデンティティ設定の実装
sidebarTitle: 'Onboarding: macOS App'
summary: OpenClaw の初回起動時セットアップフロー（macOSアプリ）
title: オンボーディング (macOSアプリ)
x-i18n:
    generated_at: "2026-05-06T09:10:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6dc7ebea5de7b1398d7b64c00245255c59af8a7ef51315cdd0ef1cb4898a41a4
    source_path: start/onboarding.md
    workflow: 16
---

このドキュメントでは、**現在の**初回起動セットアップフローについて説明します。目的は、
Gateway の実行場所を選び、認証を接続し、ウィザードを実行して、エージェントが自分自身をブートストラップできるようにする、スムーズな「day 0」体験を提供することです。
オンボーディング経路の一般的な概要については、[オンボーディング概要](/ja-JP/start/onboarding-overview)を参照してください。

<Steps>
<Step title="macOS の警告を承認">
<Frame>
<img src="/assets/macos-onboarding/01-macos-warning.jpeg" alt="" />
</Frame>
</Step>
<Step title="ローカルネットワークの検出を承認">
<Frame>
<img src="/assets/macos-onboarding/02-local-networks.jpeg" alt="" />
</Frame>
</Step>
<Step title="ようこそ画面とセキュリティ通知">
<Frame caption="表示されたセキュリティ通知を読み、それに応じて判断してください">
<img src="/assets/macos-onboarding/03-security-notice.png" alt="" />
</Frame>

セキュリティ信頼モデル:

- デフォルトでは、OpenClaw は個人用エージェントです。つまり、信頼された単一のオペレーター境界です。
- 共有/マルチユーザー構成ではロックダウンが必要です（信頼境界を分離し、ツールアクセスを最小限に保ち、[セキュリティ](/ja-JP/gateway/security)に従ってください）。
- ローカルオンボーディングでは、新しい設定のデフォルトが `tools.profile: "coding"` になりました。これにより、新規のローカル構成では、制限のない `full` プロファイルを強制せずにファイルシステム/ランタイムツールを維持できます。
- hooks/webhooks やその他の信頼できないコンテンツフィードを有効にする場合は、強力な最新モデル階層を使用し、厳格なツールポリシー/サンドボックス化を維持してください。

</Step>
<Step title="ローカルとリモート">
<Frame>
<img src="/assets/macos-onboarding/04-choose-gateway.png" alt="" />
</Frame>

**Gateway** はどこで実行されますか？

- **この Mac（ローカルのみ）:** オンボーディングで認証を設定し、認証情報をローカルに書き込めます。
- **リモート（SSH/Tailnet 経由）:** オンボーディングではローカル認証を設定しません。
  認証情報は Gateway ホスト上に存在している必要があります。
- **後で設定:** セットアップをスキップし、アプリを未設定のままにします。

<Tip>
**Gateway 認証のヒント:**

- ウィザードは loopback でも**トークン**を生成するようになったため、ローカル WS クライアントは認証が必要です。
- 認証を無効にすると、任意のローカルプロセスが接続できます。完全に信頼されたマシンでのみ使用してください。
- 複数マシンからのアクセスや非 loopback バインドには**トークン**を使用してください。

</Tip>
</Step>
<Step title="権限">
<Frame caption="OpenClaw に付与する権限を選択してください">
<img src="/assets/macos-onboarding/05-permissions.png" alt="" />
</Frame>

オンボーディングでは、以下に必要な TCC 権限を要求します:

- 自動化（AppleScript）
- 通知
- アクセシビリティ
- 画面収録
- マイク
- 音声認識
- カメラ
- 位置情報

</Step>
<Step title="CLI">
  <Info>このステップは任意です</Info>
  アプリは npm、pnpm、または bun 経由でグローバル `openclaw` CLI をインストールできます。
  まず npm を優先し、次に pnpm、検出されたパッケージマネージャーがそれだけの場合は bun を使用します。
  Gateway ランタイムでは、Node が引き続き推奨される経路です。
</Step>
<Step title="オンボーディングチャット（専用セッション）">
  セットアップ後、アプリは専用のオンボーディングチャットセッションを開き、エージェントが
  自己紹介を行い、次のステップを案内できるようにします。これにより、初回起動時のガイダンスを
  通常の会話から分離できます。最初のエージェント実行時に Gateway ホスト上で何が起きるかについては、[ブートストラップ](/ja-JP/start/bootstrapping)を参照してください。
</Step>
</Steps>

## 関連

- [オンボーディング概要](/ja-JP/start/onboarding-overview)
- [はじめに](/ja-JP/start/getting-started)
