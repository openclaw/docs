---
read_when:
    - macOS オンボーディングアシスタントの設計
    - 認証または ID 設定の実装
sidebarTitle: 'Onboarding: macOS App'
summary: OpenClaw の初回起動セットアップフロー（macOS アプリ）
title: オンボーディング（macOS アプリ）
x-i18n:
    generated_at: "2026-06-27T13:05:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 73f902bcbb7ef782d4a5fbe442a8855a8fcb426d45167c4d2fc1fc050263b5f1
    source_path: start/onboarding.md
    workflow: 16
---

このドキュメントでは、**現在の**初回セットアップフローについて説明します。目標は、
滑らかな「0日目」体験です。Gateway を実行する場所を選び、認証を接続し、ウィザードを実行して、エージェントが自分自身をブートストラップできるようにします。
オンボーディング経路の一般的な概要については、[オンボーディング概要](/ja-JP/start/onboarding-overview)を参照してください。

<Steps>
<Step title="macOS 警告を承認">
<Frame>
<img src="/assets/macos-onboarding/01-macos-warning.jpeg" alt="" />
</Frame>
</Step>
<Step title="ローカルネットワークの検出を承認">
<Frame>
<img src="/assets/macos-onboarding/02-local-networks.jpeg" alt="" />
</Frame>
</Step>
<Step title="ようこそとセキュリティ通知">
<Frame caption="表示されたセキュリティ通知を読み、それに応じて判断します">
<img src="/assets/macos-onboarding/03-security-notice.png" alt="" />
</Frame>

セキュリティ信頼モデル:

- デフォルトでは、OpenClaw は個人用エージェントです。つまり、信頼されるオペレーター境界は 1 つです。
- 共有/マルチユーザーセットアップにはロックダウンが必要です（信頼境界を分離し、ツールアクセスを最小限に保ち、[セキュリティ](/ja-JP/gateway/security)に従ってください）。
- ローカルオンボーディングでは、新しい設定のデフォルトが `tools.profile: "coding"` になりました。そのため、新しいローカルセットアップでは、制限なしの `full` プロファイルを強制せずにファイルシステム/ランタイムツールを保持できます。
- フック/Webhook またはその他の信頼されていないコンテンツフィードを有効にする場合は、強力な最新モデル階層を使用し、厳格なツールポリシー/サンドボックス化を維持してください。

</Step>
<Step title="ローカルとリモート">
<Frame>
<img src="/assets/macos-onboarding/04-choose-gateway.png" alt="" />
</Frame>

**Gateway** はどこで実行しますか？

- **この Mac（ローカルのみ）:** オンボーディングで認証を設定し、認証情報をローカルに書き込めます。
- **リモート（SSH/Tailnet 経由）:** オンボーディングではローカル認証は設定されません。
  認証情報は Gateway ホスト上に存在している必要があります。リモート Gateway トークンフィールドには、macOS アプリがその Gateway に接続するために使用するトークンが保存されます。既存の非プレーンテキストの `gateway.remote.token` 値は、置き換えるまで保持されます。
- **後で設定:** セットアップをスキップし、アプリを未設定のままにします。

<Tip>
**Gateway 認証のヒント:**

- ウィザードは loopback の場合でも**トークン**を生成するようになったため、ローカル WS クライアントは認証する必要があります。
- 認証を無効にすると、任意のローカルプロセスが接続できます。完全に信頼できるマシンでのみ使用してください。
- 複数マシンからのアクセスや非 loopback バインドには**トークン**を使用してください。

</Tip>
</Step>
<Step title="権限">
<Frame caption="OpenClaw に付与する権限を選択します">
<img src="/assets/macos-onboarding/05-permissions.png" alt="" />
</Frame>

オンボーディングでは、次に必要な TCC 権限を要求します。

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
  <Info>この手順は任意です</Info>
  アプリは npm、pnpm、または bun 経由でグローバル `openclaw` CLI をインストールできます。
  npm を最初に優先し、次に pnpm、検出されたパッケージマネージャーが bun のみの場合は bun を使用します。
  Gateway ランタイムでは、Node が引き続き推奨パスです。
</Step>
<Step title="オンボーディングチャット（専用セッション）">
  セットアップ後、アプリは専用のオンボーディングチャットセッションを開き、エージェントが
  自己紹介し、次の手順を案内できるようにします。これにより、初回実行時のガイダンスを
  通常の会話から分離できます。最初のエージェント実行中に Gateway ホストで何が起きるかについては、
  [ブートストラップ](/ja-JP/start/bootstrapping)を参照してください。
</Step>
</Steps>

## 関連

- [オンボーディング概要](/ja-JP/start/onboarding-overview)
- [はじめに](/ja-JP/start/getting-started)
