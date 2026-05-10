---
read_when:
    - CLIオンボーディングの実行または設定
    - 新しいマシンのセットアップ
sidebarTitle: 'Onboarding: CLI'
summary: 'CLI オンボーディング: Gateway、ワークスペース、チャネル、Skills のガイド付きセットアップ'
title: オンボーディング (CLI)
x-i18n:
    generated_at: "2026-05-10T19:53:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6d8093f2375240f7a784b22c97c824a49b4d39b9217c0d1c0a1490bb15160700
    source_path: start/wizard.md
    workflow: 16
---

CLI オンボーディングは、macOS、Linux、または Windows (WSL2 経由、強く推奨) で OpenClaw をセットアップする**推奨**の方法です。
ローカル Gateway またはリモート Gateway 接続に加え、チャンネル、Skills、
ワークスペースのデフォルトを、1つのガイド付きフローで設定します。

```bash
openclaw onboard
```

<Info>
最速の初回チャット: Control UI を開きます (チャンネル設定は不要)。`openclaw dashboard` を実行し、ブラウザーでチャットします。ドキュメント: [Dashboard](/ja-JP/web/dashboard)。
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
API キーが必要ですが、キー不要のものもあります。後で `openclaw configure --section web` でも設定できます。ドキュメント: [Web ツール](/ja-JP/tools/web)。
</Tip>

## クイックスタート vs 詳細設定

オンボーディングは、**クイックスタート** (デフォルト) と **詳細設定** (完全な制御) から始まります。

<Tabs>
  <Tab title="クイックスタート (デフォルト)">
    - ローカル Gateway (loopback)
    - ワークスペースのデフォルト (または既存のワークスペース)
    - Gateway ポート **18789**
    - Gateway 認証 **Token** (loopback でも自動生成)
    - 新しいローカルセットアップ向けのツールポリシーのデフォルト: `tools.profile: "coding"` (既存の明示的なプロファイルは保持されます)
    - DM 分離のデフォルト: ローカルオンボーディングは未設定時に `session.dmScope: "per-channel-peer"` を書き込みます。詳細: [CLI セットアップリファレンス](/ja-JP/start/wizard-cli-reference#outputs-and-internals)
    - Tailscale 公開 **オフ**
    - Telegram + WhatsApp の DM はデフォルトで **allowlist** (電話番号の入力を求められます)

  </Tab>
  <Tab title="詳細設定 (完全な制御)">
    - すべてのステップ (モード、ワークスペース、Gateway、チャンネル、デーモン、Skills) を公開します。

  </Tab>
</Tabs>

## オンボーディングで設定される内容

**ローカルモード (デフォルト)** では、次のステップを順に案内します。

1. **モデル/認証** — Custom Provider を含む、サポートされている任意のプロバイダー/認証フロー (API キー、OAuth、またはプロバイダー固有の手動認証) を選択します
   (OpenAI 互換、Anthropic 互換、または Unknown 自動検出)。デフォルトモデルを選択します。
   セキュリティ上の注意: このエージェントがツールを実行したり Webhook/hooks コンテンツを処理したりする場合は、利用可能な最新世代の最も強力なモデルを優先し、ツールポリシーを厳格に保ってください。弱い/古い階層ほどプロンプトインジェクションを受けやすくなります。
   非対話実行では、`--secret-input-mode ref` は平文の API キー値ではなく、環境変数に基づく参照を認証プロファイルに保存します。
   非対話 `ref` モードでは、プロバイダーの環境変数が設定されている必要があります。その環境変数なしでインラインのキーフラグを渡すと、即座に失敗します。
   対話実行では、シークレット参照モードを選ぶと、環境変数または設定済みのプロバイダー参照 (`file` または `exec`) を指し示せます。保存前に高速な事前検証が行われます。
   Anthropic では、対話型のオンボーディング/設定で、推奨されるローカルパスとして **Anthropic Claude CLI**、推奨される本番パスとして **Anthropic API key** が提示されます。Anthropic setup-token も、サポートされるトークン認証パスとして引き続き利用できます。
2. **ワークスペース** — エージェントファイルの場所 (デフォルトは `~/.openclaw/workspace`)。ブートストラップファイルをシードします。
3. **Gateway** — ポート、バインドアドレス、認証モード、Tailscale 公開。
   対話型トークンモードでは、デフォルトの平文トークン保存を選ぶか、SecretRef にオプトインします。
   非対話トークン SecretRef パス: `--gateway-token-ref-env <ENV_VAR>`。
4. **チャンネル** — iMessage、Discord、Feishu、Google Chat、Mattermost、Microsoft Teams、QQ Bot、Signal、Slack、Telegram、WhatsApp などの組み込みおよび同梱チャットチャンネル。
5. **デーモン** — LaunchAgent (macOS)、systemd ユーザーユニット (Linux/WSL2)、またはユーザーごとの Startup フォルダーへのフォールバック付きのネイティブ Windows Scheduled Task をインストールします。
   トークン認証でトークンが必要で、`gateway.auth.token` が SecretRef 管理の場合、デーモンのインストールではそれを検証しますが、解決済みトークンをスーパーバイザーサービスの環境メタデータに永続化しません。
   トークン認証でトークンが必要で、設定済みのトークン SecretRef が未解決の場合、デーモンのインストールは実行可能な案内とともにブロックされます。
   `gateway.auth.token` と `gateway.auth.password` の両方が設定され、`gateway.auth.mode` が未設定の場合、モードが明示的に設定されるまでデーモンのインストールはブロックされます。
6. **ヘルスチェック** — Gateway を起動し、実行中であることを検証します。
7. **Skills** — 推奨 Skills と任意の依存関係をインストールします。

<Note>
オンボーディングを再実行しても、**Reset** を明示的に選択しない限り (または `--reset` を渡さない限り)、何も消去されません。
CLI の `--reset` はデフォルトで設定、認証情報、セッションを対象にします。ワークスペースを含めるには `--reset-scope full` を使用してください。
設定が無効であるかレガシーキーを含む場合、オンボーディングはまず `openclaw doctor` の実行を求めます。
</Note>

**リモートモード** は、ローカルクライアントが別の場所にある Gateway に接続するための設定だけを行います。
リモートホストには何もインストールせず、変更もしません。

## 別のエージェントを追加する

`openclaw agents add <name>` を使用して、独自のワークスペース、
セッション、認証プロファイルを持つ別個のエージェントを作成します。`--workspace` なしで実行するとオンボーディングが起動します。

設定される内容:

- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

注記:

- デフォルトのワークスペースは `~/.openclaw/workspace-<agentId>` に従います。
- 受信メッセージをルーティングするには `bindings` を追加します (オンボーディングで実行できます)。
- 非対話フラグ: `--model`、`--agent-dir`、`--bind`、`--non-interactive`。

## 完全なリファレンス

詳細なステップごとの内訳と設定出力については、
[CLI セットアップリファレンス](/ja-JP/start/wizard-cli-reference) を参照してください。
非対話の例については、[CLI 自動化](/ja-JP/start/wizard-cli-automation) を参照してください。
RPC の詳細を含む、より深い技術リファレンスについては、
[オンボーディングリファレンス](/ja-JP/reference/wizard) を参照してください。

## 関連ドキュメント

- CLI コマンドリファレンス: [`openclaw onboard`](/ja-JP/cli/onboard)
- オンボーディング概要: [オンボーディング概要](/ja-JP/start/onboarding-overview)
- macOS アプリのオンボーディング: [オンボーディング](/ja-JP/start/onboarding)
- エージェントの初回実行儀式: [エージェントのブートストラップ](/ja-JP/start/bootstrapping)
