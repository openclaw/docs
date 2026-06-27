---
read_when:
    - CLI オンボーディングの実行または設定
    - 新しいマシンのセットアップ
sidebarTitle: 'Onboarding: CLI'
summary: 'CLI オンボーディング: gateway、ワークスペース、チャンネル、skills のガイド付きセットアップ'
title: オンボーディング（CLI）
x-i18n:
    generated_at: "2026-06-27T13:07:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 77bbf3d1f953ea2fca148090377f9537b00b657b2d7201c21aea902800815fd2
    source_path: start/wizard.md
    workflow: 16
---

CLI オンボーディングは、macOS、Linux、Windows 上の OpenClaw における**推奨**のターミナルセットアップ手順です。Windows デスクトップユーザーは
[Windows Hub](/ja-JP/platforms/windows) から始めることもできます。
1 つのガイド付きフローで、ローカル Gateway またはリモート Gateway 接続に加えて、チャネル、Skills、ワークスペースのデフォルトを設定します。

```bash
openclaw onboard
```

## ロケール

CLI ウィザードは、固定のオンボーディング文言をローカライズします。ロケールは
`OPENCLAW_LOCALE`、次に `LC_ALL`、次に `LC_MESSAGES`、次に `LANG` から解決され、
最後に英語へフォールバックします。サポートされるウィザードロケールは `en`、`zh-CN`、`zh-TW` です。

```bash
OPENCLAW_LOCALE=zh-CN openclaw onboard
```

名前と安定した識別子はそのまま維持されます: `OpenClaw`、`Gateway`、`Tailscale`、
コマンド、設定キー、URL、プロバイダー ID、モデル ID、Plugin/チャネルラベルは
翻訳されません。

<Info>
最速で最初のチャットを始めるには、Control UI を開きます（チャネル設定は不要）。`openclaw dashboard` を実行し、ブラウザーでチャットします。ドキュメント: [Dashboard](/ja-JP/web/dashboard)。
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
CLI オンボーディングには Web 検索ステップが含まれ、Brave、DuckDuckGo、Exa、Firecrawl、Gemini、Grok、Kimi、MiniMax Search、Ollama Web Search、Perplexity、SearXNG、Tavily などのプロバイダーを選択できます。一部のプロバイダーには API キーが必要ですが、キー不要のものもあります。これは後で `openclaw configure --section web` でも設定できます。ドキュメント: [Web ツール](/ja-JP/tools/web)。
</Tip>

## QuickStart と詳細設定

オンボーディングは **QuickStart**（デフォルト）と**詳細設定**（完全制御）から始まります。

<Tabs>
  <Tab title="QuickStart (defaults)">
    - ローカル Gateway（loopback）
    - ワークスペースのデフォルト（または既存のワークスペース）
    - Gateway ポート **18789**
    - Gateway 認証 **Token**（loopback でも自動生成）
    - 新しいローカルセットアップのツールポリシーデフォルト: `tools.profile: "coding"`（既存の明示的なプロファイルは保持されます）
    - DM 分離のデフォルト: 未設定の場合、ローカルオンボーディングは `session.dmScope: "per-channel-peer"` を書き込みます。詳細: [CLI セットアップリファレンス](/ja-JP/start/wizard-cli-reference#outputs-and-internals)
    - Tailscale 公開 **オフ**
    - Telegram + WhatsApp の DM はデフォルトで **allowlist**（電話番号の入力を求められます）

  </Tab>
  <Tab title="Advanced (full control)">
    - すべてのステップ（モード、ワークスペース、Gateway、チャネル、デーモン、Skills）を表示します。

  </Tab>
</Tabs>

## オンボーディングで設定される内容

**ローカルモード（デフォルト）**では、次のステップを案内します。

1. **モデル/認証** — Custom Provider を含む、サポートされている任意のプロバイダー/認証フロー（API キー、OAuth、またはプロバイダー固有の手動認証）を選択します
   （OpenAI 互換、Anthropic 互換、または Unknown 自動検出）。デフォルトモデルを選択します。
   セキュリティ注記: このエージェントがツールを実行する、または Webhook/hooks コンテンツを処理する場合は、利用可能な最も強力な最新世代モデルを優先し、ツールポリシーを厳格に保ってください。弱い/古いティアはプロンプトインジェクションを受けやすくなります。
   非対話実行では、`--secret-input-mode ref` により、平文の API キー値ではなく、環境変数を参照する ref が認証プロファイルに保存されます。
   非対話の `ref` モードでは、プロバイダーの環境変数が設定されている必要があります。その環境変数なしでインラインキーのフラグを渡すと即座に失敗します。
   対話実行では、シークレット参照モードを選ぶと、保存前の高速な事前検証付きで、環境変数または設定済みのプロバイダー ref（`file` または `exec`）を指定できます。
   Anthropic では、対話型オンボーディング/configure は推奨ローカル手順として **Anthropic Claude CLI** を、推奨本番手順として **Anthropic API key** を提示します。Anthropic setup-token も、サポートされるトークン認証手順として引き続き利用できます。
2. **ワークスペース** — エージェントファイルの場所（デフォルト `~/.openclaw/workspace`）。ブートストラップファイルを初期配置します。
3. **Gateway** — ポート、バインドアドレス、認証モード、Tailscale 公開。
   対話型トークンモードでは、デフォルトの平文トークン保存を選ぶか、SecretRef を使用できます。
   非対話トークン SecretRef 手順: `--gateway-token-ref-env <ENV_VAR>`。
4. **チャネル** — iMessage、Discord、Feishu、Google Chat、Mattermost、Microsoft Teams、QQ Bot、Signal、Slack、Telegram、WhatsApp などの組み込みおよび公式 Plugin チャットチャネル。
5. **デーモン** — LaunchAgent（macOS）、systemd ユーザーユニット（Linux/WSL2）、またはユーザー単位の Startup フォルダーのフォールバック付きネイティブ Windows Scheduled Task をインストールします。
   トークン認証にトークンが必要で、`gateway.auth.token` が SecretRef 管理の場合、デーモンインストールはそれを検証しますが、解決済みトークンを supervisor サービス環境メタデータには永続化しません。
   トークン認証にトークンが必要で、設定されたトークン SecretRef を解決できない場合、デーモンインストールは実行可能な案内付きでブロックされます。
   `gateway.auth.token` と `gateway.auth.password` の両方が設定され、`gateway.auth.mode` が未設定の場合、モードが明示的に設定されるまでデーモンインストールはブロックされます。
6. **ヘルスチェック** — Gateway を起動し、実行中であることを検証します。
7. **Skills** — 推奨 Skills と任意の依存関係をインストールします。

<Note>
明示的に **Reset** を選択（または `--reset` を渡す）しない限り、オンボーディングの再実行で何かが消去されることは**ありません**。
CLI の `--reset` はデフォルトで設定、認証情報、セッションを対象にします。ワークスペースも含めるには `--reset-scope full` を使用します。
設定が無効、またはレガシーキーを含む場合、オンボーディングは先に `openclaw doctor` を実行するよう求めます。
</Note>

**リモートモード**は、別の場所にある Gateway へ接続するようローカルクライアントを設定するだけです。
リモートホスト上に何かをインストールしたり変更したりすることは**ありません**。

## 別のエージェントを追加する

`openclaw agents add <name>` を使用して、独自のワークスペース、セッション、認証プロファイルを持つ別個のエージェントを作成します。
`--workspace` なしで実行するとオンボーディングが起動します。

設定される項目:

- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

注記:

- デフォルトのワークスペースは `~/.openclaw/workspace-<agentId>` に従います。
- 受信メッセージをルーティングするには `bindings` を追加します（オンボーディングでも実行できます）。
- 非対話フラグ: `--model`、`--agent-dir`、`--bind`、`--non-interactive`。

## 完全なリファレンス

詳細なステップ別の内訳と設定出力については、
[CLI セットアップリファレンス](/ja-JP/start/wizard-cli-reference)を参照してください。
非対話の例については、[CLI 自動化](/ja-JP/start/wizard-cli-automation)を参照してください。
RPC の詳細を含む、より深い技術リファレンスについては、
[オンボーディングリファレンス](/ja-JP/reference/wizard)を参照してください。

## 関連ドキュメント

- CLI コマンドリファレンス: [`openclaw onboard`](/ja-JP/cli/onboard)
- オンボーディング概要: [オンボーディング概要](/ja-JP/start/onboarding-overview)
- macOS アプリのオンボーディング: [オンボーディング](/ja-JP/start/onboarding)
- エージェント初回実行の儀式: [エージェントブートストラップ](/ja-JP/start/bootstrapping)
