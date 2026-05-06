---
read_when:
    - CLI オンボーディングの実行または設定
    - 新しいマシンのセットアップ
sidebarTitle: 'Onboarding: CLI'
summary: 'CLI オンボーディング: Gateway、ワークスペース、チャンネル、Skills のガイド付きセットアップ'
title: オンボーディング (CLI)
x-i18n:
    generated_at: "2026-05-06T09:11:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: c4872c150950a811e5cdb8830fe635886f7c3ed0f1d62352b71be56feda64691
    source_path: start/wizard.md
    workflow: 16
---

CLI オンボーディングは、macOS、Linux、または Windows (WSL2 経由。強く推奨) で OpenClaw をセットアップするための **推奨** 方法です。
ローカル Gateway またはリモート Gateway 接続に加えて、チャネル、Skills、
ワークスペースのデフォルトを、1 つのガイド付きフローで構成します。

```bash
openclaw onboard
```

<Info>
初回チャットを最速で始めるには: Control UI を開きます (チャネル設定は不要)。`openclaw dashboard` を実行し、ブラウザーでチャットします。ドキュメント: [ダッシュボード](/ja-JP/web/dashboard)。
</Info>

後で再構成するには:

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json` は非対話モードを意味しません。スクリプトでは `--non-interactive` を使用します。
</Note>

<Tip>
CLI オンボーディングには Web 検索ステップが含まれており、Brave、DuckDuckGo、Exa、Firecrawl、Gemini、Grok、Kimi、MiniMax Search、
Ollama Web Search、Perplexity、SearXNG、または Tavily などのプロバイダーを選択できます。一部のプロバイダーでは
API キーが必要ですが、キー不要のものもあります。これは後で
`openclaw configure --section web` でも構成できます。ドキュメント: [Web ツール](/ja-JP/tools/web)。
</Tip>

## クイックスタート vs 詳細設定

オンボーディングは **クイックスタート** (デフォルト) と **詳細設定** (完全制御) の選択から始まります。

<Tabs>
  <Tab title="クイックスタート (デフォルト)">
    - ローカル Gateway (ループバック)
    - ワークスペースのデフォルト (または既存のワークスペース)
    - Gateway ポート **18789**
    - Gateway 認証 **トークン** (ループバック上でも自動生成)
    - 新しいローカルセットアップのツールポリシーデフォルト: `tools.profile: "coding"` (既存の明示的なプロファイルは保持されます)
    - DM 分離のデフォルト: 未設定の場合、ローカルオンボーディングは `session.dmScope: "per-channel-peer"` を書き込みます。詳細: [CLI セットアップリファレンス](/ja-JP/start/wizard-cli-reference#outputs-and-internals)
    - Tailscale 公開 **オフ**
    - Telegram + WhatsApp の DM はデフォルトで **許可リスト** になります (電話番号の入力を求められます)

  </Tab>
  <Tab title="詳細設定 (完全制御)">
    - すべてのステップ (モード、ワークスペース、Gateway、チャネル、デーモン、Skills) を表示します。

  </Tab>
</Tabs>

## オンボーディングで構成される内容

**ローカルモード (デフォルト)** では、次のステップを順に進めます:

1. **モデル/認証** — サポートされている任意のプロバイダー/認証フロー (API キー、OAuth、またはプロバイダー固有の手動認証) を、カスタムプロバイダー
   (OpenAI 互換、Anthropic 互換、または Unknown の自動検出) を含めて選択します。デフォルトモデルを選択します。
   セキュリティ上の注意: このエージェントがツールを実行する、または Webhook/hooks コンテンツを処理する場合は、利用可能な最も強力な最新世代モデルを優先し、ツールポリシーを厳格に保ってください。弱い/古いティアほどプロンプトインジェクションを受けやすくなります。
   非対話実行では、`--secret-input-mode ref` により、平文の API キー値の代わりに env 裏付けの ref が認証プロファイルに保存されます。
   非対話の `ref` モードでは、プロバイダーの環境変数を設定する必要があります。その環境変数なしでインラインキーのフラグを渡すと即座に失敗します。
   対話実行では、シークレット参照モードを選ぶと、環境変数または構成済みプロバイダー ref (`file` または `exec`) のいずれかを指定でき、保存前に高速な事前検証が行われます。
   Anthropic では、対話型のオンボーディング/構成時に、推奨されるローカルパスとして **Anthropic Claude CLI**、推奨される本番パスとして **Anthropic API キー** が提示されます。Anthropic setup-token も、サポートされるトークン認証パスとして引き続き利用できます。
2. **ワークスペース** — エージェントファイルの場所 (デフォルト `~/.openclaw/workspace`)。ブートストラップファイルを配置します。
3. **Gateway** — ポート、バインドアドレス、認証モード、Tailscale 公開。
   対話型トークンモードでは、デフォルトの平文トークン保存を選択するか、SecretRef を選択できます。
   非対話トークン SecretRef パス: `--gateway-token-ref-env <ENV_VAR>`。
4. **チャネル** — BlueBubbles、Discord、Feishu、Google Chat、Mattermost、Microsoft Teams、QQ Bot、Signal、Slack、Telegram、WhatsApp などの組み込みおよびバンドルされたチャットチャネル。
5. **デーモン** — LaunchAgent (macOS)、systemd user unit (Linux/WSL2)、またはユーザーごとの Startup フォルダーへのフォールバック付きのネイティブ Windows Scheduled Task をインストールします。
   トークン認証でトークンが必要で、`gateway.auth.token` が SecretRef 管理の場合、デーモンのインストールはそれを検証しますが、解決済みトークンをスーパーバイザーサービスの環境メタデータには永続化しません。
   トークン認証でトークンが必要で、構成済みのトークン SecretRef が未解決の場合、デーモンのインストールは対処可能なガイダンスとともにブロックされます。
   `gateway.auth.token` と `gateway.auth.password` の両方が構成され、`gateway.auth.mode` が未設定の場合、モードが明示的に設定されるまでデーモンのインストールはブロックされます。
6. **ヘルスチェック** — Gateway を起動し、実行中であることを確認します。
7. **Skills** — 推奨 Skills と任意の依存関係をインストールします。

<Note>
オンボーディングを再実行しても、**リセット** を明示的に選択 (または `--reset` を渡す) しない限り、何も消去されません。
CLI の `--reset` は、デフォルトで構成、認証情報、セッションを対象にします。ワークスペースを含めるには `--reset-scope full` を使用します。
構成が無効、またはレガシーキーを含む場合、オンボーディングは先に `openclaw doctor` を実行するよう求めます。
</Note>

**リモートモード** は、別の場所にある Gateway へ接続するためにローカルクライアントだけを構成します。
リモートホスト上では何もインストールまたは変更しません。

## 別のエージェントを追加する

独自のワークスペース、
セッション、認証プロファイルを持つ別のエージェントを作成するには、`openclaw agents add <name>` を使用します。`--workspace` なしで実行するとオンボーディングが起動します。

設定される内容:

- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

メモ:

- デフォルトのワークスペースは `~/.openclaw/workspace-<agentId>` の形式に従います。
- 受信メッセージをルーティングするには `bindings` を追加します (オンボーディングでも実行できます)。
- 非対話フラグ: `--model`, `--agent-dir`, `--bind`, `--non-interactive`。

## 完全なリファレンス

詳細なステップごとの内訳と構成出力については、
[CLI セットアップリファレンス](/ja-JP/start/wizard-cli-reference)を参照してください。
非対話の例については、[CLI 自動化](/ja-JP/start/wizard-cli-automation)を参照してください。
RPC の詳細を含む、より詳しい技術リファレンスについては、
[オンボーディングリファレンス](/ja-JP/reference/wizard)を参照してください。

## 関連ドキュメント

- CLI コマンドリファレンス: [`openclaw onboard`](/ja-JP/cli/onboard)
- オンボーディング概要: [オンボーディング概要](/ja-JP/start/onboarding-overview)
- macOS アプリのオンボーディング: [オンボーディング](/ja-JP/start/onboarding)
- エージェントの初回実行手順: [エージェントのブートストラップ](/ja-JP/start/bootstrapping)
