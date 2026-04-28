---
read_when:
- Running or configuring CLI onboarding
- 新しいマシンをセットアップする
sidebarTitle: 'Onboarding: CLI'
summary: 'CLIオンボーディング: gateway、workspace、チャネル、Skillsのガイド付きセットアップ'
title: CLIオンボーディング
x-i18n:
  generated_at: '2026-04-24T05:22:21Z'
  model: gpt-5.4
  provider: openai
  source_hash: 919a4ab57f42f663e98e77c967e08e7ad7afbb193bd048ca1dedc884002d3801
  source_path: start/wizard.md
  workflow: 15
---

CLIオンボーディングは、macOS、
Linux、またはWindows（WSL2経由。強く推奨）でOpenClawをセットアップする**推奨**方法です。
ローカルGatewayまたはリモートGateway接続に加え、チャネル、Skills、
workspaceデフォルトを1つのガイド付きフローで設定します。

```bash
openclaw onboard
```

<Info>
最速の最初のチャット: Control UIを開いてください（チャネル設定不要）。`openclaw dashboard` を実行し、ブラウザでチャットします。ドキュメント: [Dashboard](/ja-JP/web/dashboard)。
</Info>

後で再設定するには:

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json` は非対話モードを意味しません。スクリプトでは `--non-interactive` を使ってください。
</Note>

<Tip>
CLIオンボーディングには、Brave、DuckDuckGo、Exa、Firecrawl、Gemini、Grok、Kimi、MiniMax Search、Ollama Web Search、Perplexity、SearXNG、Tavily のようなプロバイダを選べるweb searchステップが含まれています。一部のプロバイダはAPI keyが必要で、他はkey不要です。後から `openclaw configure --section web` で設定することもできます。ドキュメント: [Web tools](/ja-JP/tools/web)。
</Tip>

## QuickStart と Advanced

オンボーディングは **QuickStart**（デフォルト）と **Advanced**（完全制御）から始まります。

<Tabs>
  <Tab title="QuickStart（デフォルト）">
    - ローカルgateway（loopback）
    - workspaceのデフォルト（または既存workspace）
    - Gatewayポート **18789**
    - Gateway認証 **Token**（loopbackでも自動生成）
    - 新しいローカルセットアップのツールポリシーデフォルト: `tools.profile: "coding"`（既存の明示profileは保持）
    - DM分離のデフォルト: ローカルオンボーディングでは、未設定時に `session.dmScope: "per-channel-peer"` を書き込む。詳細: [CLI Setup Reference](/ja-JP/start/wizard-cli-reference#outputs-and-internals)
    - Tailscale公開 **オフ**
    - Telegram + WhatsApp DM のデフォルトは **allowlist**（電話番号の入力を求められる）
  </Tab>
  <Tab title="Advanced（完全制御）">
    - すべてのステップ（mode、workspace、gateway、channels、daemon、skills）を公開する。
  </Tab>
</Tabs>

## オンボーディングが設定するもの

**ローカルモード（デフォルト）** では、次のステップを案内します:

1. **Model/Auth** — 任意のサポートされたprovider/authフロー（API key、OAuth、またはprovider固有の手動認証）を選びます。Custom Provider
   （OpenAI-compatible、Anthropic-compatible、またはUnknown auto-detect）も含みます。デフォルトモデルを選びます。
   セキュリティ注記: このagentがツールを実行したり、webhook/hooksコンテンツを処理したりするなら、利用可能な中で最も強い最新世代モデルを優先し、tool policyを厳格に保ってください。弱い/古いtierほどprompt injectionされやすくなります。
   非対話実行では、`--secret-input-mode ref` を使うと、平文API key値ではなくenvバックエンドrefをauth profilesに保存します。
   非対話の `ref` モードでは、provider env varが設定されている必要があります。そのenv varなしでinline keyフラグを渡すと、即時失敗します。
   対話実行では、secret reference modeを選ぶと、環境変数または設定済みprovider ref（`file` または `exec`）のいずれかを指せるようになり、保存前に高速な事前検証を行います。
   Anthropicについては、対話オンボーディング/configureで **Anthropic Claude CLI** を推奨ローカル経路として、**Anthropic API key** を推奨本番経路として提示します。Anthropic setup-tokenも、引き続きサポートされたtoken-auth経路として利用できます。
2. **Workspace** — エージェントファイル用の場所（デフォルト `~/.openclaw/workspace`）。bootstrapファイルをseedします。
3. **Gateway** — ポート、bind address、auth mode、Tailscale公開。
   対話的token modeでは、デフォルトの平文token保存を選ぶか、SecretRefにオプトインできます。
   非対話token SecretRef経路: `--gateway-token-ref-env <ENV_VAR>`。
4. **Channels** — BlueBubbles、Discord、Feishu、Google Chat、Mattermost、Microsoft Teams、QQ Bot、Signal、Slack、Telegram、WhatsApp などの組み込み/バンドル済みチャットチャネル。
5. **Daemon** — LaunchAgent（macOS）、systemd user unit（Linux/WSL2）、またはネイティブWindows Scheduled Taskを、ユーザーごとのStartup-folderフォールバック付きでインストールします。
   token authにtokenが必要で、`gateway.auth.token` がSecretRef管理されている場合、daemon installはそれを検証しますが、解決済みtokenをsupervisor service environment metadataに永続化はしません。
   token authにtokenが必要で、設定済みtoken SecretRefが未解決の場合、daemon installは実用的なガイダンス付きでブロックされます。
   `gateway.auth.token` と `gateway.auth.password` の両方が設定されていて、`gateway.auth.mode` が未設定の場合、modeが明示設定されるまでdaemon installはブロックされます。
6. **Health check** — Gatewayを起動し、実行中であることを確認します。
7. **Skills** — 推奨Skillsと任意依存関係をインストールします。

<Note>
オンボーディングを再実行しても、明示的に **Reset** を選ぶ（または `--reset` を渡す）までは何も消去されません。
CLIの `--reset` はデフォルトで config、credentials、sessions を対象とします。workspaceも含めるには `--reset-scope full` を使ってください。
configが無効、またはlegacy keyを含んでいる場合、オンボーディングは最初に `openclaw doctor` を実行するよう求めます。
</Note>

**リモートモード** は、リモートのGatewayへ接続するようローカルクライアントを設定するだけです。
リモートホストには何もインストールも変更もしません。

## 別のagentを追加する

`openclaw agents add <name>` を使うと、独自のworkspace、
sessions、auth profilesを持つ別のagentを作成できます。`--workspace` なしで実行すると、オンボーディングが起動します。

設定されるもの:

- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

注記:

- デフォルトworkspaceは `~/.openclaw/workspace-<agentId>` に従います。
- 受信メッセージをルーティングするには `bindings` を追加してください（オンボーディングでも可能）。
- 非対話フラグ: `--model`、`--agent-dir`、`--bind`、`--non-interactive`。

## 完全リファレンス

詳細なステップごとの内訳とconfig出力については
[CLI Setup Reference](/ja-JP/start/wizard-cli-reference) を参照してください。
非対話の例については [CLI Automation](/ja-JP/start/wizard-cli-automation) を参照してください。
RPC詳細を含む、より深い技術リファレンスについては
[Onboarding Reference](/ja-JP/reference/wizard) を参照してください。

## 関連ドキュメント

- CLIコマンドリファレンス: [`openclaw onboard`](/ja-JP/cli/onboard)
- オンボーディング概要: [Onboarding Overview](/ja-JP/start/onboarding-overview)
- macOSアプリのオンボーディング: [Onboarding](/ja-JP/start/onboarding)
- Agentの初回実行儀式: [Agent Bootstrapping](/ja-JP/start/bootstrapping)
