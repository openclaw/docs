---
read_when:
    - macOS オンボーディングアシスタントの設計
    - 認証または ID セットアップの実装
sidebarTitle: 'Onboarding: macOS App'
summary: OpenClaw（macOSアプリ）の初回実行セットアップフロー
title: オンボーディング（macOS アプリ）
x-i18n:
    generated_at: "2026-07-05T17:41:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2784a013164bd07780378915643c1409bfe2217eb15ec5da3992d6d60c69bf59
    source_path: start/onboarding.md
    workflow: 16
---

macOS アプリの初回起動フロー: Gateway の実行場所を選び、検証済みの AI バックエンドに接続し、権限を付与して、エージェント自身のブートストラップ手順へ引き継ぎます。
CLI オンボーディングと両方の経路の比較については、[オンボーディング概要](/ja-JP/start/onboarding-overview) を参照してください。

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
<Step title="ようこそとセキュリティ通知">
<Frame caption="表示されたセキュリティ通知を読み、それに応じて判断してください">
<img src="/assets/macos-onboarding/03-security-notice.png" alt="" />
</Frame>

セキュリティ信頼モデル:

- デフォルトでは、OpenClaw は個人用エージェントです: 1 つの信頼済みオペレーター境界です。
- 共有/マルチユーザー構成にはロックダウンが必要です: 信頼境界を分割し、ツールアクセスを最小限に保ち、[セキュリティ](/ja-JP/gateway/security) に従ってください。
- ローカルオンボーディングでは、新しい設定のデフォルトが `tools.profile: "coding"` になり、新規構成では制限のない `full` プロファイルなしでファイルシステム/ランタイムツールを維持します。
- フック/Webhook やその他の信頼できないコンテンツフィードを有効にする場合は、強力な最新モデル層を使用し、厳格なツールポリシー/サンドボックス化を維持してください。

</Step>
<Step title="ローカルとリモート">
<Frame>
<img src="/assets/macos-onboarding/04-choose-gateway.png" alt="" />
</Frame>

**Gateway** はどこで実行されますか？

- **この Mac（ローカルのみ）:** オンボーディングは認証を設定し、認証情報をローカルに書き込みます。
- **リモート（SSH/Tailnet 経由）:** オンボーディングはローカル認証を設定しません。
  認証情報は gateway ホストにすでに存在している必要があります。リモート gateway トークン
  フィールドには、macOS アプリがその Gateway に接続するために使用するトークンが保存されます。
  既存の `gateway.remote.token` SecretRef 値は、置き換えるまで保持されます。
- **あとで設定:** セットアップをスキップし、アプリを未設定のままにします。

<Tip>
**Gateway 認証のヒント:**

- Gateway 認証モードは、ループバックバインドでもデフォルトで `token` になるため、ローカル WS クライアントは認証が必要です。
- `gateway.auth.mode: "none"` を設定すると、任意のローカルプロセスが接続できます。完全に信頼できるマシンでのみ使用してください。
- 複数マシンからのアクセスや非ループバックバインドにはトークンを使用してください。

</Tip>
</Step>
<Step title="CLI">
  ローカルセットアップは、npm、pnpm、または bun 経由でグローバル `openclaw` CLI をインストールし、
  まず npm を優先します。Gateway 自体の推奨ランタイムは引き続き Node です。
  既存の互換性のあるインストールは再利用されます。
</Step>
<Step title="AI を接続">
  Gateway の準備ができると、オンボーディングはすでに利用できる AI アクセスを探します:
  Claude Code、Codex、または Gemini CLI ログイン、または `OPENAI_API_KEY` /
  `ANTHROPIC_API_KEY` です。最適な選択肢は実際の補完でテストされ、
  応答した後にのみ保存されます。テストが失敗すると、アプリは自動的に
  次の選択肢を試し、前の選択肢が失敗した理由を表示します。複数の選択肢が
  見つかった場合は、続行する前にそれらを切り替えられます。

何も見つからない場合（または何も動作しない場合）は、手動ステップで
Anthropic、OpenAI、または Google の API キーを受け付け、同じ方法で検証し、
認証プロファイルとして保存します。1 つのバックエンドがライブテストに合格するまで
「次へ」はロックされたままなので、最初のエージェントチャットが動作する推論なしに
開始されることはありません。Crestodian チャットは、このページから（後で
設定 → Crestodian からも）平易な言葉でのヘルプとして引き続き利用できます。

「あとで設定」はこのステップをスキップします。
</Step>
<Step title="権限">

<Frame caption="OpenClaw に付与する権限を選択してください">
<img src="/assets/macos-onboarding/05-permissions.png" alt="" />
</Frame>

オンボーディングは、Automation（AppleScript）、Notifications、Accessibility、Screen Recording、Microphone、Speech Recognition、Camera、Location の TCC 権限を要求します。

</Step>
<Step title="オンボーディングチャット（専用セッション）">
  セットアップ後、アプリは別個のエージェントオンボーディングチャットを開きます。これにより、エージェントは
  通常の会話履歴にそのやり取りを混ぜずに、自己紹介を行い、次のステップを案内できます。
  これは Crestodian セットアップ会話の後に続くものであり、それを置き換えるものではありません。
  エージェントの最初の実際のターン中に gateway ホストで何が起こるかについては、
  [ブートストラップ](/ja-JP/start/bootstrapping) を参照してください。
</Step>
</Steps>

## 関連

- [オンボーディング概要](/ja-JP/start/onboarding-overview)
- [はじめに](/ja-JP/start/getting-started)
