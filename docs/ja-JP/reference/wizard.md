---
read_when:
    - 特定のオンボーディング手順またはフラグを調べる
    - 非対話モードによるオンボーディングの自動化
    - オンボーディング動作のデバッグ
sidebarTitle: Onboarding Reference
summary: CLI オンボーディングの完全リファレンス：すべての手順、フラグ、設定フィールド
title: オンボーディングリファレンス
x-i18n:
    generated_at: "2026-07-14T14:02:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: 6c345887da0102c73f72623105d052ea9262006206dd70bae8f94aad1349423d
    source_path: reference/wizard.md
    workflow: 16
---

これは `openclaw onboard` の完全なリファレンスです。
概要については、[オンボーディング（CLI）](/ja-JP/start/wizard)を参照してください。手順ごとの
動作と出力については、[CLI セットアップリファレンス](/ja-JP/start/wizard-cli-reference)を参照してください。

## フローの詳細（ローカルモード）

<Steps>
  <Step title="リセット（任意）">
    - `--reset` はセットアップの実行前に状態をリセットします。指定しない場合、オンボーディングを再実行しても
      既存の設定が維持され、デフォルト値として再利用されます。
    - `--reset-scope` は、`--reset` が削除する対象を制御します。`config`（設定ファイル
      のみ）、`config+creds+sessions`（デフォルト）、または `full`（ワークスペースも
      削除）を指定できます。
    - 設定ファイルが無効な場合、オンボーディングは停止し、先に
      `openclaw doctor` を実行してからセットアップを再実行するよう案内します。
    - リセットでは状態をゴミ箱に移動します（直接削除することはありません）。

  </Step>
  <Step title="リスクの確認">
    - 初回実行時（または `wizard.securityAcknowledgedAt` が設定される前のすべての実行時）には、
      エージェントが強力であり、システム全体へのアクセスにはリスクがあることを理解しているか
      確認を求めます。
    - `--non-interactive` では `--accept-risk` を明示的に指定する必要があります。指定しない場合、
      オンボーディングは確認を求めず、エラーで終了します。
    - 対話形式の実行では、フラグの代わりに確認プロンプトが表示されます。拒否すると
      セットアップがキャンセルされます。

  </Step>
  <Step title="モデル／認証">
    - **Anthropic API キー**：`ANTHROPIC_API_KEY` が存在する場合はそれを使用し、存在しない場合はキーの入力を求め、デーモンで使用できるよう保存します。
    - **Anthropic Claude CLI**：Claude CLI へのサインインがすでに存在する場合に推奨されるローカルパスです。OpenClaw は代替手段として Anthropic セットアップトークン認証も引き続きサポートします。
    - **OpenAI Code（Codex）サブスクリプション（OAuth）**：ブラウザフローを使用し、`code#state` を貼り付けます。
      - プライマリモデルがない新規セットアップでは、Codex ランタイムを通じて `agents.defaults.model` を `openai/gpt-5.6-sol` に設定します。
    - **OpenAI Code（Codex）サブスクリプション（デバイスペアリング）**：有効期間の短いデバイスコードを使用するブラウザペアリングフローです。
      - プライマリモデルがない新規セットアップでは、Codex ランタイムを通じて `agents.defaults.model` を `openai/gpt-5.6-sol` に設定します。
    - **OpenAI API キー**：`OPENAI_API_KEY` が存在する場合はそれを使用し、存在しない場合はキーの入力を求め、認証プロファイルに保存します。
      - プライマリモデルがない新規セットアップでは、`agents.defaults.model` を `openai/gpt-5.6` に設定します。修飾子のない直接 API モデル ID は Sol ティアに解決されます。
    - OpenAI の追加または再認証では、`openai/gpt-5.5` を含む、明示的に設定済みのプライマリモデルが維持されます。アカウントで GPT-5.6 が提供されていない場合は、`openai/gpt-5.5` を明示的に選択してください。OpenClaw が暗黙にモデルをダウングレードすることはありません。
    - **xAI OAuth**：localhost コールバックを必要としないデバイスコード方式のブラウザサインインであるため、SSH／Docker／VPS 経由でも動作します（`--auth-choice xai-oauth`）。
    - **xAI API キー**：`XAI_API_KEY` の入力を求めます（`--auth-choice xai-api-key`）。
    - `--auth-choice xai-device-code` は、同じ xAI OAuth デバイスコードフロー用の手動専用互換エイリアスとして引き続き動作します。新しいスクリプトでは `xai-oauth` を使用してください。
    - **OpenCode**：`OPENCODE_API_KEY`（または `OPENCODE_ZEN_API_KEY`。https://opencode.ai/auth で取得）の入力を求め、Zen または Go カタログを選択できます。
    - **Ollama**：最初に **クラウド＋ローカル**、**クラウドのみ**、または **ローカルのみ** を提示します。`Cloud only` は `OLLAMA_API_KEY` の入力を求め、`https://ollama.com` を使用します。ホストを使用するモードでは Ollama のベース URL（デフォルトは `http://127.0.0.1:11434`）の入力を求め、利用可能なモデルを検出し、必要に応じて選択したローカルモデルを自動的に取得します。`Cloud + Local` では、その Ollama ホストがクラウドアクセス用にサインイン済みかどうかも確認します。
    - 詳細：[Ollama](/ja-JP/providers/ollama)
    - **API キー**：キーを保存します。
    - **Vercel AI Gateway（マルチモデルプロキシ）**：`AI_GATEWAY_API_KEY` の入力を求めます。
    - 詳細：[Vercel AI Gateway](/ja-JP/providers/vercel-ai-gateway)
    - **Cloudflare AI Gateway**：Account ID、Gateway ID、`CLOUDFLARE_AI_GATEWAY_API_KEY` の入力を求めます。
    - 詳細：[Cloudflare AI Gateway](/ja-JP/providers/cloudflare-ai-gateway)
    - **MiniMax**：設定は自動的に書き込まれます。ホスト型のデフォルトは `MiniMax-M3` です。
      API キーのセットアップでは `minimax/...` を使用し、OAuth のセットアップでは
      `minimax-portal/...` を使用します。
    - 詳細：[MiniMax](/ja-JP/providers/minimax)
    - **StepFun**：中国またはグローバルのエンドポイント上の StepFun standard または Step Plan 用に、設定が自動的に書き込まれます。
    - standard の現在のデフォルトは `step-3.5-flash` です。Step Plan には `step-3.5-flash-2603` も含まれます。
    - 詳細：[StepFun](/ja-JP/providers/stepfun)
    - **Synthetic（Anthropic 互換）**：`SYNTHETIC_API_KEY` の入力を求めます。
    - 詳細：[Synthetic](/ja-JP/providers/synthetic)
    - **Moonshot（Kimi K2）**：設定は自動的に書き込まれます。
    - **Kimi Coding**：設定は自動的に書き込まれます。
    - 詳細：[Moonshot AI（Kimi＋Kimi Coding）](/ja-JP/providers/moonshot)
    - **カスタムプロバイダー**：OpenAI 互換、OpenAI Responses 互換、または Anthropic 互換のエンドポイントで動作します。非対話形式のフラグ：`--auth-choice custom-api-key`、`--custom-base-url`、`--custom-model-id`、`--custom-api-key`（任意。`CUSTOM_API_KEY` にフォールバック）、`--custom-provider-id`（任意。ベース URL から自動導出）、`--custom-compatibility openai|openai-responses|anthropic`（デフォルトは `openai`）、`--custom-image-input`／`--custom-text-input`（推論されたビジョンモデル検出を上書き）。
    - **スキップ**：認証はまだ設定されません。
    - 検出された選択肢からデフォルトモデルを選択します（またはプロバイダー／モデルを手動で入力します）。最高の品質とプロンプトインジェクションのリスク低減のため、プロバイダースタックで利用可能な最新世代のうち最も高性能なモデルを選択してください。
    - オンボーディングはモデルチェックを実行し、設定されたモデルが不明である場合や認証がない場合に警告します。
    - API キーの保存モードでは、デフォルトで認証プロファイルにプレーンテキスト値を保存します。代わりに環境変数を参照する値（例：`keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`）を保存するには、`--secret-input-mode ref` を使用してください。参照先の環境変数があらかじめ設定されていない場合、オンボーディングは即座に失敗します。
    - 認証プロファイルは `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`（API キー＋OAuth）にあります。`~/.openclaw/credentials/oauth.json` は従来形式からのインポート専用です。
    - 詳細：[OAuth](/ja-JP/concepts/oauth)
    <Note>
    ヘッドレス／サーバー向けのヒント：ブラウザを備えたマシンで OAuth を完了してから、その
    エージェントの `auth-profiles.json`（例：
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`、または対応する
    `$OPENCLAW_STATE_DIR/...` パス）を Gateway ホストにコピーします。`credentials/oauth.json`
    は従来形式からのインポート元としてのみ使用されます。
    </Note>
  </Step>
  <Step title="ワークスペース">
    - デフォルトは `~/.openclaw/workspace` です（設定可能）。
    - エージェントのブートストラップ手順に必要なワークスペースファイルを初期配置します。
    - ワークスペースの完全なレイアウトとバックアップガイド：[エージェントワークスペース](/ja-JP/concepts/agent-workspace)

  </Step>
  <Step title="Gateway">
    - ポート（デフォルトは **18789**）、バインド、認証モード、Tailscale への公開。
    - 認証の推奨事項：local loopback でも **トークン** を維持し、ローカルの WS クライアントにも認証を必須にしてください。
    - トークンモードの対話形式セットアップでは、次の選択肢が提示されます。
      - **プレーンテキストトークンを生成／保存**（デフォルト）
      - **SecretRef を使用**（オプトイン）
      - クイックスタートでは、オンボーディングのプローブ／ダッシュボードのブートストラップ用に、`env`、`file`、`exec` の各プロバイダーにまたがって既存の `gateway.auth.token` SecretRef を再利用します。
      - その SecretRef が設定されていても解決できない場合、ランタイム認証を暗黙に弱めるのではなく、明確な修正メッセージを表示してオンボーディングを早期に失敗させます。
    - パスワードモードの対話形式セットアップでも、プレーンテキストまたは SecretRef での保存をサポートします。
    - 非対話形式のトークン SecretRef パス：`--gateway-token-ref-env <ENV_VAR>`。
      - オンボーディングプロセスの環境に、空でない環境変数が必要です。
      - `--gateway-token` と組み合わせることはできません。
    - すべてのローカルプロセスを完全に信頼できる場合にのみ、認証を無効にしてください。
    - local loopback 以外へのバインドでは、引き続き認証が必要です。

  </Step>
  <Step title="チャンネル">
    - [WhatsApp](/ja-JP/channels/whatsapp)：任意の QR ログイン。
    - [Telegram](/ja-JP/channels/telegram)：ボットトークン。
    - [Discord](/ja-JP/channels/discord)：ボットトークン。
    - [Google Chat](/ja-JP/channels/googlechat)：サービスアカウント JSON＋Webhook オーディエンス。
    - [Mattermost](/ja-JP/channels/mattermost)（Plugin）：ボットトークン＋ベース URL。
    - [Signal](/ja-JP/channels/signal)（Plugin）：任意の `signal-cli` インストール＋アカウント設定。
    - [iMessage](/ja-JP/channels/imessage)：`imsg` CLI パス＋Messages DB へのアクセス。Gateway が Mac 以外で動作する場合は SSH ラッパーを使用します。
    - Discord、Feishu、Microsoft Teams、QQ Bot、Slack、およびその他のチャンネルは、
      オンボーディングでインストールできる Plugin として提供されます。完全なカタログ：[チャンネル](/ja-JP/channels)。
    - DM のセキュリティ：デフォルトはペアリングです。最初の DM でコードが送信されます。`openclaw pairing approve <channel> <code>` で承認するか、許可リストを使用してください。

  </Step>
  <Step title="ウェブ検索">
    - Brave、Codex（ホスト型検索）、DuckDuckGo、Exa、Firecrawl、Gemini、Grok、Kimi、MiniMax Search、Ollama Web Search、Parallel、Perplexity、SearXNG、Tavily など、サポートされているプロバイダーを選択します（またはスキップします）。
    - API を使用するプロバイダーでは、環境変数または既存の設定を使用してすばやくセットアップできます。キー不要のプロバイダーでは、代わりに各プロバイダー固有の前提条件を使用します。
    - `--skip-search` でスキップします。
    - 後で設定する場合：`openclaw configure --section web`。

  </Step>
  <Step title="デーモンのインストール">
    - macOS：LaunchAgent
      - ログイン済みのユーザーセッションが必要です。ヘッドレス環境では、カスタム LaunchDaemon（同梱されていません）を使用してください。
    - Linux（および WSL2 経由の Windows）：systemd ユーザーユニット
      - ログアウト後も Gateway が稼働し続けるよう、オンボーディングは `loginctl enable-linger <user>` を使用して lingering の有効化を試みます。
      - sudo の入力を求める場合があります（`/var/lib/systemd/linger` に書き込みます）。最初は sudo なしで試行します。
    - ネイティブ Windows：最初に Scheduled Task を使用します。タスクの作成が拒否された場合、OpenClaw はユーザー単位の Startup フォルダーのログイン項目にフォールバックし、Gateway を即座に起動します。
    - **ランタイムの選択：** 標準のランタイム状態ストアが `node:sqlite` を使用するため、Node が必要です。従来の Bun サービスは修復時に Node へ移行されます。
    - トークン認証にトークンが必要で、`gateway.auth.token` が SecretRef で管理されている場合、デーモンのインストールではその値を検証しますが、解決済みのプレーンテキストトークン値をスーパーバイザーサービスの環境メタデータに永続化しません。
    - トークン認証にトークンが必要で、設定されたトークン SecretRef を解決できない場合、実行可能な対処方法を示してデーモンのインストールをブロックします。
    - `gateway.auth.token` と `gateway.auth.password` の両方が設定され、`gateway.auth.mode` が未設定の場合、モードが明示的に設定されるまでデーモンのインストールをブロックします。

  </Step>
  <Step title="ヘルスチェック">
    - Gateway を起動し（必要な場合）、`openclaw health` を実行します。
    - ヒント：`openclaw status --deep` を指定すると、サポートされている場合のチャンネルプローブを含む、稼働中の Gateway のヘルスプローブがステータス出力に追加されます（到達可能な Gateway が必要です）。

  </Step>
  <Step title="Skills（推奨）">
    - 利用可能な Skills を読み込み、要件を確認します。
    - Node マネージャーを選択できます：**npm / pnpm / bun**。
    - 信頼された同梱 Skills の任意依存関係を自動的にインストールします（一部は macOS で Homebrew を使用します）。
    - Homebrew、uv、または Go インストーラーの前提条件を利用できない Skills をスキップし、手動セットアップの案内とともにグループ化し、前提条件のインストール後に `openclaw doctor` を案内します。

  </Step>
  <Step title="完了">
    - 概要と次のステップ。Terminal、Browser、または後で行うかを選択する **How do you want to hatch your agent?** プロンプトを含みます。

  </Step>
</Steps>

<Note>
GUI が検出されない場合、オンボーディングはブラウザを開く代わりに、Control UI 用の SSH ポートフォワーディング手順を表示します。
Control UI のアセットがない場合、オンボーディングはそのビルドを試みます。フォールバックは `pnpm ui:build` です（UI の依存関係を自動インストールします）。
</Note>

## 非対話モード

オンボーディングを自動化またはスクリプト化するには `--non-interactive --accept-risk` を使用します（このフラグは必須のリスク承認です。指定しない場合、オンボーディングはエラーで終了します）。

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

機械可読な概要を出力するには `--json` を追加します。

非対話モードでの Gateway トークン SecretRef：

```bash
export OPENCLAW_GATEWAY_TOKEN="your-token"
openclaw onboard --non-interactive --accept-risk \
  --mode local \
  --auth-choice skip \
  --gateway-auth token \
  --gateway-token-ref-env OPENCLAW_GATEWAY_TOKEN
```

`--gateway-token` と `--gateway-token-ref-env` は同時に使用できません。

<Note>
`--json` は非対話モードを意味するものでは**ありません**。スクリプトでは `--non-interactive --accept-risk`（および `--workspace`）を使用してください。
</Note>

プロバイダー固有のコマンド例については、[CLI 自動化](/ja-JP/start/wizard-cli-automation#provider-specific-examples)を参照してください。
フラグの意味とステップの順序については、このリファレンスページを使用してください。

### エージェントを追加する（非対話）

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.6-sol \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

`main` は予約済みのエージェント ID であり、`openclaw agents add` には使用できません。

## Gateway ウィザード RPC

Gateway はオンボーディングフローを RPC 経由で公開します（`wizard.start`、`wizard.next`、`wizard.cancel`、`wizard.status`）。
クライアント（macOS アプリ、Control UI）は、オンボーディングロジックを再実装せずにステップをレンダリングできます。

## Signal のセットアップ（signal-cli）

オンボーディングは `signal-cli` が `PATH` 上にあるかどうかを検出し、ない場合はインストールを提案します。

- Linux x86-64：`signal-cli` の GitHub リリースから公式のネイティブ GraalVM ビルドをダウンロードし、`~/.openclaw/tools/signal-cli/<version>/` 配下に保存します。
- macOS およびその他のアーキテクチャ：代わりに Homebrew 経由でインストールします。
- ネイティブ Windows：まだサポートされていません。Linux のインストールパスを利用するには、WSL2 内でオンボーディングを実行してください。
- いずれの場合も、設定に `channels.signal.cliPath` を書き込みます。

## ウィザードが書き込む内容

`~/.openclaw/openclaw.json` の一般的なフィールド：

- `agents.defaults.workspace`
- `--skip-bootstrap` が渡された場合の `agents.defaults.skipBootstrap`
- `agents.defaults.model` / `models.providers`（Minimax を選択した場合）
- `tools.profile`（未設定の場合、ローカルオンボーディングではデフォルトで `"coding"` が設定されます。既存の明示的な値は保持されます）
- `gateway.*`（モード、バインド、認証、Tailscale）
- `session.dmScope`（未設定の場合、ローカルオンボーディングではデフォルトで `"per-channel-peer"` が設定されます。既存の明示的な値は保持されます。詳細：[CLI セットアップリファレンス](/ja-JP/start/wizard-cli-reference#outputs-and-internals)）
- `channels.telegram.botToken`、`channels.discord.token`、`channels.matrix.*`、`channels.signal.*`、`channels.imessage.*`
- チャンネルのプロンプトでオプトインした場合の、チャンネル DM 許可リスト。Discord、Matrix、Microsoft Teams、Slack では、可能な場合に名前を ID に解決します。その他のチャンネルでは ID を直接指定します（たとえば、数値の Telegram 送信者 ID や WhatsApp の電話番号）。
- `skills.install.nodeManager`
  - `setup --node-manager` は、`npm`、`pnpm`、または `bun` を受け付けます。
  - 手動設定では、`skills.install.nodeManager` を直接設定することで、引き続き `yarn` を使用できます。
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`
- `wizard.securityAcknowledgedAt`

`openclaw agents add` は `agents.list[]` と、任意の `bindings` を書き込みます。

WhatsApp の認証情報は `~/.openclaw/credentials/whatsapp/<accountId>/` 配下に保存されます。
アクティブなセッションとトランスクリプトは
`~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite` に保存されます。
`~/.openclaw/agents/<agentId>/sessions/` ディレクトリは、レガシーマイグレーションの
入力、およびアーカイブやサポート用の成果物に使用されます。

一部のチャンネルは Plugin として提供されます。セットアップ中にそのいずれかを選択すると、設定可能になる前に、オンボーディングがそのインストール（npm またはローカルパス）を求めます。

## 関連ドキュメント

- オンボーディングの概要：[オンボーディング（CLI）](/ja-JP/start/wizard)
- CLI セットアップリファレンス：[CLI セットアップリファレンス](/ja-JP/start/wizard-cli-reference)
- macOS アプリのオンボーディング：[オンボーディング](/ja-JP/start/onboarding)
- 設定リファレンス：[Gateway の設定](/ja-JP/gateway/configuration)
- プロバイダー：[WhatsApp](/ja-JP/channels/whatsapp)、[Telegram](/ja-JP/channels/telegram)、[Discord](/ja-JP/channels/discord)、[Google Chat](/ja-JP/channels/googlechat)、[Signal](/ja-JP/channels/signal)、[iMessage](/ja-JP/channels/imessage)
- Skills：[Skills](/ja-JP/tools/skills)、[Skills の設定](/ja-JP/tools/skills-config)
