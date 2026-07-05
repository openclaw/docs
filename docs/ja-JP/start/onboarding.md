---
read_when:
    - macOS オンボーディングアシスタントの設計
    - 認証または ID 設定の実装
sidebarTitle: 'Onboarding: macOS App'
summary: OpenClaw（macOSアプリ）の初回セットアップフロー
title: オンボーディング（macOS アプリ）
x-i18n:
    generated_at: "2026-07-05T11:51:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cc363e013ae9921e9fde489ca856739037dd8b19bdcef55cf0466171968159af
    source_path: start/onboarding.md
    workflow: 16
---

macOS アプリの初回起動フロー: Gateway を実行する場所を選び、Crestodian との会話を通じてローカル
セットアップを完了し、権限を付与してから、
エージェント自身のブートストラップ手順へ引き継ぎます。
CLI オンボーディングと両方のパスの比較については、[オンボーディング概要](/ja-JP/start/onboarding-overview)を参照してください。

<Steps>
<Step title="macOS 警告を承認する">
<Frame>
<img src="/assets/macos-onboarding/01-macos-warning.jpeg" alt="" />
</Frame>
</Step>
<Step title="ローカルネットワークの検出を承認する">
<Frame>
<img src="/assets/macos-onboarding/02-local-networks.jpeg" alt="" />
</Frame>
</Step>
<Step title="ようこそ画面とセキュリティ通知">
<Frame caption="表示されたセキュリティ通知を読み、それに応じて判断してください">
<img src="/assets/macos-onboarding/03-security-notice.png" alt="" />
</Frame>

セキュリティ信頼モデル:

- デフォルトでは、OpenClaw は個人用エージェントです: 信頼済みオペレーター 1 人の境界です。
- 共有/マルチユーザーのセットアップにはロックダウンが必要です: 信頼境界を分離し、ツールアクセスを最小限に抑え、[セキュリティ](/ja-JP/gateway/security)に従ってください。
- ローカルオンボーディングでは、新しい設定のデフォルトが `tools.profile: "coding"` になるため、新規セットアップでは無制限の `full` プロファイルを使わずにファイルシステム/ランタイムツールを維持できます。
- フック/Webhook やその他の信頼できないコンテンツフィードを有効にする場合は、強力な最新モデル層を使用し、厳格なツールポリシー/サンドボックス化を維持してください。

</Step>
<Step title="ローカルとリモート">
<Frame>
<img src="/assets/macos-onboarding/04-choose-gateway.png" alt="" />
</Frame>

**Gateway** はどこで実行しますか？

- **この Mac（ローカルのみ）:** オンボーディングは認証を設定し、認証情報をローカルに書き込みます。
- **リモート（SSH/Tailnet 経由）:** オンボーディングはローカル認証を設定しません。
  認証情報は Gateway ホストに既に存在している必要があります。リモート Gateway トークン
  フィールドには、macOS アプリがその Gateway に接続するために使用するトークンが保存されます。
  既存の `gateway.remote.token` SecretRef 値は、置き換えるまで保持されます。
- **後で設定:** セットアップをスキップし、アプリを未設定のままにします。

<Tip>
**Gateway 認証のヒント:**

- Gateway 認証モードは、ループバックバインドでもデフォルトで `token` になるため、ローカル WS クライアントは認証が必要です。
- `gateway.auth.mode: "none"` を設定すると、任意のローカルプロセスが接続できるようになります。完全に信頼できるマシンでのみ使用してください。
- 複数マシンからのアクセスや非ループバックバインドにはトークンを使用してください。

</Tip>
</Step>
<Step title="CLI">
  ローカルセットアップは、npm、pnpm、または bun 経由でグローバル `openclaw` CLI をインストールし、
  npm を最優先します。Node は Gateway
  自体の推奨ランタイムのままです。既存の互換インストールは再利用されます。
</Step>
<Step title="Crestodian と話す">
  ローカルセットアップは、Gateway
  の準備ができた後に Crestodian との専用会話を開きます。Crestodian は既存の Claude Code または Codex ログインと
  サポート対象の API キーを検出し、ワークスペースと設定を提案してから、
  何かを書き込む前に承認を待ちます。会話がセットアップ状態を作成するまで、次へ進む操作は
  ロックされたままです。認証情報プロンプトはマスク入力を使用します。
  あいまいなトランスポート障害の後は、前のターンを再生するのではなく、
  セットアップ会話を再開してください。

リモートと後で設定のフローでは、このローカルセットアップ会話はスキップされます。
</Step>
<Step title="権限">

<Frame caption="OpenClaw に付与する権限を選択してください">
<img src="/assets/macos-onboarding/05-permissions.png" alt="" />
</Frame>

オンボーディングは、次の TCC 権限を要求します: オートメーション（AppleScript）、通知、アクセシビリティ、画面収録、マイク、音声認識、カメラ、位置情報。

</Step>
<Step title="オンボーディングチャット（専用セッション）">
  セットアップ後、アプリは別個のエージェントオンボーディングチャットを開きます。これにより、エージェントは
  自己紹介を行い、そのやり取りを通常の会話履歴に混ぜることなく
  次の手順を案内できます。これは Crestodian のセットアップ会話の後に続くものであり、
  それを置き換えるものではありません。エージェントの最初の実際のターン中に Gateway ホストで
  何が起こるかについては、[ブートストラップ](/ja-JP/start/bootstrapping)を参照してください。
</Step>
</Steps>

## 関連

- [オンボーディング概要](/ja-JP/start/onboarding-overview)
- [はじめに](/ja-JP/start/getting-started)
