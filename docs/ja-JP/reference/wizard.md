---
read_when:
    - 特定のオンボーディング手順またはフラグを調べる
    - 非対話モードによるオンボーディングの自動化
    - オンボーディング動作のデバッグ
sidebarTitle: Onboarding Reference
summary: 'CLI オンボーディングの完全リファレンス: すべての手順、フラグ、設定フィールド'
title: オンボーディングリファレンス
x-i18n:
    generated_at: "2026-04-30T05:35:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 412008af223cd14f744a0b553ab82f233eb482ca9991bd418f29b09b33d93de4
    source_path: reference/wizard.md
    workflow: 16
---

これは `openclaw onboard` の完全なリファレンスです。
概要については、[オンボーディング (CLI)](/ja-JP/start/wizard) を参照してください。

## フローの詳細 (ローカルモード)

<Steps>
  <Step title="既存設定の検出">
    - `~/.openclaw/openclaw.json` が存在する場合は、**保持 / 変更 / リセット**を選択します。
    - オンボーディングを再実行しても、明示的に**リセット**を選択しない限り
      (または `--reset` を渡さない限り)、何も消去されません。
    - CLI の `--reset` は既定で `config+creds+sessions` です。workspace も削除するには `--reset-scope full`
      を使用します。
    - 設定が無効、またはレガシーキーを含む場合、ウィザードは停止し、続行する前に
      `openclaw doctor` の実行を求めます。
    - リセットでは `trash` を使用します (`rm` は使用しません)。次のスコープを提示します:
      - 設定のみ
      - 設定 + 認証情報 + セッション
      - 完全リセット (workspace も削除)

  </Step>
  <Step title="モデル/認証">
    - **Anthropic API キー**: 存在する場合は `ANTHROPIC_API_KEY` を使用し、存在しない場合はキーの入力を求めてから、daemon 用に保存します。
    - **Anthropic API キー**: オンボーディング/設定で推奨される Anthropic アシスタントの選択肢です。
    - **Anthropic setup-token**: OpenClaw は現在、利用可能な場合 Claude CLI の再利用を優先しますが、オンボーディング/設定では引き続き利用できます。
    - **OpenAI Code (Codex) サブスクリプション (OAuth)**: ブラウザーフローです。`code#state` を貼り付けます。
      - モデルが未設定、またはすでに OpenAI 系の場合、`agents.defaults.model` を `openai-codex/gpt-5.5` に設定します。
    - **OpenAI Code (Codex) サブスクリプション (デバイスペアリング)**: 短時間有効なデバイスコードを使用するブラウザーペアリングフローです。
      - モデルが未設定、またはすでに OpenAI 系の場合、`agents.defaults.model` を `openai-codex/gpt-5.5` に設定します。
    - **OpenAI API キー**: 存在する場合は `OPENAI_API_KEY` を使用し、存在しない場合はキーの入力を求めてから、認証プロファイルに保存します。
      - モデルが未設定、`openai/*`、または `openai-codex/*` の場合、`agents.defaults.model` を `openai/gpt-5.5` に設定します。
    - **xAI (Grok) API キー**: `XAI_API_KEY` の入力を求め、xAI をモデルプロバイダーとして設定します。
    - **OpenCode**: `OPENCODE_API_KEY` (または `OPENCODE_ZEN_API_KEY`。https://opencode.ai/auth で取得) の入力を求め、Zen または Go カタログを選択できるようにします。
    - **Ollama**: まず **クラウド + ローカル**、**クラウドのみ**、または**ローカルのみ**を提示します。`Cloud only` は `OLLAMA_API_KEY` の入力を求め、`https://ollama.com` を使用します。ホスト backed モードでは Ollama ベース URL の入力を求め、利用可能なモデルを検出し、必要に応じて選択されたローカルモデルを自動で pull します。`Cloud + Local` は、その Ollama ホストがクラウドアクセスにサインイン済みかどうかも確認します。
    - 詳細: [Ollama](/ja-JP/providers/ollama)
    - **API キー**: キーを保存します。
    - **Vercel AI Gateway (マルチモデルプロキシ)**: `AI_GATEWAY_API_KEY` の入力を求めます。
    - 詳細: [Vercel AI Gateway](/ja-JP/providers/vercel-ai-gateway)
    - **Cloudflare AI Gateway**: Account ID、Gateway ID、`CLOUDFLARE_AI_GATEWAY_API_KEY` の入力を求めます。
    - 詳細: [Cloudflare AI Gateway](/ja-JP/providers/cloudflare-ai-gateway)
    - **MiniMax**: 設定は自動で書き込まれます。ホスト型の既定値は `MiniMax-M2.7` です。
      API キー設定では `minimax/...` を使用し、OAuth 設定では
      `minimax-portal/...` を使用します。
    - 詳細: [MiniMax](/ja-JP/providers/minimax)
    - **StepFun**: China またはグローバルエンドポイント上の StepFun standard または Step Plan 向けに、設定が自動で書き込まれます。
    - Standard には現在 `step-3.5-flash` が含まれ、Step Plan には `step-3.5-flash-2603` も含まれます。
    - 詳細: [StepFun](/ja-JP/providers/stepfun)
    - **Synthetic (Anthropic 互換)**: `SYNTHETIC_API_KEY` の入力を求めます。
    - 詳細: [Synthetic](/ja-JP/providers/synthetic)
    - **Moonshot (Kimi K2)**: 設定は自動で書き込まれます。
    - **Kimi Coding**: 設定は自動で書き込まれます。
    - 詳細: [Moonshot AI (Kimi + Kimi Coding)](/ja-JP/providers/moonshot)
    - **スキップ**: まだ認証は設定されません。
    - 検出された選択肢から既定のモデルを選択します (または provider/model を手動で入力します)。最高の品質と低いプロンプトインジェクションリスクのために、プロバイダースタックで利用可能な最強の最新世代モデルを選択してください。
    - オンボーディングはモデルチェックを実行し、設定済みモデルが不明、または認証がない場合に警告します。
    - API キーの保存モードは、既定でプレーンテキストの認証プロファイル値です。代わりに env backed refs を保存するには、`--secret-input-mode ref` を使用します (例: `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`)。
    - 認証プロファイルは `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (API キー + OAuth) にあります。`~/.openclaw/credentials/oauth.json` はレガシーのインポート専用です。
    - 詳細: [/concepts/oauth](/ja-JP/concepts/oauth)
    <Note>
    ヘッドレス/サーバーのヒント: ブラウザーがあるマシンで OAuth を完了し、その agent の `auth-profiles.json` (例:
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`、または対応する
    `$OPENCLAW_STATE_DIR/...` パス) を Gateway ホストにコピーします。`credentials/oauth.json`
    はレガシーのインポート元にすぎません。
    </Note>
  </Step>
  <Step title="Workspace">
    - 既定は `~/.openclaw/workspace` です (設定可能)。
    - agent bootstrap ritual に必要な workspace ファイルをシードします。
    - 完全な workspace レイアウト + バックアップガイド: [Agent workspace](/ja-JP/concepts/agent-workspace)

  </Step>
  <Step title="Gateway">
    - ポート、bind、認証モード、Tailscale 公開。
    - 認証の推奨: local WS クライアントが認証を必須にするため、loopback でも **Token** を維持してください。
    - token モードでは、対話型セットアップで次を提示します:
      - **プレーンテキスト token を生成/保存** (既定)
      - **SecretRef を使用** (オプトイン)
      - クイックスタートは、オンボーディング probe/dashboard bootstrap のために、`env`、`file`、`exec` プロバイダー間で既存の `gateway.auth.token` SecretRef を再利用します。
      - その SecretRef が設定されているものの解決できない場合、オンボーディングは runtime 認証を黙って劣化させるのではなく、明確な修正メッセージとともに早期に失敗します。
    - password モードでは、対話型セットアップはプレーンテキストまたは SecretRef 保存にも対応しています。
    - 非対話型 token SecretRef パス: `--gateway-token-ref-env <ENV_VAR>`。
      - オンボーディングプロセス環境に空でない env var が必要です。
      - `--gateway-token` と組み合わせることはできません。
    - すべてのローカルプロセスを完全に信頼している場合にのみ、認証を無効にしてください。
    - 非 loopback bind では引き続き認証が必要です。

  </Step>
  <Step title="チャンネル">
    - [WhatsApp](/ja-JP/channels/whatsapp): 任意の QR ログイン。
    - [Telegram](/ja-JP/channels/telegram): bot token。
    - [Discord](/ja-JP/channels/discord): bot token。
    - [Google Chat](/ja-JP/channels/googlechat): service account JSON + webhook audience。
    - [Mattermost](/ja-JP/channels/mattermost) (プラグイン): bot token + base URL。
    - [Signal](/ja-JP/channels/signal): 任意の `signal-cli` インストール + アカウント設定。
    - [BlueBubbles](/ja-JP/channels/bluebubbles): **iMessage に推奨**。サーバー URL + password + webhook。
    - [iMessage](/ja-JP/channels/imessage): レガシー `imsg` CLI パス + DB アクセス。
    - DM セキュリティ: 既定はペアリングです。最初の DM はコードを送信します。`openclaw pairing approve <channel> <code>` で承認するか、allowlist を使用します。

  </Step>
  <Step title="Web 検索">
    - Brave、DuckDuckGo、Exa、Firecrawl、Gemini、Grok、Kimi、MiniMax Search、Ollama Web Search、Perplexity、SearXNG、Tavily などの対応プロバイダーを選択します (またはスキップします)。
    - API backed プロバイダーは素早いセットアップのために env vars または既存設定を使用できます。キー不要プロバイダーは、代わりに各プロバイダー固有の前提条件を使用します。
    - `--skip-search` でスキップします。
    - 後で設定する場合: `openclaw configure --section web`。

  </Step>
  <Step title="Daemon インストール">
    - macOS: LaunchAgent
      - ログイン済みユーザーセッションが必要です。ヘッドレスの場合はカスタム LaunchDaemon (同梱されていません) を使用してください。
    - Linux (および WSL2 経由の Windows): systemd user unit
      - オンボーディングは `loginctl enable-linger <user>` で lingering の有効化を試み、ログアウト後も Gateway が起動したままになるようにします。
      - sudo の入力を求める場合があります (`/var/lib/systemd/linger` に書き込みます)。最初は sudo なしで試行します。
    - **Runtime 選択:** Node (推奨。WhatsApp/Telegram に必要)。Bun は**推奨されません**。
    - token 認証で token が必要で、`gateway.auth.token` が SecretRef 管理の場合、daemon インストールはそれを検証しますが、解決済みのプレーンテキスト token 値を supervisor サービス環境メタデータへ永続化しません。
    - token 認証で token が必要で、設定済みの token SecretRef が未解決の場合、daemon インストールは実行可能なガイダンスとともにブロックされます。
    - `gateway.auth.token` と `gateway.auth.password` の両方が設定され、`gateway.auth.mode` が未設定の場合、mode が明示的に設定されるまで daemon インストールはブロックされます。

  </Step>
  <Step title="ヘルスチェック">
    - Gateway を開始し (必要な場合)、`openclaw health` を実行します。
    - ヒント: `openclaw status --deep` は、対応している場合のチャンネル probe を含め、ライブ Gateway ヘルス probe を status 出力に追加します (到達可能な Gateway が必要です)。

  </Step>
  <Step title="Skills (推奨)">
    - 利用可能な Skills を読み取り、要件を確認します。
    - node manager を選択できます: **npm / pnpm** (bun は非推奨)。
    - 任意の依存関係をインストールします (macOS では Homebrew を使用するものがあります)。

  </Step>
  <Step title="完了">
    - 追加機能向けの iOS/Android/macOS アプリを含む、概要 + 次のステップです。

  </Step>
</Steps>

<Note>
GUI が検出されない場合、オンボーディングはブラウザーを開く代わりに Control UI 用の SSH ポート転送手順を出力します。
Control UI アセットが見つからない場合、オンボーディングはそれらのビルドを試みます。フォールバックは `pnpm ui:build` です (UI 依存関係を自動インストールします)。
</Note>

## 非対話型モード

オンボーディングを自動化またはスクリプト化するには `--non-interactive` を使用します:

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

機械可読の概要を出力するには `--json` を追加します。

非対話型モードでの Gateway token SecretRef:

```bash
export OPENCLAW_GATEWAY_TOKEN="your-token"
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice skip \
  --gateway-auth token \
  --gateway-token-ref-env OPENCLAW_GATEWAY_TOKEN
```

`--gateway-token` と `--gateway-token-ref-env` は相互排他的です。

<Note>
`--json` は非対話型モードを意味しません。スクリプトでは `--non-interactive` (および `--workspace`) を使用してください。
</Note>

プロバイダー固有のコマンド例は [CLI Automation](/ja-JP/start/wizard-cli-automation#provider-specific-examples) にあります。
フラグの意味とステップ順序については、このリファレンスページを使用してください。

### agent を追加 (非対話型)

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.5 \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

## Gateway ウィザード RPC

Gateway は RPC (`wizard.start`、`wizard.next`、`wizard.cancel`、`wizard.status`) 経由でオンボーディングフローを公開します。
クライアント (macOS アプリ、Control UI) は、オンボーディングロジックを再実装せずにステップをレンダリングできます。

## Signal セットアップ (signal-cli)

オンボーディングは GitHub リリースから `signal-cli` をインストールできます:

- 適切なリリースアセットをダウンロードします。
- `~/.openclaw/tools/signal-cli/<version>/` 配下に保存します。
- 設定に `channels.signal.cliPath` を書き込みます。

メモ:

- JVM ビルドには **Java 21** が必要です。
- 利用可能な場合はネイティブビルドが使用されます。
- Windows は WSL2 を使用します。signal-cli のインストールは WSL 内の Linux フローに従います。

## ウィザードが書き込む内容

`~/.openclaw/openclaw.json` の典型的なフィールド:

- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers`（Minimax を選択した場合）
- `tools.profile`（未設定の場合、ローカルオンボーディングは既定で `"coding"` になります。既存の明示的な値は保持されます）
- `gateway.*`（mode、bind、auth、tailscale）
- `session.dmScope`（動作の詳細: [CLI セットアップリファレンス](/ja-JP/start/wizard-cli-reference#outputs-and-internals)）
- `channels.telegram.botToken`、`channels.discord.token`、`channels.matrix.*`、`channels.signal.*`、`channels.imessage.*`
- プロンプト中にオプトインした場合のチャンネル許可リスト（Slack/Discord/Matrix/Microsoft Teams）（可能な場合、名前は ID に解決されます）。
- `skills.install.nodeManager`
  - `setup --node-manager` は `npm`、`pnpm`、または `bun` を受け付けます。
  - 手動設定では、`skills.install.nodeManager` を直接設定することで、引き続き `yarn` を使用できます。
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` は `agents.list[]` と任意の `bindings` を書き込みます。

WhatsApp 認証情報は `~/.openclaw/credentials/whatsapp/<accountId>/` 配下に置きます。
セッションは `~/.openclaw/agents/<agentId>/sessions/` 配下に保存されます。

一部のチャンネルは plugins として提供されます。セットアップ中にいずれかを選択すると、
設定できるようになる前に、オンボーディングでそのインストール（npm またはローカルパス）が求められます。

## 関連ドキュメント

- オンボーディングの概要: [オンボーディング（CLI）](/ja-JP/start/wizard)
- macOS アプリのオンボーディング: [オンボーディング](/ja-JP/start/onboarding)
- 設定リファレンス: [Gateway 設定](/ja-JP/gateway/configuration)
- プロバイダー: [WhatsApp](/ja-JP/channels/whatsapp)、[Telegram](/ja-JP/channels/telegram)、[Discord](/ja-JP/channels/discord)、[Google Chat](/ja-JP/channels/googlechat)、[Signal](/ja-JP/channels/signal)、[BlueBubbles](/ja-JP/channels/bluebubbles)（iMessage）、[iMessage](/ja-JP/channels/imessage)（レガシー）
- Skills: [Skills](/ja-JP/tools/skills)、[Skills 設定](/ja-JP/tools/skills-config)
