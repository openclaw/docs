---
read_when:
    - 特定のオンボーディングステップやフラグを調べること
    - 非対話モードでオンボーディングを自動化すること
    - オンボーディングの動作をデバッグすること
sidebarTitle: Onboarding Reference
summary: 'CLI オンボーディングの完全リファレンス: すべてのステップ、フラグ、設定フィールド'
title: オンボーディングリファレンス
x-i18n:
    generated_at: "2026-04-25T18:21:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 729a12bac6b67b32ba4b2b2068a30240d2118f5afe3812c701ee65d7b7e13018
    source_path: reference/wizard.md
    workflow: 15
---

これは `openclaw onboard` の完全リファレンスです。
概要については、[オンボーディング（CLI）](/ja-JP/start/wizard) を参照してください。

## フローの詳細（local モード）

<Steps>
  <Step title="既存設定の検出">
    - `~/.openclaw/openclaw.json` が存在する場合は、**Keep / Modify / Reset** を選択します。
    - オンボーディングを再実行しても、明示的に **Reset** を選ばない限り
      （または `--reset` を渡さない限り）、何も消去されません。
    - CLI の `--reset` はデフォルトで `config+creds+sessions` です。workspace も削除するには
      `--reset-scope full` を使います。
    - 設定が無効、またはレガシーキーを含んでいる場合、ウィザードは停止し、
      続行前に `openclaw doctor` を実行するよう求めます。
    - Reset は `trash` を使い（`rm` は決して使わず）、次のスコープを提供します:
      - 設定のみ
      - 設定 + 認証情報 + session
      - 完全リセット（workspace も削除）

  </Step>
  <Step title="モデル/認証">
    - **Anthropic API キー**: 存在すれば `ANTHROPIC_API_KEY` を使い、なければキーの入力を求め、daemon で使えるよう保存します。
    - **Anthropic API キー**: オンボーディング/設定における推奨 Anthropic assistant 選択肢です。
    - **Anthropic setup-token**: 引き続きオンボーディング/設定で利用可能ですが、OpenClaw は現在、利用可能な場合は Claude CLI の再利用を優先します。
    - **OpenAI Code（Codex）サブスクリプション（OAuth）**: ブラウザフロー。`code#state` を貼り付けます。
      - model が未設定、またはすでに OpenAI ファミリーの場合は、`agents.defaults.model` を `openai-codex/gpt-5.5` に設定します。
    - **OpenAI Code（Codex）サブスクリプション（デバイスペアリング）**: 短命のデバイスコードを使うブラウザペアリングフロー。
      - model が未設定、またはすでに OpenAI ファミリーの場合は、`agents.defaults.model` を `openai-codex/gpt-5.5` に設定します。
    - **OpenAI API キー**: 存在すれば `OPENAI_API_KEY` を使い、なければキーの入力を求め、その後 auth profile に保存します。
      - model が未設定、`openai/*`、または `openai-codex/*` の場合は、`agents.defaults.model` を `openai/gpt-5.5` に設定します。
    - **xAI（Grok）API キー**: `XAI_API_KEY` の入力を求め、xAI をモデルプロバイダーとして設定します。
    - **OpenCode**: `OPENCODE_API_KEY`（または `OPENCODE_ZEN_API_KEY`、取得先 https://opencode.ai/auth）の入力を求め、Zen または Go catalog を選択できます。
    - **Ollama**: 最初に **Cloud + Local**、**Cloud only**、**Local only** を提示します。`Cloud only` は `OLLAMA_API_KEY` の入力を求めて `https://ollama.com` を使います。ホスト利用モードでは Ollama base URL の入力を求め、利用可能なモデルを検出し、必要に応じて選択したローカルモデルを自動 pull します。`Cloud + Local` では、その Ollama ホストがクラウドアクセス用にサインイン済みかどうかも確認します。
    - 詳細: [Ollama](/ja-JP/providers/ollama)
    - **API キー**: キーを保存します。
    - **Vercel AI Gateway（マルチモデルプロキシ）**: `AI_GATEWAY_API_KEY` の入力を求めます。
    - 詳細: [Vercel AI Gateway](/ja-JP/providers/vercel-ai-gateway)
    - **Cloudflare AI Gateway**: Account ID、Gateway ID、`CLOUDFLARE_AI_GATEWAY_API_KEY` の入力を求めます。
    - 詳細: [Cloudflare AI Gateway](/ja-JP/providers/cloudflare-ai-gateway)
    - **MiniMax**: 設定は自動書き込みされます。ホスト版のデフォルトは `MiniMax-M2.7` です。
      API キー設定では `minimax/...` を使い、OAuth 設定では
      `minimax-portal/...` を使います。
    - 詳細: [MiniMax](/ja-JP/providers/minimax)
    - **StepFun**: China または global endpoint 上の StepFun standard または Step Plan 用に設定が自動書き込みされます。
    - 現在、Standard には `step-3.5-flash` が含まれ、Step Plan には `step-3.5-flash-2603` も含まれます。
    - 詳細: [StepFun](/ja-JP/providers/stepfun)
    - **Synthetic（Anthropic 互換）**: `SYNTHETIC_API_KEY` の入力を求めます。
    - 詳細: [Synthetic](/ja-JP/providers/synthetic)
    - **Moonshot（Kimi K2）**: 設定は自動書き込みされます。
    - **Kimi Coding**: 設定は自動書き込みされます。
    - 詳細: [Moonshot AI（Kimi + Kimi Coding）](/ja-JP/providers/moonshot)
    - **Skip**: まだ認証は設定しません。
    - 検出された選択肢からデフォルト model を選択します（または provider/model を手動入力します）。最良の品質とより低い prompt-injection リスクのため、利用可能なプロバイダースタック内で最も強力な最新世代モデルを選んでください。
    - オンボーディングは model チェックを実行し、設定済み model が不明または認証不足の場合は警告します。
    - API キー保存モードのデフォルトは平文 auth-profile 値です。代わりに env バックの ref を保存するには `--secret-input-mode ref` を使います（例: `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`）。
    - auth profile は `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` に保存されます（API キー + OAuth）。`~/.openclaw/credentials/oauth.json` はレガシーのインポート専用です。
    - 詳細: [/concepts/oauth](/ja-JP/concepts/oauth)
    <Note>
    ヘッドレス/サーバーのヒント: ブラウザのあるマシンで OAuth を完了してから、
    その agent の `auth-profiles.json`（たとえば
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`、または対応する
    `$OPENCLAW_STATE_DIR/...` パス）を gateway ホストへコピーします。`credentials/oauth.json`
    はレガシーのインポート元にすぎません。
    </Note>
  </Step>
  <Step title="Workspace">
    - デフォルトは `~/.openclaw/workspace`（設定可能）です。
    - エージェント bootstrap ritual に必要な workspace ファイルをシードします。
    - 完全な workspace レイアウト + バックアップガイド: [Agent workspace](/ja-JP/concepts/agent-workspace)

  </Step>
  <Step title="Gateway">
    - Port、bind、auth mode、Tailscale 公開。
    - 認証の推奨: loopback であっても **Token** を維持し、ローカル WS クライアントにも認証を必須にします。
    - token モードでは、対話セットアップで次を提供します:
      - **平文 token を生成/保存**（デフォルト）
      - **SecretRef を使う**（オプトイン）
      - Quickstart はオンボーディング probe/dashboard bootstrap 用に、既存の `gateway.auth.token` SecretRef を `env`、`file`、`exec` プロバイダー全体で再利用します。
      - その SecretRef が設定されていても解決できない場合、オンボーディングはランタイム認証を黙って劣化させるのではなく、明確な修正メッセージを出して早期に失敗します。
    - password モードでも、対話セットアップは平文または SecretRef 保存をサポートします。
    - 非対話 token SecretRef パス: `--gateway-token-ref-env <ENV_VAR>`。
      - オンボーディングプロセス環境内に空でない環境変数が必要です。
      - `--gateway-token` とは併用できません。
    - すべてのローカルプロセスを完全に信頼している場合にのみ認証を無効化してください。
    - 非 loopback bind では引き続き認証が必要です。

  </Step>
  <Step title="Channels">
    - [WhatsApp](/ja-JP/channels/whatsapp): 任意の QR ログイン。
    - [Telegram](/ja-JP/channels/telegram): bot token。
    - [Discord](/ja-JP/channels/discord): bot token。
    - [Google Chat](/ja-JP/channels/googlechat): service account JSON + webhook audience。
    - [Mattermost](/ja-JP/channels/mattermost)（Plugin）: bot token + base URL。
    - [Signal](/ja-JP/channels/signal): 任意の `signal-cli` インストール + account 設定。
    - [BlueBubbles](/ja-JP/channels/bluebubbles): **iMessage には推奨**。server URL + password + webhook。
    - [iMessage](/ja-JP/channels/imessage): レガシー `imsg` CLI パス + DB アクセス。
    - DM セキュリティ: デフォルトはペアリングです。最初の DM はコードを送信します。`openclaw pairing approve <channel> <code>` で承認するか、allowlist を使います。

  </Step>
  <Step title="Web 検索">
    - Brave、DuckDuckGo、Exa、Firecrawl、Gemini、Grok、Kimi、MiniMax Search、Ollama Web Search、Perplexity、SearXNG、Tavily などのサポート対象プロバイダーを選択します（またはスキップします）。
    - API バックのプロバイダーでは、クイックセットアップのために環境変数または既存設定を使えます。キーレスのプロバイダーでは、それぞれのプロバイダー固有の前提条件を使います。
    - `--skip-search` でスキップします。
    - 後で設定する場合: `openclaw configure --section web`。

  </Step>
  <Step title="Daemon インストール">
    - macOS: LaunchAgent
      - ログイン済みユーザー session が必要です。ヘッドレス用には、カスタム LaunchDaemon を使ってください（同梱されていません）。
    - Linux（および WSL2 経由の Windows）: systemd user unit
      - オンボーディングは、logout 後も Gateway が起動し続けるよう `loginctl enable-linger <user>` で lingering を有効化しようとします。
      - sudo を求めることがあります（`/var/lib/systemd/linger` に書き込みます）。最初に sudo なしで試します。
    - **Runtime 選択:** Node（推奨。WhatsApp/Telegram に必須）。Bun は **推奨されません**。
    - token 認証で token が必要かつ `gateway.auth.token` が SecretRef 管理されている場合、daemon インストールはそれを検証しますが、解決済みの平文 token 値を supervisor service 環境メタデータに永続保存しません。
    - token 認証で token が必要かつ設定済み token SecretRef が未解決の場合、daemon インストールは実行可能なガイダンス付きでブロックされます。
    - `gateway.auth.token` と `gateway.auth.password` の両方が設定されていて、`gateway.auth.mode` が未設定の場合、mode が明示的に設定されるまで daemon インストールはブロックされます。

  </Step>
  <Step title="ヘルスチェック">
    - 必要に応じて Gateway を起動し、`openclaw health` を実行します。
    - ヒント: `openclaw status --deep` は、サポートされる場合は channel probe を含むライブ gateway health probe を status 出力に追加します（到達可能な gateway が必要です）。

  </Step>
  <Step title="Skills（推奨）">
    - 利用可能な Skills を読み取り、要件を確認します。
    - node manager として **npm / pnpm** を選択できます（bun は推奨されません）。
    - 任意の依存関係をインストールします（一部は macOS で Homebrew を使います）。

  </Step>
  <Step title="完了">
    - 追加機能向けの iOS/Android/macOS アプリを含む、要約と次のステップ。

  </Step>
</Steps>

<Note>
GUI が検出されない場合、オンボーディングはブラウザを開く代わりに Control UI 用の SSH port-forward 手順を表示します。
Control UI アセットが存在しない場合、オンボーディングはそれらのビルドを試みます。フォールバックは `pnpm ui:build` です（UI 依存関係を自動インストールします）。
</Note>

## 非対話モード

オンボーディングを自動化またはスクリプト化するには `--non-interactive` を使います:

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

機械可読な要約には `--json` を追加します。

非対話モードでの Gateway token SecretRef:

```bash
export OPENCLAW_GATEWAY_TOKEN="your-token"
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice skip \
  --gateway-auth token \
  --gateway-token-ref-env OPENCLAW_GATEWAY_TOKEN
```

`--gateway-token` と `--gateway-token-ref-env` は相互排他です。

<Note>
`--json` は非対話モードを意味しません。スクリプトでは `--non-interactive`（および `--workspace`）を使ってください。
</Note>

プロバイダー固有のコマンド例は [CLI 自動化](/ja-JP/start/wizard-cli-automation#provider-specific-examples) にあります。
このリファレンスページは、フラグの意味とステップ順序の確認に使ってください。

### agent を追加する（非対話）

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.5 \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

## Gateway ウィザード RPC

Gateway は RPC（`wizard.start`、`wizard.next`、`wizard.cancel`、`wizard.status`）経由でオンボーディングフローを公開します。
クライアント（macOS アプリ、Control UI）は、オンボーディングロジックを再実装せずにステップを描画できます。

## Signal セットアップ（signal-cli）

オンボーディングは GitHub releases から `signal-cli` をインストールできます:

- 適切な release asset をダウンロードします。
- `~/.openclaw/tools/signal-cli/<version>/` に保存します。
- 設定に `channels.signal.cliPath` を書き込みます。

注記:

- JVM ビルドには **Java 21** が必要です。
- 利用可能な場合はネイティブビルドが使われます。
- Windows では WSL2 を使い、signal-cli のインストールは WSL 内で Linux フローに従います。

## ウィザードが書き込む内容

`~/.openclaw/openclaw.json` の典型的なフィールド:

- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers`（MiniMax を選んだ場合）
- `tools.profile`（local オンボーディングでは未設定時にデフォルトで `"coding"` になります。既存の明示的な値は保持されます）
- `gateway.*`（mode、bind、auth、Tailscale）
- `session.dmScope`（動作の詳細: [CLI セットアップリファレンス](/ja-JP/start/wizard-cli-reference#outputs-and-internals)）
- `channels.telegram.botToken`、`channels.discord.token`、`channels.matrix.*`、`channels.signal.*`、`channels.imessage.*`
- プロンプト中にオプトインした場合の channel allowlist（Slack/Discord/Matrix/Microsoft Teams）。可能な場合は名前が ID に解決されます。
- `skills.install.nodeManager`
  - `setup --node-manager` は `npm`、`pnpm`、`bun` を受け付けます。
  - 手動設定では、`skills.install.nodeManager` を直接設定することで引き続き `yarn` を使えます。
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` は `agents.list[]` と任意の `bindings` を書き込みます。

WhatsApp の認証情報は `~/.openclaw/credentials/whatsapp/<accountId>/` 配下に保存されます。
session は `~/.openclaw/agents/<agentId>/sessions/` 配下に保存されます。

一部の channel は Plugin として提供されます。セットアップ中にそれらを選ぶと、オンボーディングは
設定前にそれをインストールするよう求めます（npm またはローカルパス）。

## 関連ドキュメント

- オンボーディング概要: [オンボーディング（CLI）](/ja-JP/start/wizard)
- macOS アプリのオンボーディング: [オンボーディング](/ja-JP/start/onboarding)
- 設定リファレンス: [Gateway 設定](/ja-JP/gateway/configuration)
- プロバイダー: [WhatsApp](/ja-JP/channels/whatsapp)、[Telegram](/ja-JP/channels/telegram)、[Discord](/ja-JP/channels/discord)、[Google Chat](/ja-JP/channels/googlechat)、[Signal](/ja-JP/channels/signal)、[BlueBubbles](/ja-JP/channels/bluebubbles)（iMessage）、[iMessage](/ja-JP/channels/imessage)（レガシー）
- Skills: [Skills](/ja-JP/tools/skills)、[Skills 設定](/ja-JP/tools/skills-config)
