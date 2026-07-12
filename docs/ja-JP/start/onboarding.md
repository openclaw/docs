---
read_when:
    - macOSオンボーディングアシスタントの設計
    - 認証または ID 設定の実装
sidebarTitle: 'Onboarding: macOS App'
summary: OpenClaw（macOS アプリ）の初回セットアップフロー
title: オンボーディング（macOSアプリ）
x-i18n:
    generated_at: "2026-07-12T14:51:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: cced671a375bd80cbdf920383add8cf01f75a85259963a4286e9ce49913d8b47
    source_path: start/onboarding.md
    workflow: 16
---

macOS アプリの初回起動フローでは、Gateway の実行場所を選択し、検証済みの AI バックエンドに接続し、権限を付与して、エージェント独自のブートストラップ手順へ引き継ぎます。
CLI オンボーディングと両方の経路の比較については、[オンボーディングの概要](/ja-JP/start/onboarding-overview)を参照してください。

<Steps>
<Step title="macOS の警告を承認">
<Frame>
<img src="/assets/macos-onboarding/01-macos-warning.jpeg" alt="" />
</Frame>
</Step>
<Step title="ローカルネットワークの検索を承認">
<Frame>
<img src="/assets/macos-onboarding/02-local-networks.jpeg" alt="" />
</Frame>
</Step>
<Step title="ようこそ画面とセキュリティ通知">
<Frame caption="表示されたセキュリティ通知を読み、その内容に応じて判断してください">
<img src="/assets/macos-onboarding/03-security-notice.png" alt="" />
</Frame>

セキュリティの信頼モデル：

- デフォルトでは、OpenClaw は個人用エージェントであり、信頼された単一のオペレーターを境界とします。
- 共有／マルチユーザー構成では、厳格な制限が必要です。信頼境界を分離し、ツールへのアクセスを最小限に抑え、[セキュリティ](/ja-JP/gateway/security)に従ってください。
- ローカルオンボーディングでは、新しい構成のデフォルトが `tools.profile: "coding"` に設定されます。これにより、新規セットアップでは、無制限の `full` プロファイルを使用せずにファイルシステム／ランタイムツールを維持できます。
- フック／Webhook またはその他の信頼できないコンテンツフィードを有効にする場合は、強力な最新モデル層を使用し、厳格なツールポリシーとサンドボックス化を維持してください。

</Step>
<Step title="ローカルとリモート">
<Frame>
<img src="/assets/macos-onboarding/04-choose-gateway.png" alt="" />
</Frame>

**Gateway** はどこで実行しますか？

- **この Mac（ローカルのみ）：** オンボーディングが認証を構成し、認証情報をローカルに書き込みます。
- **リモート（SSH／Tailnet 経由）：** オンボーディングはローカル認証を構成**しません**。認証情報は Gateway ホスト上にあらかじめ存在している必要があります。リモート Gateway トークンフィールドには、macOS アプリがその Gateway への接続に使用するトークンが保存されます。既存の `gateway.remote.token` SecretRef 値は、置き換えるまで保持されます。
- **後で構成：** セットアップをスキップし、アプリを未構成のままにします。

<Tip>
**Gateway 認証のヒント：**

- local loopback バインドでも、Gateway の認証モードはデフォルトで `token` になるため、ローカル WS クライアントにも認証が必要です。
- `gateway.auth.mode: "none"` を設定すると、あらゆるローカルプロセスが接続できるようになります。完全に信頼できるマシンでのみ使用してください。
- 複数マシンからのアクセスまたは非 local loopback バインドにはトークンを使用してください。

</Tip>
</Step>
<Step title="CLI">
  ローカルセットアップでは、npm、pnpm、または bun を使用してグローバル `openclaw` CLI をインストールし、最初に npm を優先します。Gateway 自体の推奨ランタイムは引き続き Node です。互換性のある既存のインストールは再利用されます。
</Step>
<Step title="AI に接続">
  接続済みの Gateway に構成済みのエージェントモデルがすでに存在する場合、このページは完全にスキップされ、通常のエージェント UI が開きます。Crestodian とプロバイダーのセットアップは、新規または未完了の Gateway でのみ実行されます。

Gateway の準備が完了すると、オンボーディングは既存の AI アクセスを探します。対象は Claude Code または Codex のログイン、あるいは `OPENAI_API_KEY` ／
`ANTHROPIC_API_KEY` です。最適な選択肢は実際の補完でテストされ、応答した場合にのみ保存されます。テストに失敗すると、アプリは自動的に次の選択肢を試し、前の選択肢が失敗した理由を表示します。複数の選択肢が見つかった場合は、続行する前に切り替えられます。

Gemini CLI はセットアップ後も通常のエージェントで使用できますが、ツールを使用しない推論プローブを強制できないため、ここでは提示されません。

プロバイダー独自の OAuth またはデバイスペアリングフローを使用してサインインすることもできます。組み込みの選択肢には、OpenAI/ChatGPT、OpenRouter、GitHub Copilot、Google
Gemini CLI、xAI、MiniMax Global と CN、Chutes が含まれます。このリストは固定されたアプリの一覧ではなく、Gateway で有効なテキスト推論プロバイダー Plugin から取得されます。そのため、プロバイダー固有の macOS コードを追加しなくても、別のプロバイダーが参加できます。

手動のキー／トークン選択画面でも、同じプロバイダーレジストリが使用されます。どの経路でも、プロバイダーが初期モデルと構成を提供し、OpenClaw は認証プロファイルを保存する前に、同じライブテストで認証情報を検証します。1 つのバックエンドが合格するまで「次へ」はロックされたままになるため、推論が機能していない状態で最初のエージェントチャットを開始することはできません。このライブチェックに合格すると、残りのワークスペース、Gateway、チャンネル、およびその他のオプション機能の構成を支援する Crestodian が使用可能になります。Crestodian は後から Settings → Crestodian でも使用できます。
</Step>
<Step title="権限">

<Frame caption="OpenClaw に付与する権限を選択してください">
<img src="/assets/macos-onboarding/05-permissions.png" alt="" />
</Frame>

オンボーディングでは、Automation（AppleScript）、Notifications、Accessibility、Screen Recording、Microphone、Speech Recognition、Camera、Location の TCC 権限を要求します。

</Step>
<Step title="完了">
  推論テストに合格すると、残りのオプションセットアップは Crestodian が担当し、通常のエージェントチャットへ引き継ぐことができます。権限の案内を完了すると、同じチャットが開きます。アプリは Crestodian の前にワークスペースを作成したり、別のエージェントセットアップ会話を開始したりしません。エージェントの最初の実際のターン中に Gateway ホストで何が起きるかについては、[ブートストラップ](/ja-JP/start/bootstrapping)を参照してください。
</Step>
</Steps>

## 関連項目

- [オンボーディングの概要](/ja-JP/start/onboarding-overview)
- [はじめに](/ja-JP/start/getting-started)
