---
read_when:
    - CLI オンボーディングの実行または設定
    - 新しいマシンのセットアップ
sidebarTitle: 'Onboarding: CLI'
summary: 'CLI オンボーディング: Gateway、ワークスペース、チャンネル、Skills のガイド付きセットアップ'
title: オンボーディング (CLI)
x-i18n:
    generated_at: "2026-04-30T05:36:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9e9ee3af82ab9f4a1af5d20e3680eb932a9428cb914bbc08c9a2bf83c94ec158
    source_path: start/wizard.md
    workflow: 16
---

CLI オンボーディングは、macOS、Linux、または Windows（WSL2 経由、強く推奨）で OpenClaw をセットアップするための**推奨**方法です。
ローカル Gateway またはリモート Gateway 接続に加えて、チャネル、スキル、
ワークスペースのデフォルトを 1 つのガイド付きフローで設定します。

```bash
openclaw onboard
```

<Info>
最速の初回チャット: Control UI を開きます（チャネル設定は不要）。`openclaw dashboard` を実行し、ブラウザーでチャットします。ドキュメント: [Dashboard](/ja-JP/web/dashboard)。
</Info>

後で再設定するには:

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json` は非対話モードを意味しません。スクリプトでは `--non-interactive` を使用してください。
</Note>

<Tip>
CLI オンボーディングには Web 検索ステップが含まれており、Brave、DuckDuckGo、Exa、Firecrawl、Gemini、Grok、Kimi、MiniMax Search、
Ollama Web Search、Perplexity、SearXNG、Tavily などのプロバイダーを選択できます。一部のプロバイダーには
API キーが必要ですが、キー不要のものもあります。これは後で
`openclaw configure --section web` でも設定できます。ドキュメント: [Web ツール](/ja-JP/tools/web)。
</Tip>

## クイックスタート vs 詳細設定

オンボーディングは **クイックスタート**（デフォルト）と **詳細設定**（完全な制御）の選択から始まります。

<Tabs>
  <Tab title="クイックスタート（デフォルト）">
    - ローカル Gateway（loopback）
    - ワークスペースのデフォルト（または既存のワークスペース）
    - Gateway ポート **18789**
    - Gateway 認証 **Token**（loopback 上でも自動生成）
    - 新しいローカルセットアップのツールポリシーデフォルト: `tools.profile: "coding"`（既存の明示的なプロファイルは保持）
    - DM 分離のデフォルト: ローカルオンボーディングは未設定時に `session.dmScope: "per-channel-peer"` を書き込みます。詳細: [CLI セットアップリファレンス](/ja-JP/start/wizard-cli-reference#outputs-and-internals)
    - Tailscale 公開 **オフ**
    - Telegram + WhatsApp DM はデフォルトで **許可リスト**（電話番号の入力を求められます）

  </Tab>
  <Tab title="詳細設定（完全な制御）">
    - すべてのステップ（モード、ワークスペース、Gateway、チャネル、デーモン、Skills）を表示します。

  </Tab>
</Tabs>

## オンボーディングで設定される内容

**ローカルモード（デフォルト）**では、次の手順を進めます。

1. **モデル/認証** — Custom Provider
   （OpenAI 互換、Anthropic 互換、または Unknown 自動検出）を含む、サポート対象のプロバイダー/認証フロー（API キー、OAuth、またはプロバイダー固有の手動認証）を選択します。デフォルトモデルを選択します。
   セキュリティメモ: このエージェントがツールを実行する、または Webhook/hooks コンテンツを処理する場合は、利用可能な最も強力な最新世代モデルを優先し、ツールポリシーを厳格に保ってください。弱い/古い層はプロンプトインジェクションを受けやすくなります。
   非対話実行では、`--secret-input-mode ref` はプレーンテキストの API キー値ではなく、env に基づく参照を認証プロファイルに保存します。
   非対話 `ref` モードでは、プロバイダーの env var が設定されている必要があります。その env var なしでインラインキーのフラグを渡すと即座に失敗します。
   対話実行では、シークレット参照モードを選ぶと、環境変数または設定済みプロバイダー参照（`file` または `exec`）を指定でき、保存前に高速な事前検証が行われます。
   Anthropic では、対話型オンボーディング/configure は推奨されるローカルパスとして **Anthropic Claude CLI** を、推奨される本番パスとして **Anthropic API key** を提示します。Anthropic setup-token も、サポート対象のトークン認証パスとして引き続き利用できます。
2. **ワークスペース** — エージェントファイルの場所（デフォルト `~/.openclaw/workspace`）。ブートストラップファイルをシードします。
3. **Gateway** — ポート、バインドアドレス、認証モード、Tailscale 公開。
   対話型トークンモードでは、デフォルトのプレーンテキストトークン保存を選ぶか、SecretRef を使用します。
   非対話トークン SecretRef パス: `--gateway-token-ref-env <ENV_VAR>`。
4. **チャネル** — BlueBubbles、Discord、Feishu、Google Chat、Mattermost、Microsoft Teams、QQ Bot、Signal、Slack、Telegram、WhatsApp などの組み込みおよび同梱チャットチャネル。
5. **デーモン** — LaunchAgent（macOS）、systemd ユーザーユニット（Linux/WSL2）、またはユーザーごとの Startup フォルダーフォールバック付きのネイティブ Windows Scheduled Task をインストールします。
   トークン認証にトークンが必要で、`gateway.auth.token` が SecretRef 管理の場合、デーモンのインストールではそれを検証しますが、解決済みトークンをスーパーバイザーサービスの環境メタデータには永続化しません。
   トークン認証にトークンが必要で、設定済みのトークン SecretRef が未解決の場合、デーモンのインストールは実行可能な案内とともにブロックされます。
   `gateway.auth.token` と `gateway.auth.password` の両方が設定され、`gateway.auth.mode` が未設定の場合、モードが明示的に設定されるまでデーモンのインストールはブロックされます。
6. **ヘルスチェック** — Gateway を起動し、実行中であることを確認します。
7. **Skills** — 推奨 Skills と任意の依存関係をインストールします。

<Note>
オンボーディングを再実行しても、明示的に **リセット** を選択しない限り（または `--reset` を渡さない限り）、何も消去されません。
CLI `--reset` はデフォルトで設定、認証情報、セッションを対象にします。ワークスペースを含めるには `--reset-scope full` を使用してください。
設定が無効、またはレガシーキーを含む場合、オンボーディングは先に `openclaw doctor` を実行するよう求めます。
</Note>

**リモートモード**は、別の場所にある Gateway へ接続するためにローカルクライアントのみを設定します。
リモートホストには何もインストールせず、変更もしません。

## 別のエージェントを追加する

`openclaw agents add <name>` を使用して、独自のワークスペース、
セッション、認証プロファイルを持つ別のエージェントを作成します。`--workspace` なしで実行すると、オンボーディングが起動します。

設定される内容:

- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

メモ:

- デフォルトのワークスペースは `~/.openclaw/workspace-<agentId>` に従います。
- 受信メッセージをルーティングするには `bindings` を追加します（オンボーディングでも実行できます）。
- 非対話フラグ: `--model`、`--agent-dir`、`--bind`、`--non-interactive`。

## 完全なリファレンス

詳細なステップごとの内訳と設定出力については、
[CLI セットアップリファレンス](/ja-JP/start/wizard-cli-reference) を参照してください。
非対話の例については、[CLI 自動化](/ja-JP/start/wizard-cli-automation) を参照してください。
RPC の詳細を含む、より深い技術リファレンスについては、
[オンボーディングリファレンス](/ja-JP/reference/wizard) を参照してください。

## 関連ドキュメント

- CLI コマンドリファレンス: [`openclaw onboard`](/ja-JP/cli/onboard)
- オンボーディングの概要: [オンボーディング概要](/ja-JP/start/onboarding-overview)
- macOS アプリのオンボーディング: [オンボーディング](/ja-JP/start/onboarding)
- エージェントの初回実行儀式: [エージェントのブートストラップ](/ja-JP/start/bootstrapping)
