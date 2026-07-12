---
read_when:
    - macOSオンボーディングアシスタントの設計
    - 認証またはアイデンティティ設定の実装
sidebarTitle: 'Onboarding: macOS App'
summary: OpenClaw の初回セットアップフロー（macOS アプリ）
title: オンボーディング（macOSアプリ）
x-i18n:
    generated_at: "2026-07-11T22:42:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cced671a375bd80cbdf920383add8cf01f75a85259963a4286e9ce49913d8b47
    source_path: start/onboarding.md
    workflow: 16
---

macOSアプリの初回起動フローでは、Gatewayの実行場所を選択し、検証済みのAIバックエンドに接続して、権限を付与した後、エージェント独自のブートストラップ手順に引き継ぎます。
CLIオンボーディングと両方の手順の比較については、[オンボーディングの概要](/ja-JP/start/onboarding-overview)を参照してください。

<Steps>
<Step title="macOSの警告を承認">
<Frame>
<img src="/assets/macos-onboarding/01-macos-warning.jpeg" alt="" />
</Frame>
</Step>
<Step title="ローカルネットワークの検出を許可">
<Frame>
<img src="/assets/macos-onboarding/02-local-networks.jpeg" alt="" />
</Frame>
</Step>
<Step title="ようこそ画面とセキュリティ通知">
<Frame caption="表示されたセキュリティ通知を読み、内容に応じて判断してください">
<img src="/assets/macos-onboarding/03-security-notice.png" alt="" />
</Frame>

セキュリティの信頼モデル：

- デフォルトでは、OpenClawは個人用エージェントであり、信頼された1人のオペレーターを境界とします。
- 共有環境やマルチユーザー環境では、厳格な制限が必要です。信頼境界を分離し、ツールへのアクセスを最小限に抑え、[セキュリティ](/ja-JP/gateway/security)に従ってください。
- ローカルオンボーディングでは、新しい設定のデフォルトが`tools.profile: "coding"`となるため、新規セットアップでも無制限の`full`プロファイルを使用せずに、ファイルシステムおよびランタイムツールを利用できます。
- フック、Webhook、その他の信頼できないコンテンツフィードを有効にする場合は、強力な最新モデルのティアを使用し、厳格なツールポリシーとサンドボックス化を維持してください。

</Step>
<Step title="ローカルとリモート">
<Frame>
<img src="/assets/macos-onboarding/04-choose-gateway.png" alt="" />
</Frame>

**Gateway**はどこで実行しますか？

- **This Mac (Local only):** オンボーディングによって認証が設定され、認証情報がローカルに書き込まれます。
- **Remote (over SSH/Tailnet):** オンボーディングではローカル認証を設定**しません**。
  認証情報はGatewayホスト上にあらかじめ存在している必要があります。リモートGatewayのトークン
  フィールドには、macOSアプリがそのGatewayへの接続に使用するトークンが保存されます。
  既存の`gateway.remote.token`のSecretRef値は、置き換えるまで保持されます。
- **Configure later:** セットアップをスキップし、アプリを未設定のままにします。

<Tip>
**Gateway認証のヒント：**

- Gatewayの認証モードはループバックバインドでもデフォルトで`token`となるため、ローカルWSクライアントも認証が必要です。
- `gateway.auth.mode: "none"`を設定すると、すべてのローカルプロセスが接続できるようになります。完全に信頼できるマシンでのみ使用してください。
- 複数マシンからのアクセスや非ループバックバインドにはトークンを使用してください。

</Tip>
</Step>
<Step title="CLI">
  ローカルセットアップでは、npm、pnpm、またはbunを介してグローバル`openclaw` CLIをインストールし、
  npmを最優先します。Gateway自体の推奨ランタイムは引き続きNodeです。
  既存の互換性のあるインストールは再利用されます。
</Step>
<Step title="AIに接続">
  接続先のGatewayにエージェントモデルがすでに設定されている場合、この
  ページは完全にスキップされ、通常のエージェントUIが開きます。Crestodianとプロバイダーのセットアップは、
  新規または設定が不完全なGatewayでのみ実行されます。

Gatewayの準備ができると、オンボーディングはすでに利用可能なAIアクセスを検索します。
Claude CodeまたはCodexへのログイン、あるいは`OPENAI_API_KEY` /
`ANTHROPIC_API_KEY`が対象です。最適なオプションは実際の補完処理でテストされ、
応答した場合にのみ保存されます。テストに失敗すると、アプリは自動的に
次のオプションを試し、前のオプションが失敗した理由を表示します。複数のオプションが
見つかった場合は、続行する前に切り替えられます。

Gemini CLIはセットアップ後も通常のエージェントで利用できますが、
ツールを使用しない推論プローブを強制できないため、ここでは提示されません。

プロバイダー独自のOAuthまたはデバイスペアリングフローを使用してサインインすることもできます。
組み込みの選択肢には、OpenAI/ChatGPT、OpenRouter、GitHub Copilot、Google
Gemini CLI、xAI、MiniMax GlobalおよびCN、Chutesが含まれます。このリストは
アプリ内の固定リストではなく、Gatewayで有効なテキスト推論プロバイダーPluginから取得されるため、
別のプロバイダーもプロバイダー固有のmacOSコードを追加せずに参加できます。

手動のキー／トークン選択機能でも、同じプロバイダーレジストリを使用します。どの経路でも、
プロバイダーが初期モデルと設定を提供します。OpenClawは認証プロファイルを保存する前に、
同じライブテストで認証情報を検証します。1つのバックエンドがテストに合格するまで
「次へ」はロックされたままになるため、推論が正常に動作しなければ最初のエージェントチャットを
開始できません。このライブチェックに合格すると、Crestodianを使用して残りのワークスペース、
Gateway、チャンネル、その他のオプション機能を設定できるようになります。また、
Settings → Crestodianから後で利用することもできます。
</Step>
<Step title="権限">

<Frame caption="OpenClawに付与する権限を選択してください">
<img src="/assets/macos-onboarding/05-permissions.png" alt="" />
</Frame>

オンボーディングでは、Automation（AppleScript）、Notifications、Accessibility、Screen Recording、Microphone、Speech Recognition、Camera、LocationのTCC権限を要求します。

</Step>
<Step title="完了">
  推論テストに合格すると、残りのオプション設定はCrestodianが担当し、
  通常のエージェントチャットへ引き継ぐことができます。権限の案内を完了すると、
  同じチャットが開きます。アプリはCrestodianより前にワークスペースを作成したり、
  別のエージェントセットアップ会話を開始したりしません。エージェントの最初の実際のターン中に
  Gatewayホストで行われる処理については、
  [ブートストラップ](/ja-JP/start/bootstrapping)を参照してください。
</Step>
</Steps>

## 関連項目

- [オンボーディングの概要](/ja-JP/start/onboarding-overview)
- [はじめに](/ja-JP/start/getting-started)
