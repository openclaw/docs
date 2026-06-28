---
read_when:
    - OpenClaw CLI オンボーディングの実行または設定
    - 新しいマシンをセットアップする
sidebarTitle: 'Onboarding: CLI'
summary: 'CLI オンボーディング: Gateway、ワークスペース、チャネル、Skills のガイド付きセットアップ'
title: オンボーディング（CLI）
x-i18n:
    generated_at: "2026-06-28T20:45:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8abf6ac4644e0a49668cbfa1277f6eb3ac5b4fd822cd7805bb647c94ae76895f
    source_path: start/wizard.md
    workflow: 16
---

CLI オンボーディングは、macOS、Linux、Windows で OpenClaw をターミナルから設定するための**推奨**パスです。Windows デスクトップユーザーは
[Windows Hub](/ja-JP/platforms/windows) から始めることもできます。
1つのガイド付きフローで、ローカル Gateway またはリモート Gateway 接続に加え、チャンネル、Skills、ワークスペースのデフォルトを設定します。

```bash
openclaw onboard
```

クイックスタートは通常数分で完了しますが、プロバイダーのサインイン、チャンネルのペアリング、デーモンのインストール、ネットワークダウンロード、Skills、任意のプラグインに追加設定が必要な場合は、完全なオンボーディングにさらに時間がかかることがあります。ウィザードはこの所要時間を最初に表示し、任意のステップはスキップして後から
`openclaw configure` で再実行できます。

## ロケール

CLI ウィザードは、固定のオンボーディング文言をローカライズします。ロケールは
`OPENCLAW_LOCALE`、次に `LC_ALL`、次に `LC_MESSAGES`、次に `LANG` から解決し、英語にフォールバックします。サポートされるウィザードのロケールは `en`、`zh-CN`、`zh-TW` です。

```bash
OPENCLAW_LOCALE=zh-CN openclaw onboard
```

名前と安定した識別子はそのまま維持されます: `OpenClaw`、`Gateway`、`Tailscale`、コマンド、設定キー、URL、プロバイダー ID、モデル ID、プラグイン/チャンネルラベルは翻訳されません。

<Info>
最速で最初のチャットを始めるには: Control UI を開きます（チャンネル設定は不要）。`openclaw dashboard` を実行し、ブラウザーでチャットします。ドキュメント: [Dashboard](/ja-JP/web/dashboard)。
</Info>

後から再設定するには:

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json` は非対話モードを意味しません。スクリプトでは `--non-interactive` を使用してください。
</Note>

<Tip>
CLI オンボーディングには Web 検索ステップがあり、Brave、DuckDuckGo、Exa、Firecrawl、Gemini、Grok、Kimi、MiniMax Search、Ollama Web Search、Perplexity、SearXNG、Tavily などのプロバイダーを選択できます。一部のプロバイダーには API キーが必要で、キー不要のものもあります。後から
`openclaw configure --section web` で設定することもできます。ドキュメント: [Web tools](/ja-JP/tools/web)。
</Tip>

## クイックスタートと詳細

オンボーディングは **クイックスタート**（デフォルト）または **詳細**（完全制御）で始まります。

<Tabs>
  <Tab title="クイックスタート（デフォルト）">
    - ローカル Gateway（loopback）
    - ワークスペースのデフォルト（または既存のワークスペース）
    - Gateway ポート **18789**
    - Gateway 認証 **トークン**（loopback でも自動生成）
    - 新しいローカル設定のツールポリシーデフォルト: `tools.profile: "coding"`（既存の明示的なプロファイルは保持されます）
    - DM 分離のデフォルト: 未設定の場合、ローカルオンボーディングは `session.dmScope: "per-channel-peer"` を書き込みます。詳細: [CLI Setup Reference](/ja-JP/start/wizard-cli-reference#outputs-and-internals)
    - Tailscale 公開 **オフ**
    - Telegram + WhatsApp の DM はデフォルトで **allowlist**（電話番号の入力を求められます）

  </Tab>
  <Tab title="詳細（完全制御）">
    - すべてのステップ（モード、ワークスペース、Gateway、チャンネル、デーモン、Skills）を表示します。

  </Tab>
</Tabs>

## オンボーディングで設定される内容

**ローカルモード（デフォルト）**では、次のステップを案内します。

1. **モデル/認証** — Custom Provider
   （OpenAI 互換、Anthropic 互換、または Unknown 自動検出）を含め、サポートされる任意のプロバイダー/認証フロー（API キー、OAuth、またはプロバイダー固有の手動認証）を選択します。デフォルトモデルを選択します。
   セキュリティメモ: このエージェントがツールを実行する、または webhook/hooks の内容を処理する場合は、利用可能な最も強力な最新世代モデルを優先し、ツールポリシーを厳格に保ってください。弱い/古い階層ほどプロンプトインジェクションを受けやすくなります。
   非対話実行では、`--secret-input-mode ref` により、平文の API キー値ではなく、環境変数に基づく参照が認証プロファイルに保存されます。
   非対話 `ref` モードでは、プロバイダーの環境変数が設定されている必要があります。その環境変数なしでインラインキーのフラグを渡すと、即座に失敗します。
   対話実行では、シークレット参照モードを選ぶと、環境変数または設定済みのプロバイダー参照（`file` または `exec`）を指定でき、保存前に高速な事前検証が行われます。
   Anthropic では、対話型のオンボーディング/configure は、推奨ローカルパスとして **Anthropic Claude CLI** を、推奨本番パスとして **Anthropic API key** を提示します。Anthropic setup-token も、サポートされるトークン認証パスとして引き続き利用できます。
2. **ワークスペース** — エージェントファイルの場所（デフォルトは `~/.openclaw/workspace`）。ブートストラップファイルを配置します。
3. **Gateway** — ポート、バインドアドレス、認証モード、Tailscale 公開。
   対話型トークンモードでは、デフォルトの平文トークン保存を選ぶか、SecretRef にオプトインします。
   非対話のトークン SecretRef パス: `--gateway-token-ref-env <ENV_VAR>`。
4. **チャンネル** — iMessage、Discord、Feishu、Google Chat、Mattermost、Microsoft Teams、QQ Bot、Signal、Slack、Telegram、WhatsApp などの組み込みおよび公式 Plugin チャットチャンネル。
5. **デーモン** — LaunchAgent（macOS）、systemd ユーザーユニット（Linux/WSL2）、またはユーザーごとの Startup フォルダーへのフォールバック付きのネイティブ Windows Scheduled Task をインストールします。
   トークン認証にトークンが必要で、`gateway.auth.token` が SecretRef 管理の場合、デーモンのインストールはそれを検証しますが、解決済みトークンをスーパーバイザーサービスの環境メタデータには永続化しません。
   トークン認証にトークンが必要で、設定されたトークン SecretRef が未解決の場合、デーモンのインストールは実行可能な案内とともにブロックされます。
   `gateway.auth.token` と `gateway.auth.password` の両方が設定されていて、`gateway.auth.mode` が未設定の場合、モードが明示的に設定されるまでデーモンのインストールはブロックされます。
6. **ヘルスチェック** — Gateway を起動し、実行中であることを検証します。
7. **Skills** — 推奨 Skills と任意の依存関係をインストールします。

<Note>
オンボーディングを再実行しても、明示的に **リセット** を選択しない限り（または `--reset` を渡さない限り）、何も消去されません。
CLI の `--reset` はデフォルトで設定、資格情報、セッションを対象にします。ワークスペースを含めるには `--reset-scope full` を使用します。
設定が無効、またはレガシーキーを含む場合、オンボーディングは先に `openclaw doctor` を実行するよう求めます。
</Note>

**リモートモード**は、別の場所にある Gateway へ接続するようローカルクライアントを設定するだけです。
リモートホストには何もインストールせず、変更もしません。

## 別のエージェントを追加する

`openclaw agents add <name>` を使用して、独自のワークスペース、セッション、認証プロファイルを持つ別のエージェントを作成します。`--workspace` なしで実行すると、オンボーディングが起動します。

設定される内容:

- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

メモ:

- デフォルトのワークスペースは `~/.openclaw/workspace-<agentId>` に従います。
- 受信メッセージをルーティングするには `bindings` を追加します（オンボーディングで実行できます）。
- 非対話フラグ: `--model`、`--agent-dir`、`--bind`、`--non-interactive`。

## 完全リファレンス

ステップごとの詳細な内訳と設定出力については、
[CLI Setup Reference](/ja-JP/start/wizard-cli-reference) を参照してください。
非対話の例については、[CLI Automation](/ja-JP/start/wizard-cli-automation) を参照してください。
RPC の詳細を含む、より深い技術リファレンスについては、
[Onboarding Reference](/ja-JP/reference/wizard) を参照してください。

## 関連ドキュメント

- CLI コマンドリファレンス: [`openclaw onboard`](/ja-JP/cli/onboard)
- オンボーディング概要: [Onboarding Overview](/ja-JP/start/onboarding-overview)
- macOS アプリのオンボーディング: [Onboarding](/ja-JP/start/onboarding)
- エージェント初回実行の儀式: [Agent Bootstrapping](/ja-JP/start/bootstrapping)
