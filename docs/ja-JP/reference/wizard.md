---
read_when:
    - 特定のオンボーディング手順またはフラグを調べている場合
    - 非対話モードでオンボーディングを自動化している場合
    - オンボーディングの動作をデバッグしている場合
sidebarTitle: Onboarding Reference
summary: 'CLIオンボーディングの完全リファレンス: すべてのステップ、フラグ、および設定フィールド'
title: オンボーディングリファレンス
x-i18n:
    generated_at: "2026-04-24T05:20:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3f191b7d8a6d47638d9d0c9acf47a286225174c580aa0db89cf0c208d47ffee5
    source_path: reference/wizard.md
    workflow: 15
---

これは`openclaw onboard`の完全リファレンスです。
概要については[Onboarding (CLI)](/ja-JP/start/wizard)を参照してください。

## フロー詳細（localモード）

<Steps>
  <Step title="既存設定の検出">
    - `~/.openclaw/openclaw.json`が存在する場合、**Keep / Modify / Reset**を選択します。
    - オンボーディングを再実行しても、明示的に**Reset**を選ばない限り
      （または`--reset`を渡さない限り）、何も消去されません。
    - CLIの`--reset`はデフォルトで`config+creds+sessions`です。ワークスペースも削除するには`--reset-scope full`
      を使用してください。
    - 設定が無効、またはレガシーキーを含む場合、ウィザードは停止し、
      続行前に`openclaw doctor`を実行するよう求めます。
    - Resetは`trash`を使用し（`rm`は使いません）、次のスコープを提示します:
      - 設定のみ
      - 設定 + 資格情報 + セッション
      - 完全リセット（ワークスペースも削除）
  </Step>
  <Step title="モデル/認証">
    - **Anthropic API key**: `ANTHROPIC_API_KEY`があればそれを使用し、なければkeyを尋ね、その後daemon用に保存します。
    - **Anthropic API key**: onboarding/configureにおける推奨Anthropicアシスタント選択です。
    - **Anthropic setup-token**: onboarding/configureでは引き続き利用可能ですが、OpenClawは現在、利用可能ならClaude CLI再利用を優先します。
    - **OpenAI Code (Codex) subscription (OAuth)**: ブラウザーフロー。`code#state`を貼り付けます。
      - モデルが未設定、またはすでにOpenAI系である場合、`agents.defaults.model`を`openai-codex/gpt-5.5`に設定します。
    - **OpenAI Code (Codex) subscription (device pairing)**: 短命なdevice codeを使うブラウザーペアリングフロー。
      - モデルが未設定、またはすでにOpenAI系である場合、`agents.defaults.model`を`openai-codex/gpt-5.5`に設定します。
    - **OpenAI API key**: `OPENAI_API_KEY`があればそれを使用し、なければkeyを尋ね、その後auth profilesに保存します。
      - モデルが未設定、`openai/*`、または`openai-codex/*`である場合、`agents.defaults.model`を`openai/gpt-5.4`に設定します。
    - **xAI (Grok) API key**: `XAI_API_KEY`を尋ね、xAIをモデルプロバイダーとして設定します。
    - **OpenCode**: `OPENCODE_API_KEY`（または`OPENCODE_ZEN_API_KEY`、取得先はhttps://opencode.ai/auth）を尋ね、ZenまたはGoカタログを選ばせます。
    - **Ollama**: 最初に**Cloud + Local**、**Cloud only**、または**Local only**を提示します。`Cloud only`は`OLLAMA_API_KEY`を尋ねて`https://ollama.com`を使用します。ホストバックのモードではOllama base URLを尋ね、利用可能モデルを検出し、必要なら選択したローカルモデルを自動pullします。`Cloud + Local`では、そのOllamaホストがcloudアクセス用にサインイン済みかも確認します。
    - 詳細: [Ollama](/ja-JP/providers/ollama)
    - **API key**: keyを保存します。
    - **Vercel AI Gateway (multi-model proxy)**: `AI_GATEWAY_API_KEY`を尋ねます。
    - 詳細: [Vercel AI Gateway](/ja-JP/providers/vercel-ai-gateway)
    - **Cloudflare AI Gateway**: Account ID、Gateway ID、および`CLOUDFLARE_AI_GATEWAY_API_KEY`を尋ねます。
    - 詳細: [Cloudflare AI Gateway](/ja-JP/providers/cloudflare-ai-gateway)
    - **MiniMax**: 設定は自動で書き込まれます。ホストデフォルトは`MiniMax-M2.7`です。
      API-keyセットアップでは`minimax/...`を使い、OAuthセットアップでは
      `minimax-portal/...`を使います。
    - 詳細: [MiniMax](/ja-JP/providers/minimax)
    - **StepFun**: Chinaまたはglobal endpoint上のStepFun standardまたはStep Plan向けに設定が自動書き込みされます。
    - Standardには現在`step-3.5-flash`が含まれ、Step Planには`step-3.5-flash-2603`も含まれます。
    - 詳細: [StepFun](/ja-JP/providers/stepfun)
    - **Synthetic (Anthropic-compatible)**: `SYNTHETIC_API_KEY`を尋ねます。
    - 詳細: [Synthetic](/ja-JP/providers/synthetic)
    - **Moonshot (Kimi K2)**: 設定は自動で書き込まれます。
    - **Kimi Coding**: 設定は自動で書き込まれます。
    - 詳細: [Moonshot AI (Kimi + Kimi Coding)](/ja-JP/providers/moonshot)
    - **Skip**: まだ認証を設定しません。
    - 検出された選択肢からデフォルトモデルを選びます（またはprovider/modelを手入力します）。品質を最大化し、prompt-injectionリスクを下げるには、利用可能なprovider stackの中で最も強い最新世代モデルを選んでください。
    - オンボーディングはモデルチェックを実行し、設定されたモデルが未知、または認証不足なら警告します。
    - API key保存モードは、デフォルトで平文のauth-profile値です。代わりにenvバックrefを保存するには`--secret-input-mode ref`を使用してください（例: `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`）。
    - Auth profilesは`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`にあります（API keys + OAuth）。`~/.openclaw/credentials/oauth.json`はレガシーのimport専用です。
    - 詳細: [/concepts/oauth](/ja-JP/concepts/oauth)
    <Note>
    ヘッドレス/サーバー向けのヒント: ブラウザーのあるマシンでOAuthを完了し、その後
    そのエージェントの`auth-profiles.json`（例:
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`、または対応する
    `$OPENCLAW_STATE_DIR/...`パス）をgatewayホストへコピーしてください。`credentials/oauth.json`
    はレガシーなimport元にすぎません。
    </Note>
  </Step>
  <Step title="ワークスペース">
    - デフォルトは`~/.openclaw/workspace`（変更可能）。
    - エージェントbootstrap儀式に必要なワークスペースファイルをseedします。
    - 完全なワークスペースレイアウト + バックアップガイド: [Agent workspace](/ja-JP/concepts/agent-workspace)
  </Step>
  <Step title="Gateway">
    - ポート、bind、認証モード、tailscale公開。
    - 認証推奨: loopbackでも**Token**を維持し、ローカルWSクライアントにも認証を必須にしてください。
    - tokenモードでは、対話セットアップが次を提示します:
      - **平文tokenを生成/保存**（デフォルト）
      - **Use SecretRef**（オプトイン）
      - Quickstartは、オンボーディングのprobe/dashboard bootstrap用に、`env`、`file`、`exec`プロバイダーにまたがって既存の`gateway.auth.token` SecretRefを再利用します。
      - そのSecretRefが設定されているが解決できない場合、オンボーディングはランタイム認証を静かに劣化させるのではなく、明確な修正メッセージ付きで早期に失敗します。
    - passwordモードでも、対話セットアップは平文またはSecretRef保存をサポートします。
    - 非対話型token SecretRefパス: `--gateway-token-ref-env <ENV_VAR>`。
      - オンボーディングプロセス環境に空でないenv varが必要です。
      - `--gateway-token`とは併用できません。
    - authを無効にするのは、すべてのローカルプロセスを完全に信頼する場合だけにしてください。
    - 非loopback bindでも引き続き認証が必要です。
  </Step>
  <Step title="チャネル">
    - [WhatsApp](/ja-JP/channels/whatsapp): 任意のQRログイン。
    - [Telegram](/ja-JP/channels/telegram): bot token。
    - [Discord](/ja-JP/channels/discord): bot token。
    - [Google Chat](/ja-JP/channels/googlechat): service account JSON + webhook audience。
    - [Mattermost](/ja-JP/channels/mattermost)（Plugin）: bot token + base URL。
    - [Signal](/ja-JP/channels/signal): 任意の`signal-cli`インストール + account設定。
    - [BlueBubbles](/ja-JP/channels/bluebubbles): **iMessageには推奨**。server URL + password + webhook。
    - [iMessage](/ja-JP/channels/imessage): レガシー`imsg` CLIパス + DBアクセス。
    - DMセキュリティ: デフォルトはpairingです。最初のDMはコードを送信します。`openclaw pairing approve <channel> <code>`で承認するか、allowlistを使用してください。
  </Step>
  <Step title="Web検索">
    - Brave、DuckDuckGo、Exa、Firecrawl、Gemini、Grok、Kimi、MiniMax Search、Ollama Web Search、Perplexity、SearXNG、またはTavilyのようなサポート対象providerを選びます（またはスキップ）。
    - APIバックproviderは、env varsまたは既存設定をクイックセットアップに使用できます。key不要providerは、各provider固有の前提条件を使用します。
    - `--skip-search`でスキップできます。
    - 後で設定するには: `openclaw configure --section web`。
  </Step>
  <Step title="Daemonインストール">
    - macOS: LaunchAgent
      - ログイン済みユーザーセッションが必要です。ヘッドレス用にはcustom LaunchDaemonを使ってください（同梱されていません）。
    - Linux（およびWSL2経由のWindows）: systemd user unit
      - オンボーディングは、ログアウト後もGatewayが動作するよう`loginctl enable-linger <user>`でlingering有効化を試みます。
      - sudoを求める場合があります（`/var/lib/systemd/linger`へ書き込み）。まずsudoなしで試します。
    - **ランタイム選択:** Node（推奨。WhatsApp/Telegramに必要）。Bunは**非推奨**です。
    - token認証でトークンが必要かつ`gateway.auth.token`がSecretRef管理されている場合、daemonインストールはそれを検証しますが、解決済み平文token値をsupervisor service環境メタデータへ永続化しません。
    - token認証でトークンが必要かつ設定済みtoken SecretRefが未解決の場合、daemonインストールは実行可能なガイダンス付きでブロックされます。
    - `gateway.auth.token`と`gateway.auth.password`の両方が設定されており、`gateway.auth.mode`が未設定の場合、daemonインストールはモードが明示設定されるまでブロックされます。
  </Step>
  <Step title="ヘルスチェック">
    - 必要ならGatewayを起動し、`openclaw health`を実行します。
    - ヒント: `openclaw status --deep`は、live gateway health probeをstatus出力へ追加します。サポートされる場合はchannel probeも含まれます（到達可能なgatewayが必要）。
  </Step>
  <Step title="Skills（推奨）">
    - 利用可能なSkillsを読み取り、要件を確認します。
    - Node managerを選ばせます: **npm / pnpm**（bunは非推奨）。
    - 任意の依存関係をインストールします（一部はmacOSでHomebrewを使用）。
  </Step>
  <Step title="完了">
    - 概要 + 次のステップ。iOS/Android/macOSアプリによる追加機能も含みます。
  </Step>
</Steps>

<Note>
GUIが検出されない場合、オンボーディングはブラウザーを開く代わりに、Control UI用のSSH port-forward手順を表示します。
Control UIアセットが欠けている場合、オンボーディングはそれらのビルドを試みます。フォールバックは`pnpm ui:build`です（UI依存関係を自動インストールします）。
</Note>

## 非対話モード

オンボーディングの自動化またはスクリプト化には`--non-interactive`を使用します。

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice apiKey \
  --anthropic-api-key "$ANTHROPIC_API_KEY" \
  --gateway-port 18789 \
  --gateway-bind loopback \
  --install-daemon \
  --daemon-runtime node \
  --skip-skills
```

機械可読サマリーには`--json`を追加してください。

非対話モードでのGateway token SecretRef:

```bash
export OPENCLAW_GATEWAY_TOKEN="your-token"
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice skip \
  --gateway-auth token \
  --gateway-token-ref-env OPENCLAW_GATEWAY_TOKEN
```

`--gateway-token`と`--gateway-token-ref-env`は相互排他的です。

<Note>
`--json`は**非対話モードを意味しません**。スクリプトでは`--non-interactive`（および`--workspace`）を使用してください。
</Note>

プロバイダー固有のコマンド例は[CLI Automation](/ja-JP/start/wizard-cli-automation#provider-specific-examples)にあります。
このリファレンスページはフラグのセマンティクスと手順順序に使用してください。

### エージェント追加（非対話）

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.4 \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

## Gateway wizard RPC

Gatewayは、オンボーディングフローをRPC（`wizard.start`、`wizard.next`、`wizard.cancel`、`wizard.status`）経由で公開します。
クライアント（macOSアプリ、Control UI）は、オンボーディングロジックを再実装せずにステップを描画できます。

## Signalセットアップ（signal-cli）

オンボーディングは、GitHub releasesから`signal-cli`をインストールできます。

- 適切なrelease assetをダウンロードする。
- `~/.openclaw/tools/signal-cli/<version>/`配下へ保存する。
- `channels.signal.cliPath`を設定へ書き込む。

注意:

- JVMビルドには**Java 21**が必要です。
- 利用可能な場合はネイティブビルドが使用されます。
- WindowsではWSL2を使用し、signal-cliインストールはWSL内のLinuxフローに従います。

## ウィザードが書き込むもの

`~/.openclaw/openclaw.json`内の典型的なフィールド:

- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers`（MiniMaxを選んだ場合）
- `tools.profile`（ローカルオンボーディングでは、未設定ならデフォルトで`"coding"`。既存の明示値は保持されます）
- `gateway.*`（mode、bind、auth、tailscale）
- `session.dmScope`（動作詳細: [CLI Setup Reference](/ja-JP/start/wizard-cli-reference#outputs-and-internals)）
- `channels.telegram.botToken`、`channels.discord.token`、`channels.matrix.*`、`channels.signal.*`、`channels.imessage.*`
- プロンプト中にオプトインした場合のチャネルallowlist（Slack/Discord/Matrix/Microsoft Teams）（可能な場合は名前がIDへ解決されます）。
- `skills.install.nodeManager`
  - `setup --node-manager`は`npm`、`pnpm`、または`bun`を受け付けます。
  - 手動設定では、`skills.install.nodeManager`を直接設定することで引き続き`yarn`も使えます。
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add`は`agents.list[]`と任意の`bindings`を書き込みます。

WhatsApp資格情報は`~/.openclaw/credentials/whatsapp/<accountId>/`の下に置かれます。
セッションは`~/.openclaw/agents/<agentId>/sessions/`の下に保存されます。

一部チャネルはPluginとして提供されます。セットアップ中にそれらを選んだ場合、オンボーディングは
設定前にインストール（npmまたはローカルパス）を促します。

## 関連ドキュメント

- オンボーディング概要: [Onboarding (CLI)](/ja-JP/start/wizard)
- macOSアプリのオンボーディング: [Onboarding](/ja-JP/start/onboarding)
- 設定リファレンス: [Gateway configuration](/ja-JP/gateway/configuration)
- Providers: [WhatsApp](/ja-JP/channels/whatsapp)、[Telegram](/ja-JP/channels/telegram)、[Discord](/ja-JP/channels/discord)、[Google Chat](/ja-JP/channels/googlechat)、[Signal](/ja-JP/channels/signal)、[BlueBubbles](/ja-JP/channels/bluebubbles)（iMessage）、[iMessage](/ja-JP/channels/imessage)（レガシー）
- Skills: [Skills](/ja-JP/tools/skills)、[Skills config](/ja-JP/tools/skills-config)
