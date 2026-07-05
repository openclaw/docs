---
read_when:
    - 特定のオンボーディング手順またはフラグを調べる
    - 非対話モードでオンボーディングを自動化する
    - オンボーディング動作のデバッグ
sidebarTitle: Onboarding Reference
summary: 'CLI オンボーディングの完全リファレンス: すべての手順、フラグ、設定フィールド'
title: オンボーディングリファレンス
x-i18n:
    generated_at: "2026-07-05T11:50:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d1f85ca510c55ad572ce7595faebe4461567785b18851914a5f7818615c517a3
    source_path: reference/wizard.md
    workflow: 16
---

これは `openclaw onboard` の完全なリファレンスです。
概要は [オンボーディング (CLI)](/ja-JP/start/wizard) を参照してください。手順ごとの
挙動と出力については、[CLI セットアップリファレンス](/ja-JP/start/wizard-cli-reference) を参照してください。

## フローの詳細 (ローカルモード)

<Steps>
  <Step title="リセット (任意)">
    - `--reset` はセットアップ実行前に状態をリセットします。指定しない場合、オンボーディングを再実行しても
      既存の設定を保持し、それをデフォルトとして再利用します。
    - `--reset-scope` は `--reset` が削除する対象を制御します: `config` (設定ファイル
      のみ)、`config+creds+sessions` (デフォルト)、または `full` (ワークスペースも
      削除)。
    - 設定ファイルが無効な場合、オンボーディングは停止し、先に
      `openclaw doctor` を実行してからセットアップを再実行するよう案内します。
    - リセットは状態をゴミ箱に移動します (直接削除はしません)。

  </Step>
  <Step title="リスク確認">
    - 初回実行時 (または `wizard.securityAcknowledgedAt` が設定される前の任意の実行時) は、
      エージェントが強力であり、システム全体へのアクセスにはリスクがあることを理解しているか確認します。
    - `--non-interactive` では `--accept-risk` が明示的に必要です。指定しない場合、
      オンボーディングはプロンプトを出さずにエラーで終了します。
    - 対話型実行ではフラグの代わりに確認プロンプトが表示されます。拒否すると
      セットアップはキャンセルされます。

  </Step>
  <Step title="モデル/認証">
    - **Anthropic API キー**: 存在する場合は `ANTHROPIC_API_KEY` を使用し、なければキーの入力を求めて、デーモン用に保存します。
    - **Anthropic Claude CLI**: Claude CLI のサインインがすでに存在する場合に推奨されるローカルパスです。OpenClaw は代替として Anthropic setup-token 認証も引き続きサポートします。
    - **OpenAI Code (Codex) サブスクリプション (OAuth)**: ブラウザフローです。`code#state` を貼り付けます。
      - モデルが未設定、またはすでに OpenAI ファミリーの場合、Codex ランタイム経由で `agents.defaults.model` を `openai/gpt-5.5` に設定します。
    - **OpenAI Code (Codex) サブスクリプション (デバイスペアリング)**: 短命のデバイスコードを使うブラウザペアリングフローです。
      - モデルが未設定、またはすでに OpenAI ファミリーの場合、Codex ランタイム経由で `agents.defaults.model` を `openai/gpt-5.5` に設定します。
    - **OpenAI API キー**: 存在する場合は `OPENAI_API_KEY` を使用し、なければキーの入力を求めて、認証プロファイルに保存します。
      - モデルが未設定、`openai/*`、またはレガシー Codex モデル参照の場合、`agents.defaults.model` を `openai/gpt-5.5` に設定します。
    - **xAI OAuth**: localhost コールバック不要のデバイスコードブラウザサインインなので、SSH/Docker/VPS 経由でも動作します (`--auth-choice xai-oauth`)。
    - **xAI API キー**: `XAI_API_KEY` の入力を求めます (`--auth-choice xai-api-key`)。
    - `--auth-choice xai-device-code` は、同じ xAI OAuth デバイスコードフローの手動専用互換エイリアスとして引き続き動作します。新しいスクリプトでは `xai-oauth` を使用してください。
    - **OpenCode**: `OPENCODE_API_KEY` (または `OPENCODE_ZEN_API_KEY`、https://opencode.ai/auth で取得) の入力を求め、Zen または Go カタログを選択できます。
    - **Ollama**: まず **クラウド + ローカル**、**クラウドのみ**、または **ローカルのみ** を提示します。`Cloud only` は `OLLAMA_API_KEY` の入力を求め、`https://ollama.com` を使用します。ホスト連携モードでは Ollama ベース URL (デフォルト `http://127.0.0.1:11434`) の入力を求め、利用可能なモデルを検出し、必要に応じて選択したローカルモデルを自動で pull します。`Cloud + Local` では、その Ollama ホストがクラウドアクセスにサインイン済みかどうかも確認します。
    - 詳細: [Ollama](/ja-JP/providers/ollama)
    - **API キー**: キーを保存します。
    - **Vercel AI Gateway (マルチモデルプロキシ)**: `AI_GATEWAY_API_KEY` の入力を求めます。
    - 詳細: [Vercel AI Gateway](/ja-JP/providers/vercel-ai-gateway)
    - **Cloudflare AI Gateway**: アカウント ID、Gateway ID、`CLOUDFLARE_AI_GATEWAY_API_KEY` の入力を求めます。
    - 詳細: [Cloudflare AI Gateway](/ja-JP/providers/cloudflare-ai-gateway)
    - **MiniMax**: 設定は自動で書き込まれます。ホスト型のデフォルトは `MiniMax-M3` です。
      API キーセットアップでは `minimax/...` を使用し、OAuth セットアップでは
      `minimax-portal/...` を使用します。
    - 詳細: [MiniMax](/ja-JP/providers/minimax)
    - **StepFun**: China またはグローバルエンドポイント上の StepFun standard または Step Plan 向けに設定が自動で書き込まれます。
    - Standard は現在 `step-3.5-flash` がデフォルトです。Step Plan には `step-3.5-flash-2603` も含まれます。
    - 詳細: [StepFun](/ja-JP/providers/stepfun)
    - **Synthetic (Anthropic 互換)**: `SYNTHETIC_API_KEY` の入力を求めます。
    - 詳細: [Synthetic](/ja-JP/providers/synthetic)
    - **Moonshot (Kimi K2)**: 設定は自動で書き込まれます。
    - **Kimi Coding**: 設定は自動で書き込まれます。
    - 詳細: [Moonshot AI (Kimi + Kimi Coding)](/ja-JP/providers/moonshot)
    - **カスタムプロバイダー**: OpenAI 互換、OpenAI Responses 互換、または Anthropic 互換のエンドポイントで動作します。非対話型フラグ: `--auth-choice custom-api-key`、`--custom-base-url`、`--custom-model-id`、`--custom-api-key` (任意。`CUSTOM_API_KEY` にフォールバック)、`--custom-provider-id` (任意。ベース URL から自動導出)、`--custom-compatibility openai|openai-responses|anthropic` (デフォルト `openai`)、`--custom-image-input` / `--custom-text-input` (推論された vision-model 検出を上書き)。
    - **スキップ**: まだ認証は設定されません。
    - 検出されたオプションからデフォルトモデルを選択します (またはプロバイダー/モデルを手動入力します)。最高の品質と低いプロンプトインジェクションリスクのために、プロバイダースタックで利用可能な最も強力な最新世代モデルを選択してください。
    - オンボーディングはモデルチェックを実行し、設定済みモデルが不明または認証不足の場合に警告します。
    - API キー保存モードは、デフォルトでプレーンテキストの認証プロファイル値です。代わりに環境変数ベースの参照を保存するには `--secret-input-mode ref` を使用します (例: `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`)。参照先の環境変数はすでに設定されている必要があり、未設定の場合オンボーディングは即座に失敗します。
    - 認証プロファイルは `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (API キー + OAuth) にあります。`~/.openclaw/credentials/oauth.json` はレガシーのインポート専用です。
    - 詳細: [OAuth](/ja-JP/concepts/oauth)
    <Note>
    ヘッドレス/サーバー向けのヒント: ブラウザのあるマシンで OAuth を完了してから、
    そのエージェントの `auth-profiles.json` (例:
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`、または対応する
    `$OPENCLAW_STATE_DIR/...` パス) を Gateway ホストにコピーします。`credentials/oauth.json`
    はレガシーのインポート元にすぎません。
    </Note>
  </Step>
  <Step title="ワークスペース">
    - デフォルトは `~/.openclaw/workspace` (設定可能)。
    - エージェントのブートストラップ儀式に必要なワークスペースファイルをシードします。
    - 完全なワークスペースレイアウト + バックアップガイド: [エージェントワークスペース](/ja-JP/concepts/agent-workspace)

  </Step>
  <Step title="Gateway">
    - ポート (デフォルト **18789**)、バインド、認証モード、Tailscale 公開。
    - 認証の推奨: ループバックでも **Token** を維持し、ローカル WS クライアントにも認証を要求します。
    - トークンモードでは、対話型セットアップで次を提示します:
      - **プレーンテキストトークンを生成/保存** (デフォルト)
      - **SecretRef を使用** (オプトイン)
      - クイックスタートは、オンボーディングのプローブ/ダッシュボードブートストラップ用に、`env`、`file`、`exec` プロバイダーにまたがる既存の `gateway.auth.token` SecretRef を再利用します。
      - その SecretRef が設定されているが解決できない場合、オンボーディングはランタイム認証を黙って弱めるのではなく、明確な修正メッセージとともに早期に失敗します。
    - パスワードモードでは、対話型セットアップはプレーンテキストまたは SecretRef 保存もサポートします。
    - 非対話型トークン SecretRef パス: `--gateway-token-ref-env <ENV_VAR>`。
      - オンボーディングプロセス環境内に空でない環境変数が必要です。
      - `--gateway-token` と組み合わせることはできません。
    - すべてのローカルプロセスを完全に信頼できる場合にのみ認証を無効化してください。
    - 非ループバックバインドでは引き続き認証が必要です。

  </Step>
  <Step title="チャンネル">
    - [WhatsApp](/ja-JP/channels/whatsapp): 任意の QR ログイン。
    - [Telegram](/ja-JP/channels/telegram): bot トークン。
    - [Discord](/ja-JP/channels/discord): bot トークン。
    - [Google Chat](/ja-JP/channels/googlechat): サービスアカウント JSON + Webhook オーディエンス。
    - [Mattermost](/ja-JP/channels/mattermost) (Plugin): bot トークン + ベース URL。
    - [Signal](/ja-JP/channels/signal) (Plugin): 任意の `signal-cli` インストール + アカウント設定。
    - [iMessage](/ja-JP/channels/imessage): `imsg` CLI パス + Messages DB アクセス。Gateway が Mac 以外で動作する場合は SSH ラッパーを使用します。
    - Discord、Feishu、Microsoft Teams、QQ Bot、Slack、その他のチャンネルは、
      オンボーディングがインストールできる plugins として出荷されます。完全なカタログ: [チャンネル](/ja-JP/channels)。
    - DM セキュリティ: デフォルトはペアリングです。最初の DM がコードを送信します。`openclaw pairing approve <channel> <code>` で承認するか、許可リストを使用します。

  </Step>
  <Step title="Web 検索">
    - Brave、Codex (Hosted Search)、DuckDuckGo、Exa、Firecrawl、Gemini、Grok、Kimi、MiniMax Search、Ollama Web Search、Parallel、Perplexity、SearXNG、Tavily などのサポート済みプロバイダーを選択します (またはスキップ)。
    - API ベースのプロバイダーは、素早いセットアップのために環境変数または既存設定を使用できます。キー不要のプロバイダーは、それぞれのプロバイダー固有の前提条件を使用します。
    - `--skip-search` でスキップします。
    - 後で設定: `openclaw configure --section web`。

  </Step>
  <Step title="デーモンインストール">
    - macOS: LaunchAgent
      - ログイン済みユーザーセッションが必要です。ヘッドレスではカスタム LaunchDaemon (未同梱) を使用してください。
    - Linux (および WSL2 経由の Windows): systemd ユーザーユニット
      - オンボーディングは `loginctl enable-linger <user>` で lingering の有効化を試み、ログアウト後も Gateway が動作し続けるようにします。
      - sudo の入力を求める場合があります (`/var/lib/systemd/linger` に書き込みます)。まず sudo なしで試行します。
    - ネイティブ Windows: まず Scheduled Task。タスク作成が拒否された場合、OpenClaw はユーザーごとの Startup フォルダーのログイン項目にフォールバックし、Gateway を即座に起動します。
    - **ランタイム選択:** Node (推奨。WhatsApp/Telegram では必須 - Bun は再接続時にメモリを破損する可能性があります)。対話型では Node のみ提示されます。`--daemon-runtime bun` は CLI 専用です。
    - トークン認証にトークンが必要で、`gateway.auth.token` が SecretRef 管理の場合、デーモンインストールはそれを検証しますが、解決済みプレーンテキストトークン値をスーパーバイザーサービス環境メタデータに永続化しません。
    - トークン認証にトークンが必要で、設定済みトークン SecretRef が未解決の場合、デーモンインストールは実行可能なガイダンスとともにブロックされます。
    - `gateway.auth.token` と `gateway.auth.password` の両方が設定されていて、`gateway.auth.mode` が未設定の場合、モードが明示的に設定されるまでデーモンインストールはブロックされます。

  </Step>
  <Step title="ヘルスチェック">
    - Gateway を起動し (必要な場合)、`openclaw health` を実行します。
    - ヒント: `openclaw status --deep` は、サポートされている場合のチャンネルプローブを含め、ライブ Gateway ヘルスプローブをステータス出力に追加します (到達可能な Gateway が必要です)。

  </Step>
  <Step title="Skills (推奨)">
    - 利用可能な Skills を読み取り、要件を確認します。
    - node マネージャーを選択できます: **npm / pnpm / bun**。
    - 信頼済みの同梱 Skills の任意依存関係を自動インストールします (一部は macOS で Homebrew を使用します)。
    - Homebrew、uv、または Go インストーラーの前提条件が利用できない Skills をスキップし、手動セットアップガイダンスとともにグループ化して、前提条件をインストールした後に `openclaw doctor` を案内します。

  </Step>
  <Step title="完了">
    - 概要 + 次のステップ。Terminal、Browser、または後で、に対する **エージェントをどのように hatch しますか?** プロンプトを含みます。

  </Step>
</Steps>

<Note>
GUI が検出されない場合、オンボーディングはブラウザを開く代わりに Control UI 用の SSH ポートフォワード手順を表示します。
Control UI アセットがない場合、オンボーディングはそれらのビルドを試みます。フォールバックは `pnpm ui:build` (UI 依存関係を自動インストール) です。
</Note>

## 非対話型モード

オンボーディングを自動化またはスクリプト化するには `--non-interactive --accept-risk` を使用します (この
フラグは必須のリスク確認です。指定しない場合、オンボーディングはエラーで
終了します):

```bash
openclaw onboard --non-interactive --accept-risk \
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

非対話型モードでの Gateway トークン SecretRef:

```bash
export OPENCLAW_GATEWAY_TOKEN="your-token"
openclaw onboard --non-interactive --accept-risk \
  --mode local \
  --auth-choice skip \
  --gateway-auth token \
  --gateway-token-ref-env OPENCLAW_GATEWAY_TOKEN
```

`--gateway-token` と `--gateway-token-ref-env` は相互に排他的です。

<Note>
`--json` は非対話モードを**意味しません**。スクリプトでは `--non-interactive --accept-risk`（および `--workspace`）を使用してください。
</Note>

プロバイダー固有のコマンド例は [CLI 自動化](/ja-JP/start/wizard-cli-automation#provider-specific-examples) にあります。
フラグの意味とステップの順序については、このリファレンスページを使用してください。

### エージェントを追加する（非対話）

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.5 \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

`main` は予約済みのエージェント ID であり、`openclaw agents add` には使用できません。

## Gateway ウィザード RPC

Gateway は RPC（`wizard.start`、`wizard.next`、`wizard.cancel`、`wizard.status`）経由でオンボーディングフローを公開します。
クライアント（macOS アプリ、Control UI）は、オンボーディングロジックを再実装せずにステップをレンダリングできます。

## Signal セットアップ（signal-cli）

オンボーディングは `signal-cli` が `PATH` 上にあるかどうかを検出し、見つからない場合はインストールを提案します。

- Linux x86-64: `signal-cli` GitHub リリースから公式のネイティブ GraalVM ビルドをダウンロードし、`~/.openclaw/tools/signal-cli/<version>/` の下に保存します。
- macOS とその他のアーキテクチャ: 代わりに Homebrew 経由でインストールします。
- ネイティブ Windows: まだサポートされていません。Linux のインストールパスを使うには、WSL2 内でオンボーディングを実行してください。
- どちらの場合も、設定に `channels.signal.cliPath` を書き込みます。

## ウィザードが書き込む内容

`~/.openclaw/openclaw.json` の典型的なフィールド:

- `agents.defaults.workspace`
- `--skip-bootstrap` が渡された場合の `agents.defaults.skipBootstrap`
- `agents.defaults.model` / `models.providers` (Minimax を選択した場合)
- `tools.profile` (local オンボーディングでは未設定の場合 `"coding"` がデフォルトになります。既存の明示的な値は保持されます)
- `gateway.*` (mode、bind、auth、tailscale)
- `session.dmScope` (local オンボーディングでは未設定の場合 `"per-channel-peer"` がデフォルトになります。既存の明示的な値は保持されます。詳細: [CLI セットアップリファレンス](/ja-JP/start/wizard-cli-reference#outputs-and-internals))
- `channels.telegram.botToken`、`channels.discord.token`、`channels.matrix.*`、`channels.signal.*`、`channels.imessage.*`
- チャンネルプロンプト中にオプトインした場合のチャンネル DM 許可リスト。Discord、Matrix、Microsoft Teams、Slack は可能な場合に名前を ID に解決します。他のチャンネルは ID を直接受け取ります (たとえば数値の Telegram 送信者 ID や WhatsApp 電話番号)。
- `skills.install.nodeManager`
  - `setup --node-manager` は `npm`、`pnpm`、または `bun` を受け付けます。
  - 手動設定では、`skills.install.nodeManager` を直接設定することで引き続き `yarn` を使用できます。
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`
- `wizard.securityAcknowledgedAt`

`openclaw agents add` は `agents.list[]` と任意の `bindings` を書き込みます。

WhatsApp 認証情報は `~/.openclaw/credentials/whatsapp/<accountId>/` の下に入ります。
セッションは `~/.openclaw/agents/<agentId>/sessions/` の下に保存されます。

一部のチャンネルは plugins として提供されます。セットアップ中にそのいずれかを選択すると、オンボーディングは設定できるようにする前に、それをインストールするよう促します (npm または local パス)。

## 関連ドキュメント

- オンボーディング概要: [オンボーディング (CLI)](/ja-JP/start/wizard)
- CLI セットアップリファレンス: [CLI セットアップリファレンス](/ja-JP/start/wizard-cli-reference)
- macOS アプリのオンボーディング: [オンボーディング](/ja-JP/start/onboarding)
- 設定リファレンス: [Gateway 設定](/ja-JP/gateway/configuration)
- プロバイダー: [WhatsApp](/ja-JP/channels/whatsapp), [Telegram](/ja-JP/channels/telegram), [Discord](/ja-JP/channels/discord), [Google Chat](/ja-JP/channels/googlechat), [Signal](/ja-JP/channels/signal), [iMessage](/ja-JP/channels/imessage)
- Skills: [Skills](/ja-JP/tools/skills), [Skills 設定](/ja-JP/tools/skills-config)
