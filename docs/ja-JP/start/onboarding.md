---
read_when:
    - macOS オンボーディングアシスタントの設計
    - 認証または ID 設定の実装
sidebarTitle: 'Onboarding: macOS App'
summary: OpenClaw の初回セットアップフロー（macOS アプリ）
title: オンボーディング（macOS アプリ）
x-i18n:
    generated_at: "2026-07-06T21:54:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1cdd8600b0d86ec598266671715cebbbe1c86e951b6a95b3e166f2309d2a9130
    source_path: start/onboarding.md
    workflow: 16
---

macOS アプリの初回起動フロー: Gateway を実行する場所を選択し、検証済みの AI バックエンドに接続し、権限を付与して、エージェント自身のブートストラップ儀式へ引き継ぎます。
CLI オンボーディングと両方の経路の比較については、[オンボーディング概要](/ja-JP/start/onboarding-overview) を参照してください。

<Steps>
<Step title="macOS 警告を承認">
<Frame>
<img src="/assets/macos-onboarding/01-macos-warning.jpeg" alt="" />
</Frame>
</Step>
<Step title="ローカルネットワークの検索を承認">
<Frame>
<img src="/assets/macos-onboarding/02-local-networks.jpeg" alt="" />
</Frame>
</Step>
<Step title="ようこそとセキュリティ通知">
<Frame caption="表示されたセキュリティ通知を読み、それに応じて判断してください">
<img src="/assets/macos-onboarding/03-security-notice.png" alt="" />
</Frame>

セキュリティ信頼モデル:

- デフォルトでは、OpenClaw は個人用エージェントです: 信頼できるオペレーター 1 人の境界です。
- 共有/マルチユーザー構成にはロックダウンが必要です: 信頼境界を分離し、ツールアクセスを最小限に保ち、[セキュリティ](/ja-JP/gateway/security) に従ってください。
- ローカルオンボーディングでは、新しい設定のデフォルトが `tools.profile: "coding"` になるため、新規構成では無制限の `full` プロファイルを使わずにファイルシステム/ランタイムツールを維持できます。
- フック/Webhook やその他の信頼できないコンテンツフィードを有効にする場合は、強力な最新モデル層を使用し、厳格なツールポリシー/サンドボックス化を維持してください。

</Step>
<Step title="ローカルとリモート">
<Frame>
<img src="/assets/macos-onboarding/04-choose-gateway.png" alt="" />
</Frame>

**Gateway** はどこで実行しますか？

- **この Mac (ローカルのみ):** オンボーディングは認証を設定し、認証情報をローカルに書き込みます。
- **リモート (SSH/Tailnet 経由):** オンボーディングはローカル認証を設定しません。
  認証情報は Gateway ホストにすでに存在している必要があります。リモート Gateway トークン
  フィールドには、macOS アプリがその Gateway に接続するために使用するトークンを保存します。
  既存の `gateway.remote.token` SecretRef 値は、置き換えるまで保持されます。
- **後で設定:** セットアップをスキップし、アプリを未設定のままにします。

<Tip>
**Gateway 認証のヒント:**

- Gateway 認証モードは、ループバックバインドでもデフォルトで `token` になるため、ローカル WS クライアントは認証する必要があります。
- `gateway.auth.mode: "none"` を設定すると、任意のローカルプロセスが接続できます。完全に信頼できるマシンでのみ使用してください。
- 複数マシンからのアクセスや非ループバックバインドにはトークンを使用してください。

</Tip>
</Step>
<Step title="CLI">
  ローカルセットアップでは、npm、pnpm、または bun を使ってグローバル `openclaw` CLI をインストールし、
  npm を最初に優先します。Gateway
  自体の推奨ランタイムは引き続き Node です。既存の互換性のあるインストールは再利用されます。
</Step>
<Step title="AI を接続">
  Gateway の準備ができると、オンボーディングはすでに持っている AI アクセスを探します:
  Claude Code、Codex、Gemini CLI のログイン、または `OPENAI_API_KEY` /
  `ANTHROPIC_API_KEY` です。最適なオプションは実際の補完でテストされ、
  応答した後にのみ保存されます。テストが失敗すると、アプリは自動的に
  次のオプションを試し、前のオプションが失敗した理由を表示します。複数のオプションが
  見つかった場合は、続行する前にそれらを切り替えられます。

何も見つからない場合 (またはどれも動作しない場合)、手動キー/トークン選択画面は固定のアプリ
リストではなく、Gateway のアクティブなテキスト推論プロバイダー Plugin を読み込みます。
選択したプロバイダーはスターターモデルと設定を提供します。OpenClaw は
同じライブテストで認証情報を検証してから、その認証プロファイルを保存します。次へ
は 1 つのバックエンドが合格するまでロックされたままなので、動作する推論なしでは最初のエージェントチャットを
開始できません。Crestodian チャットはこの
ページから (後で 設定 → Crestodian からも) 平易な言葉でのヘルプとして利用できます。

後で設定を選択すると、この手順をスキップします。
</Step>
<Step title="権限">

<Frame caption="OpenClaw に付与する権限を選択してください">
<img src="/assets/macos-onboarding/05-permissions.png" alt="" />
</Frame>

オンボーディングは、Automation (AppleScript)、通知、アクセシビリティ、画面収録、マイク、音声認識、カメラ、位置情報の TCC 権限を要求します。

</Step>
<Step title="オンボーディングチャット (専用セッション)">
  セットアップ後、アプリは別のエージェントオンボーディングチャットを開き、エージェントが
  自己紹介し、そのやり取りを通常の会話履歴に混ぜずに次の手順を案内できるようにします。
  これは Crestodian セットアップ会話に続くものです。
  それを置き換えるものではありません。エージェントの最初の実際のターンで
  Gateway ホスト上で何が起きるかについては、[ブートストラップ](/ja-JP/start/bootstrapping) を参照してください。
</Step>
</Steps>

## 関連

- [オンボーディング概要](/ja-JP/start/onboarding-overview)
- [はじめに](/ja-JP/start/getting-started)
